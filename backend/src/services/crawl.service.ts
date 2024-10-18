import { ethers, parseUnits } from 'ethers';
import Stake from '../model/Stake';
import { IStake } from '../interfaces/stake.interface';

export class StakingLogCrawler {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor(providerUrl: string, contractAddress: string, contractABI: any) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.contract = new ethers.Contract(
      contractAddress,
      contractABI,
      this.provider,
    );
  }

  async saveStakingLog(data: IStake) {
    const isStakeLogExist = await Stake.findOne({
      transactionHash: data.transactionHash,
    }).lean();

    console.log('Check ' + data.transactionHash + ' : ' + isStakeLogExist);
    if (!isStakeLogExist) {
      console.log('Save new data with transactionHash: ', data.transactionHash);
      await Stake.create(data);
    }
  }
  async crawlStakingLogs(fromBlock: number, toBlock: number) {
    try {
      const filter = this.contract.filters.StakeAction();
      const logs = await this.contract.queryFilter(filter, fromBlock, toBlock);
      console.log('LOGS : ', logs.length);

      for (const log of logs) {
        try {
          const decodedLog = this.contract.interface.decodeEventLog(
            'StakeAction',
            log.data,
            log.topics,
          );

          console.log('Block:', log.blockNumber);
          console.log('User:', decodedLog.user);

          // Convert wei to ether using ethers v6 syntax
          const withdrawalFromRewards = ethers.formatEther(
            decodedLog.withdrawalFromRewards,
          );
          const withdrawalFromStake = ethers.formatEther(
            decodedLog.withdrawalFromStake,
          );
          const totalAmount = ethers.formatEther(decodedLog.totalAmount);
          const block = await this.provider.getBlock(log.blockNumber);

          const { action, attributes } = await this.getActionAndAttributes(
            decodedLog.actionType.toString(),
            decodedLog,
          );

          console.log('Action:', action, attributes);

          if (!action || !attributes) {
            return;
          }

          const data: IStake = {
            block: log.blockNumber,
            transactionHash: log.transactionHash,
            userAddress: decodedLog.user,
            totalAmount: totalAmount, // Now in ether
            action: action,
            timestamp: block.timestamp,
            attributes: {
              ...attributes,
            },
          };

          console.log('Save data');
          await this.saveStakingLog(data);
        } catch (decodeError) {
          console.error('Error decoding log:', decodeError);
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }
  async getDeploymentBlock(transactionHash: string) {
    try {
      // // Kiểm tra nếu hash giao dịch có định dạng đúng
      // if (
      //   !ethers.utils.isHexString(transactionHash) ||
      //   transactionHash.length !== 66
      // ) {
      //   throw new Error('Invalid transaction hash format');
      // }

      // Lấy thông tin receipt của giao dịch từ hash
      const receipt = await this.provider.getTransactionReceipt(
        transactionHash,
      );

      if (receipt && receipt.blockNumber) {
        console.log(`Contract deployed at block: ${receipt.blockNumber}`);
        return receipt.blockNumber;
      } else {
        console.log(
          'Transaction receipt not found or block number is not available.',
        );
        return null;
      }
    } catch (error) {
      console.error('Error fetching transaction receipt:', error);
      return null;
    }
  }

  async getLatestBlockNumber() {
    try {
      // Lấy số block mới nhất
      const latestBlockNumber = await this.provider.getBlockNumber();
      console.log(`Latest Block Number: ${latestBlockNumber}`);
      return latestBlockNumber;
    } catch (error) {
      console.error('Error fetching the latest block number:', error);
    }
  }

  async getActionAndAttributes(actionType: string, data: any) {
    console.log('Action Type:', actionType, typeof actionType);
    switch (actionType) {
      case '0':
        return {
          action: 'DepositToken',
          attributes: {},
        };
      case '1':
        return {
          action: 'WithdrawToken',
          attributes: {
            withdrawalFromRewards: ethers.formatEther(
              data.withdrawalFromRewards,
            ),
            withdrawalFromStake: ethers.formatEther(data.withdrawalFromStake),
          },
        };
      case '2':
        return {
          action: 'ClaimReward',
          attributes: {
            withdrawalFromRewards: ethers.formatEther(
              data.withdrawalFromRewards,
            ),
          },
        };
      case '3':
        return {
          action: 'DepositNFT',
          attributes: {
            nftIds: data.nftIds.split(','),
          },
        };
      case '4':
        return {
          action: 'WithdrawNFT',
          attributes: {
            nftIds: data.nftIds.split(','),
          },
        };
      default:
        return {
          action: null,
          attributes: null,
        };
    }
  }
}
