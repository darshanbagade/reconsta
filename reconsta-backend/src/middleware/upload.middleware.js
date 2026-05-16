import multer from 'multer'
import ApiError from '../utils/ApiError.js'

const storage = multer.memoryStorage()


/*
    req = request object
    file = uploaded file details
    cb = callback function which tells multer to allow/reject the file
*/
const fileFilter = (req, file, cb) =>{
    if(file.mimetype === 'text/csv' || file.originalname.endsWith('.csv') ){
        cb(null, true)
    }else{
        cb(new ApiError(400, 'Only CSV files are allowed'), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits:{
        fileSize : 5 * 1024 * 1024
    }
})

export default upload;

// memoryStorage
// → The uploaded file will not be saved on disk.
// → It will be available directly in memory as a buffer.
// → This helps us parse the CSV immediately without storing temporary files.

// fileFilter
// → Allows only CSV files.
// → If the uploaded file is not CSV, it rejects the file with a clean API error.

// fileSize: 5MB
// → Limits each uploaded file to 5MB.
// → This prevents accidental large file uploads and protects server memory.