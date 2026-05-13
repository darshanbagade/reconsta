// Each controller has response format as { success, message, data }
const sendSuccess = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success : true,
        message,
        data
    })
}

export default sendSuccess;