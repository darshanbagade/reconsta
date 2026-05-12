import mongoose from "mongoose";

const riskBreakdownSchema = mongoose.Schema({
    amountFactor : { 
        type : Number,
        default : 0
    },
    timeFactor : {
        type : Number,
        default : 0
    },
    merchantFactor : {
        type : Number,
        default : 0
    },
    recurrenceFactor :{
        type : Number,
        default : 0
    },
    
},{ _id : false })

const anomalySchema = mongoose.Schema({
    bankTxnId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Transaction',
        default : null
    },
    posTxnId:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Transaction',
        default : null
    },
    //anomaly type
    type : {
        type : String,
        enum :  ['unmatched', 'duplicate', 'mismatch', 'ghost'],
        required : true
    },
    // riskScore = amountFactor + timeFactor + merchantFactor + recurrenceFactor
    riskScore : {
        type : Number,
        min : 0,
        max : 100, 
        default :0
    },
    // risk score will be calculated on the basis of riskBreakdown parameters
    riskBreakdown:{
        type : riskBreakdownSchema,
        default : () => ({}) // it will bydefault 0 to all parameter, otherwise undefined

    },
    status : {
        type : String,
        enum : [ 'open', 'in_review', 'resolved'],
        default : 'open'
    },
    detectedAt : {
        type : Date,
        default : Date.now
    }
}, { timestamps : true })

// don't use arrow function here because we can't use 'this' (for the reference) in arrow function
anomalySchema.pre('validate',function(next){
    if(!this.bankTxnId && !this.posTxnId){
        return next(new Error("Atleast one transaction reference is required"))
    }

    next();
})

/*
when index used:
    status: 1 -> search fast on the basis of 'status' field
    riskScore: -1 -> serach in descending order on the basis of ridkScore(High risk anomaly first)
    Query : Anomaly.find({ status: 'open' }).sort({ riskScore: -1 }) 
    - Find the open anamolies first
    - Show highest riskScore anomaly first
*/ 
anomalySchema.index({status : 1, riskScore:-1});

// Used for filtering anomalies by type: unmatched, duplicate, mismatch, ghost
anomalySchema.index({type : 1}) // search on the basis of anomaly type

// Used for showing latest detected anomalies first
anomalySchema.index({detectedAt : -1}) 


/*
    MongoDB chooses best matching index based on the query 
    Not all indexes are applied every time.

    Without indexing, MongoDB may scan all documents.
    With indexing, MongoDB can search/filter/sort faster based on query pattern.
 */


const Anomaly = mongoose.model('Anomaly',anomalySchema);

export default Anomaly;