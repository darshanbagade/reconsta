import dotenv from 'dotenv'

dotenv.config({
    path: './.env',
    quiet : true
});

export const env = {

    PORT : process.env.PORT || 5000,
    MONGODB_URI : process.env.MONGODB_URI ,
    JWT_SECRET : process.env.JWT_SECRET,
    JWT_EXPIRE : process.env.JWT_EXPIRE,
    GEMINI_API_KEY : process.env.GEMINI_API_KEY,
    NODE_ENV : process.env.NODE_ENV || 'development',
    CLIENT_URL : process.env.CLIENT_URL || 'http://localhost:5173'

}