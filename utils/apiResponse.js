const sendResponse = (res, statusCode, message, data = null) => {
    res.status(statusCode).json({
        status: 'success',
        message,
        data,
    });
};

module.exports = sendResponse;
