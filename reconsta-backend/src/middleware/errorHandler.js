const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || 500
    let message = error.message || 'Internal Server Error'

    if (error.name === 'MulterError') {
        statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400

        if (error.code === 'LIMIT_FILE_SIZE') {
            message = 'CSV file size must be less than 5MB'
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field. Use bankFile and posFile'
        } else {
            message = error.message
        }
    }

    return res.status(statusCode).json({
        success: false,
        message,
        errors: error.errors || []
    })
}

export default errorHandler