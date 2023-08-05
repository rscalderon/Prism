import { NextFunction, Request, Response, RequestHandler } from 'express';
interface middlewareError {
  log: string;
  status: number;
  message: { error: Error };
}

interface Controller {
  [middlewareFn: string]: RequestHandler;
}

interface ThemeProps {
  initialTheme: string;
  children: any;
}
export { middlewareError, Controller };

export { ThemeProps };
