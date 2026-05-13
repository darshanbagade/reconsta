import express from 'express'
import cors from 'cors'
import { env } from './config/env.js';
import errorHandler from './middleware/errorHandler.js';

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

app.get('/health',(req,res)=>{
    res.json({
        success:true,
        message:'Reconsta API is running'
    })
})

// errorHandler will be called if an error occurs in routes/controllers/middleware
app.use(errorHandler);

export default app;