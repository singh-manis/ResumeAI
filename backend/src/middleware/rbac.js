import { AppError } from './errorHandler.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access based on user roles
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError(
                `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                403
            );
        }

        next();
    };
};

/**
 * Check if user is a candidate
 */
export const isCandidate = (req, res, next) => {
    if (req.user?.role !== 'CANDIDATE') {
        console.warn(`[isCandidate] Access denied - userId: ${req.user?.id}, role: "${req.user?.role}", expected: "CANDIDATE"`);
        throw new AppError('This action is only available to candidates', 403);
    }
    next();
};


/**
 * Check if user is a recruiter or admin (admins have recruiter privileges)
 */
export const isRecruiter = (req, res, next) => {
    if (req.user?.role !== 'RECRUITER' && req.user?.role !== 'ADMIN') {
        throw new AppError('This action is only available to recruiters or admins', 403);
    }
    next();
};

/**
 * Check if user is an admin
 */
export const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        throw new AppError('This action is only available to administrators', 403);
    }
    next();
};

/**
 * Check if user is recruiter or admin
 */
export const isRecruiterOrAdmin = (req, res, next) => {
    if (!['RECRUITER', 'ADMIN'].includes(req.user?.role)) {
        throw new AppError('This action requires recruiter or admin privileges', 403);
    }
    next();
};

/**
 * Check if user owns the resource or is admin
 */
export const isOwnerOrAdmin = (userIdField = 'userId') => {
    return (req, res, next) => {
        const resourceUserId = req.params[userIdField] || req.body[userIdField];

        if (req.user.role === 'ADMIN') {
            return next();
        }

        if (req.user.id !== resourceUserId) {
            throw new AppError('You can only access your own resources', 403);
        }

        next();
    };
};
