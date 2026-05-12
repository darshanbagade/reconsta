import mongoose from "mongoose";

const  exceptionSchema = mongoose.Schema({
    anomalyId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Anomaly",
        required : true
    },
    assignedTo:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        default : null
    },
    priority:{
        type : String,
        enum : [ 'critical', 'high', 'medium', 'low'],
        default : 'low'
    },
    slaDeadline : {
        type: Date,
        required : true
    },
    //to track analyst
    slaStatus:{
        type: String,
        enum : [ 'on_track', 'at_risk', 'breached'],
        default : 'on_track'
    },
    // current state of anomaly resolution
    status : {
        type : String,
        enum :[ 'open', 'resolved', 'escalated'],
        default : 'open'
    },
    // analyst will write note while resolving anomaly
    resolution : {
        type  : String,
        default: ''
    },
    resolvedAt:{
        type : Date,
        default : null
    },
    // If analyst does not resolve, it will be escalated to supervisor
    escalatedTo : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        default : null
    }
}, { timestamps : true })

// Helps analysts quickly fetch their assigned open exceptions
exceptionSchema.index({ assignedTo: 1, status: 1 })

// Helps SLA checker quickly find at-risk or breached exceptions
exceptionSchema.index({ slaStatus: 1, slaDeadline: 1 })

// Helps supervisors quickly find high-priority open exceptions
exceptionSchema.index({ priority: 1, status: 1 })

const Exception = mongoose.model('Exception', exceptionSchema);

export default Exception;