import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';

export class IndexRoute implements Routes {
  public path = '/app';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, (req, res) => {
      res.send({
        status: 200,
        message: 'Dapp Backend API is running',
      });
    });
  }
}
