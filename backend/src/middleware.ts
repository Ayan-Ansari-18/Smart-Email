import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = req.cookies?.jwt_token;

  if (!token && authHeader) {
    token = authHeader.split(' ')[1]; // Bearer <token>
  }

  if (token) {
    try {
      const user = verifyToken(token);
      (req as any).user = user;
      next();
    } catch (err) {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(401);
  }
};
