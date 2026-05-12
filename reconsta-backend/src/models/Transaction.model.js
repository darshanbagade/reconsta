import mongoose  from "mongoose";

const transactionSchema = mongoose.Schema({
    txnId :{
        type:String,
        required : true,
        trim : true
    },
    merchantId:{
        type : String,
        required : true,
        trim : true
    },
    merchantName:{
        type: String,
        required : true,
        trim : true
    },
    amount : {
        type : Number,
        required : true,
        min : 0
    },
    timestamp:{
        type : Date,
        required : true
    },
    source : {
        type : String,
        enum : ["bank","pos"],
        required : true
    },
    status : {
        type : String,
        enum : ["unprocessed","matched","fuzzy","unmatched"],
        default : "unprocessed"
    },
    confidence : {
        type : Number,
        min : 0,
        max : 100,
        default : null
    },
    /*
     ex - 
        bank_12_may.csv
        pos_12_may.csv
        - To campare the uploaded batch of the bank transaction with the batch same of POS transactions
        - sirf isi upload batch ke bank transactions ko isi batch ke POS transactions se compare karna hai.
        sessionId : "EC_2026_05_12_001"

    */
    sessionId : {
        type : String,
        required : true
    },
    matchedWith : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Transaction',
        default : null
    } 
}, { timestamps: true })

/*
    Workflow : 
    Upload two CSV files → 
    assign one common sessionId → 
    mark each transaction as bank or POS (source)→ 
    compare only bank and POS records from the same session → 
    create match or anomaly.
    
    1.
    index :  Make searching faster when we fetch transactions by sessionId and source, 
    because there are too many documents in the database.

    2.
    index : Do not allow duplicate transaction IDs for the same source.
    ex :
        BANK001 + bank → allowed once
        BANK001 + bank → duplicate error
        BANK001 + pos  → allowed, because source different hai
*/ 
transactionSchema.index({sessionId:1, source :1}) //fast searching speed
transactionSchema.index({txnId:1, source :1},{unique:true}) // speed + duplicate protection for same source


const Transaction = mongoose.model('Transaction',transactionSchema);

export default Transaction;