import jwt  from 'jsonwebtoken'
import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';
import User from '../models/User.model.js';
const verifyJWT = async (req, res, next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace('Bearer ', '');
   
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, env.JWT_ACCESS_SECRET)

        const user = await User.findById(decodedToken?.id)


        if(!user){
            throw new ApiError(401, 'Invalid Access Token')
        }

        if(!user.isActive){
            throw new ApiError(403, 'Account is inactive')
        }

        req.user = user
        next();

    } catch (error) {
         next(error)
    }
}

export default verifyJWT;