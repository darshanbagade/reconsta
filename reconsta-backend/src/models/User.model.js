import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    },
    email : {
        type:String,
        unique:true,
        required : true,
        lowercase : true,
        trim : true
    },
    password:{
        type : String,
        required : true,
        select : false // it will not be returned to the database query
    },
    role:{
        type : String,
        enum : ["analyst","supervisor","admin"],
        default: "analyst"
    },
    //admin will manage which user is active/blocked(if leave the company)
    isActive:{
        type : Boolean,
        default:true
    }
}, {timestamps = true})

const User = mongoose.model('User', userSchema);
export default User