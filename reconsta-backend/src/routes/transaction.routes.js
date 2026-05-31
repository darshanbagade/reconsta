import { Router } from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { 
    uploadTransaction,
    getTransactions,
    getTransactionById,
    getTransactionSessions,
    getSessionSummary,
    deleteTransactionSession
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


// Get the transaction list with filtering and pagination
transactionRouter.get('/', verifyJWT, getTransactions)

// Get transaction sessions for a particular batch
transactionRouter.get('/sessions', verifyJWT, getTransactionSessions );

// Get summary for a particular session
transactionRouter.get('/session/:sessionId/summary', verifyJWT, getSessionSummary);

//delete all the transactions associated with sessionId
transactionRouter.delete(
    '/session/:sessionId',
    verifyJWT,
    authorizeRoles('admin'),
    deleteTransactionSession
)

// single transaction details
transactionRouter.get('/:id', verifyJWT, getTransactionById)



export default transactionRouter;