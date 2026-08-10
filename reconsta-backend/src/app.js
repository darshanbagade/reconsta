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
import insightRouter from './routes/insight.routes.js'
import userRouter from './routes/user.routes.js';
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const app = express();

app.use(
    cors({
        origin:env.CLIENT_URL,
        credentials : true //allow to get the creadentials to backend and send the response like cookies from backend
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
app.use('/api/insights', insightRouter)
app.use('/api/users/',userRouter)

// errorHandler will be called if an error occurs in routes/controllers/middleware
// Serve frontend SPA for any unknown GET route when a built client exists
try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    const candidateDistDirs = [
        path.resolve(__dirname, '..', '..', 'reconsta-frontend', 'dist'),
        path.resolve(__dirname, '..', 'reconsta-frontend', 'dist'),
        path.resolve(__dirname, '..', '..', '..', 'reconsta-frontend', 'dist'),
        path.resolve(__dirname, 'public'),
        path.resolve(process.cwd(), 'public'),
        path.resolve(process.cwd(), 'reconsta-frontend', 'dist'),
        path.resolve(process.cwd(), 'dist'),
        path.resolve(process.cwd(), '..', 'reconsta-frontend', 'dist')
    ]

    const clientDist = candidateDistDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html')))

    if (clientDist) {
        app.use(express.static(clientDist))

        app.get(/^\/(?!api\/).*/, (req, res, next) => {
            // Only handle GET requests that accept HTML and are not API routes
            if (req.method !== 'GET' || !req.accepts('html')) return next()

            res.sendFile(path.join(clientDist, 'index.html'))
        })
    } else {
        console.warn('Frontend build not found; SPA fallback is disabled.')
    }
} catch (err) {
    console.warn('Unable to configure SPA fallback:', err.message)
}

app.use(errorHandler);

export default app;