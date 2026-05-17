import { Router } from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import { 
    uploadTransaction,
    getTransactions,
    getTransactionById,
    getTransactionSessions,
    getSessionSummary
} from "../controllers/transaction.controller.js";
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


//give all the transaction list  + filter pagination
transactionRouter.get('/', verifyJWT, getTransactions)

//transations of particular batch
transactionRouter.get('/sessions', verifyJWT, getTransactionSessions );

//get summary of single transaction
transactionRouter.get('/session/:sessionId/summary', verifyJWT, getSessionSummary);

// single transaction details
transactionRouter.get('/:id', verifyJWT, getTransactionById)



export default transactionRouter;