import dotenv from 'dotenv'

dotenv.config({
    path: './.env',
    quiet : true
});

export const env = {

    PORT : process.env.PORT || 5000,
    MONGODB_URI : process.env.MONGODB_URI ,
    
    JWT_ACCESS_SECRET : process.env.JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRE : process.env.JWT_ACCESS_EXPIRE,

    JWT_REFRESH_SECRET : process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRE : process.env.JWT_REFRESH_EXPIRE,

    JWT_EXPIRE : process.env.JWT_EXPIRE,
    GEMINI_API_KEY : process.env.GEMINI_API_KEY,
    NODE_ENV : process.env.NODE_ENV || 'development',
    CLIENT_URL : process.env.CLIENT_URL || 'http://localhost:5173'

}