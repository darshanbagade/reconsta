import app from './app.js'
import { env } from './config/env.js';
import connectDB from './config/db.js'


connectDB()
    .then( () =>{
        //if any error comes while connecting the database
        app.on("error", (err)=>{
            console.log("Error : ",err)
            throw err
        })
        
        app.listen(env.PORT, ()=>{
            console.log(`Server is running on port ${env.PORT}`);
        })

    })
    .catch((error)=>{
        console.log("MongoDB connection failed : ", error.message);
        
    })