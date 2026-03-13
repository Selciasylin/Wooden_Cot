class AppError extends Error {
    constructor(message) {
        super(message);
        this.isOperational = true;   // important
    }
}

module.exports = AppError;