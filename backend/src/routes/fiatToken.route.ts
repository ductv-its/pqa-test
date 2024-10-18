import FiatTokenController from '../controllers/fiatToken.controller';
import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';

export class FiatTokenRoute implements Routes {
  public path = '';
  public router = Router();
  public fiatTokenController = new FiatTokenController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/get-balance/:address`,
      this.fiatTokenController.getBalance,
    );
    this.router.post(`${this.path}/mint`, this.fiatTokenController.mintUSDC);
    this.router.get(
      `${this.path}/create-wallet`,
      this.fiatTokenController.createWallet,
    );
    this.router.post(
      `${this.path}/collect`,
      this.fiatTokenController.collectUSDC,
    );
    this.router.post(`${this.path}/burn`, this.fiatTokenController.burnUSDC);
  }
}
