import { NextFunction, Request, Response } from 'express';
import { HttpException } from '../utils/HttpException';

const errorMiddleware = (
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (error.forceLogout) {
      res.clearCookie('token');
      res.clearCookie('refreshToken');
    }
    const status: number = error.status || 500;
    const message: string = error.message || 'Something went wrong';
    console.error(
      `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`,
    );
    res.status(status).json({ message });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
