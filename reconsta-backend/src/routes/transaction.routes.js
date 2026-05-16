import { Router } from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import { uploadTransaction } from "../controllers/transaction.controller.js";
import upload from "../middleware/upload.middleware.js";
const transactionRouter = Router()

transactionRouter.post(
    '/upload', 
    verifyJWT, 
    // → This tells Multer to expect two files: bankFile and posFile.
    // only files with naming 'bankFile' and 'posFile' will be accepted  
    upload.fields([
        { name: 'bankFile', maxCount: 1 },
        { name: 'posFile', maxCount: 1 }
    ]),
    uploadTransaction 
)

export default transactionRouter;