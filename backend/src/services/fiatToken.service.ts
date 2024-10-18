import { ethers } from 'ethers';
import { HttpException } from '../utils/HttpException';
import dotenv from 'dotenv';
import FiatToken from '../contract/FiatToken.json';
dotenv.config();

class FiatTokenService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contractAddress: string;
  private fiatToken: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.INFURA_API_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contractAddress = process.env.CONTRACT_ADDRESS || '';
    this.fiatToken = new ethers.Contract(
      this.contractAddress,
      FiatToken.abi,
      this.wallet,
    );
  }

  public async mint(walletAddress: string, amount: number): Promise<string> {
    try {
      const tx = await this.fiatToken.mint(walletAddress, amount);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error minting USDC:', error);
      throw new HttpException(500, 'Minting USDC failed');
    }
  }

  public async createWallet(): Promise<{
    walletAddress: string;
    balance: string;
  }> {
    try {
      const newWallet = ethers.Wallet.createRandom();
      const balance = await this.provider.getBalance(newWallet.address);
      const formattedBalance = ethers.formatUnits(balance, 6);

      return {
        walletAddress: newWallet.address,
        balance: formattedBalance,
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new HttpException(500, 'Wallet creation failed');
    }
  }

  public async collect(): Promise<string> {
    try {
      const tx = await this.fiatToken.collectUSDC();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error collecting USDC:', error);
      throw new HttpException(500, 'Collecting USDC failed');
    }
  }

  public async burn(amount: number): Promise<string> {
    try {
      const tx = await this.fiatToken.burn(amount);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error burning USDC:', error);
      throw new HttpException(500, 'Burning USDC failed');
    }
  }

  public checkOwnership = async (account: string): Promise<boolean> => {
    try {
      const onwerAddress = await this.fiatToken.owner();

      return (
        account.toString().toLowerCase() ===
        onwerAddress.toString().toLowerCase()
      );
    } catch (error) {
      throw new HttpException(500, 'Error checking ownership');
    }
  };

  public getBalance = async (address: string) => {
    try {
      const balance = await this.fiatToken.balanceOf(address);
      return {
        address: address,
        balance: ethers.formatUnits(balance, 6),
      };
    } catch (error) {
      throw new HttpException(500, 'Error getting balance');
    }
  };
}

export default FiatTokenService;
