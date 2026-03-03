class ApiResponse {
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    static error(res, message = 'Error', statusCode = 500, errors = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }

    static created(res, data = null, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    static noContent(res, message = 'No content') {
        return res.status(204).json({
            success: true,
            message,
        });
    }

    static badRequest(res, message = 'Bad request', errors = null) {
        return this.error(res, message, 400, errors);
    }

    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }

    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    static conflict(res, message = 'Conflict') {
        return this.error(res, message, 409);
    }

    static tooManyRequests(res, message = 'Too many requests') {
        return this.error(res, message, 429);
    }

    static internalError(res, message = 'Internal server error') {
        return this.error(res, message, 500);
    }
}

module.exports = ApiResponse;
