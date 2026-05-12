import mongoose from "mongoose";

const auditLogSchema = mongoose.Schema({
    exceptionId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Exception",
        required : true
    },
    performedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    // Example: assigned, resolved, escalated, note_added
    action : {
        type : String,
        required : true,

    },
    // Old data before the action
    previousValue: {
        type: mongoose.Schema.Types.Mixed, // Mixed -> flexible object can be added
        default: () => ({})
    },

    // New data after the action
    newValue: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({})
    },

    timestamp : {
        type : Date,
        default : Date.now
    }
}, { timestamps : true })

// On Exception Detail page, show all actions performed on this exception in latest-first order.
auditLogSchema.index({ exceptionId: 1, timestamp: -1 })

//Admin/Supervisor can check what actions a specific analyst performed.
auditLogSchema.index({ performedBy: 1, timestamp: -1 })


const AuditLog = mongoose.model('AuditLog',auditLogSchema);
export default AuditLog;