import express from 'express'
import cors from 'cors'
import { env } from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.routes.js';
import transactionRouter from './routes/transaction.routes.js';
import anomalyRouter from './routes/anomaly.routes.js';
import exceptionRouter from './routes/exception.routes.js';
import auditLogRouter from './routes/auditLog.routes.js'
import slaRouter from './routes/sla.routes.js'
import reconciliationRouter from './routes/reconciliation.routes.js' 
import dashboardRouter from './routes/dashboard.routes.js'

const app = express();

app.use(
    cors({
        origin:env.CLIENT_URL,
        credentials : true //allow to send the response like cookies
    })
)


app.use(express.json()) 

//urlencoded - tells how to read form-style data
// extended - allows to parse complex form data
app.use(express.urlencoded({ extended : true }))

app.use(cookieParser())

app.get('/health',(req,res)=>{
    res.json({
        success:true,
        message:'Reconsta API is running'
    })
})


app.use('/api/auth', authRouter)
app.use('/api/transactions', transactionRouter)
app.use('/api/anomalies',anomalyRouter);
app.use('/api/exceptions', exceptionRouter)
app.use('/api/audit-logs', auditLogRouter)
app.use('/api/sla', slaRouter)
app.use('/api/reconciliation', reconciliationRouter)
app.use('/api/dashboard', dashboardRouter)

// errorHandler will be called if an error occurs in routes/controllers/middleware
app.use(errorHandler);

export default app;