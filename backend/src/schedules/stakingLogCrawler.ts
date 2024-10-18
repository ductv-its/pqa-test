// cron-jobs.ts
import cron from 'node-cron';
import { StakingLogCrawler } from '../services/crawl.service';
import contractAddresses from '../contracts/contract-addresses.json';
import deployments from '../contracts/deployments.json';
import Staking from '../contracts/Staking.json';
import LastBlock from '../model/LastBlock';

const NETWORK_API_KEY = '9d13fab540c243ca9514d4ab4fe7e9e1';

// Cron job để crawl staking logs mỗi 15 giây
export const stakingLogJob = () => {
  cron.schedule(
    '*/15 * * * * *',
    async () => {
      console.log('Starting to crawl staking logs...');
      try {
        const providerUrl = `https://rpc.sepolia.linea.build`;

        const crawler = new StakingLogCrawler(
          providerUrl,
          contractAddresses.lineaSepolia.Staking,
          Staking.abi,
        );

        // Lấy block cuối cùng đã crawl
        const lastBlockRecord = await LastBlock.findOne({
          contractName: 'Staking',
        });

        // Nếu chưa crawl lần nào thì crawl từ block deployment
        let fromBlock = 0;

        if (!lastBlockRecord) {
          fromBlock =
            (await crawler.getDeploymentBlock(
              deployments.lineaSepolia.Staking.transactionHash,
            )) ?? deployments.lineaSepolia.Staking.blockNumber;
          await LastBlock.create({
            block: fromBlock,
            contractName: 'Staking',
          });
        } else if (
          lastBlockRecord.block < deployments.lineaSepolia.Staking.blockNumber
        ) {
          fromBlock = deployments.lineaSepolia.Staking.blockNumber;
          await LastBlock.updateOne(
            { contractName: 'Staking' },
            { block: deployments.lineaSepolia.Staking.blockNumber },
          );
        } else {
          fromBlock = lastBlockRecord.block;
        }

        // Lấy block cuối cùng hiện tại
        const latestBlock = await crawler.getLatestBlockNumber();
        if (latestBlock !== undefined) {
          await crawler.crawlStakingLogs(fromBlock, latestBlock);
          await LastBlock.updateOne(
            {
              contractName: 'Staking',
            },
            { block: latestBlock },
          );
        }
      } catch (error) {
        console.error('Error occurred while crawling staking logs:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'America/New_York',
    },
  );
};
