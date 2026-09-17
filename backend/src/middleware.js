"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const auth_1 = require("./auth");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = req.cookies?.jwt_token;
    if (!token && authHeader) {
        token = authHeader.split(' ')[1]; // Bearer <token>
    }
    if (token) {
        try {
            const user = (0, auth_1.verifyToken)(token);
            req.user = user;
            next();
        }
        catch (err) {
            res.sendStatus(403);
        }
    }
    else {
        res.sendStatus(401);
    }
};
exports.authenticateJWT = authenticateJWT;
