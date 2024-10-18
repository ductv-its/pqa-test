import { Request, Response, NextFunction } from 'express';
import verifySignature from '../utils/verifySignature';
import { HttpException } from '../utils/HttpException';
import FiatTokenService from '../services/fiatToken.service';
import isValidEthereumAddress from './../utils/validateAddress';

export default class FiatTokenController {
  private fiatTokenService = new FiatTokenService();

  public mintUSDC = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { amount, walletAddress } = req.body;

      // Validate input parameters
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new HttpException(400, 'Invalid or missing amount parameter');
      }
      if (!walletAddress || !isValidEthereumAddress(walletAddress)) {
        throw new HttpException(400, 'Invalid or missing wallet address');
      }

      const txHash = await this.fiatTokenService.mint(walletAddress, amount);
      res.status(200).json({ success: true, txHash });
    } catch (error) {
      next(error);
    }
  };

  public createWallet = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.fiatTokenService.createWallet();
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public collectUSDC = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { account, signature, message } = req.body;

      if (!account || !signature || !message) {
        throw new HttpException(
          400,
          'Missing required parameters for signature verification',
        );
      }

      if (!verifySignature(message, signature, account)) {
        throw new HttpException(401, 'Invalid signature');
      }

      const txHash = await this.fiatTokenService.collect();
      res.status(200).json({ message: 'Collect successful', txHash: txHash });
    } catch (error) {
      next(error);
    }
  };

  public burnUSDC = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { amount, account, signature, message } = req.body;

      if (!account || !signature || !message) {
        throw new HttpException(
          400,
          'Missing required parameters for signature verification',
        );
      }
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new HttpException(400, 'Invalid or missing amount parameter');
      }

      if (!verifySignature(message, signature, account)) {
        throw new HttpException(401, 'Invalid signature');
      }

      const isOwner = await this.fiatTokenService.checkOwnership(account);
      if (!isOwner) {
        throw new HttpException(403, "You are not the owner's contract ");
      }

      const txHash = await this.fiatTokenService.burn(amount);
      res.status(200).json({ success: true, txHash });
    } catch (error) {
      next(error);
    }
  };

  public getBalance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { address } = req.params;

    if (!address || !isValidEthereumAddress(address)) {
      throw new HttpException(400, 'Invalid or missing address parameter');
    }

    try {
      const balance = await this.fiatTokenService.getBalance(address);
      res.status(200).json({ success: true, balance });
    } catch (error) {
      next(error);
    }
  };
}
