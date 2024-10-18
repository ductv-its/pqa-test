// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react';
import { FaWallet, FaPlus, FaCoins, FaFire } from 'react-icons/fa';
import axios from 'axios';

const App = () => {
  const treasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS;
  const [activeTab, setActiveTab] = useState('mint');
  const [hasAccount, setHasAccount] = useState(false);
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [balance, setBalance] = useState({});
  const [account, setAccount] = useState('');
  const [error, setError] = useState(null);
  const sepoliaChainId = '0xaa36a7';

  const checkMetaMaskInstalled = () => typeof window.ethereum !== 'undefined';

  const createNewWallet = async () => {
    alert(
      'Feature to create a new wallet is not implemented yet. Please connect to an existing wallet.',
    );
  };

  const requestAccount = async () => {
    if (!checkMetaMaskInstalled()) {
      setError('Please install MetaMask to use this app.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setHasAccount(true);
        setError(null); // Reset error on successful connection
      } else {
        setError(
          'No accounts found. Please make sure you are logged into MetaMask.',
        );
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      setError('Error connecting to MetaMask. Please try again.');
    }
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sepoliaChainId }],
      });
      setError(null); // Reset error on successful network switch
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: sepoliaChainId,
                chainName: 'Sepolia',
                rpcUrls: [
                  'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID',
                ],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding the Sepolia network:', addError);
          setError('Error adding the Sepolia network. Please try again.');
        }
      } else {
        console.error('Error switching to Sepolia:', error);
        setError('Error switching to Sepolia. Please try again.');
      }
    }
  };

  const checkNetworkAndConnect = async () => {
    if (!checkMetaMaskInstalled()) {
      setError('Please install MetaMask to use this app.');
      return;
    }

    const { chainId } = await window.ethereum.request({
      method: 'eth_chainId',
    });

    if (chainId !== sepoliaChainId) {
      setError(
        'You are not connected to the Sepolia network. Switching now...',
      );
      await switchToSepolia();
    } else {
      await requestAccount();
    }
  };

  const handleGetBalance = async (address) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/get-balance/${address}`,
      );
      setBalance((prevBalance) => ({
        ...prevBalance,
        [response.data.balance.address]: response.data.balance.balance,
      }));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError('Error fetching balance. Please try again.');
    }
  };

  const handleSign = async (message) => {
    try {
      console.log('Signing message:', message, account);
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      setError('Error signing message. Please try again.');
      return null;
    }
  };

  const handleCollect = async () => {
    const message = `Collect USDC from ${account}`;
    const signature = await handleSign(message);
    console.log('Signature:', signature);
    if (signature) {
      try {
        const response = await axios.post('http://localhost:3000/collect', {
          account,
          signature,
          message,
        });
        alert('Tokens collected successfully!');
        console.log('Collect response:', response.data);
      } catch (error) {
        console.log("Error collecting tokens:", error);
        alert('Error collecting tokens: '+error.response.data.message );
      }
    }
  };

  const handleBurn = async () => {
    const message = `Burn ${burnAmount} tokens from ${account}`;
    const signature = await handleSign(message);
    console.log('burnAmount:', burnAmount);
    if (signature) {
      try {
        const response = await axios.post('http://localhost:3000/burn', {
          account: account,
          signature,
          message,
          amount: Number(burnAmount),
        });
        handleGetBalance(treasuryAddress);
        alert('Tokens burned successfully!');


        setBurnAmount(0);
        console.log('Burn response:', response.data);
      } catch (error) {
        console.log("Error collecting tokens:", error);
        alert('Error burning tokens: ' + error.response.data.message);
      }
    }
  };

  const handleMint = async () => {
    try {
      const response = await axios.post('http://localhost:3000/mint', {
        account: treasuryAddress,
        signature: 'YOUR_SIGNATURE', // Make sure to replace with actual signature
        message: 'This is a test message',
        amount: mintAmount,
      });
      console.log('Mint response:', response.data);
    } catch (error) {
      console.error('Error minting tokens:', error);
      setError('Error minting tokens. Please try again.');
    }
  };

  useEffect(() => {
    checkNetworkAndConnect();
  }, []);

  useEffect(() => {
    handleGetBalance(treasuryAddress);
    if (hasAccount) {
      handleGetBalance(account);
    }
  }, [hasAccount, treasuryAddress]);

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setHasAccount(true);
        setError(null); // Reset error on account change
      } else {
        setHasAccount(false);
        setError(
          'No accounts found. Please make sure you are logged into MetaMask.',
        );
      }
    };

    if (checkMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (checkMetaMaskInstalled()) {
        window.ethereum.removeListener(
          'accountsChanged',
          handleAccountsChanged,
        );
      }
    };
  }, []);

  const handleDisconnect = () => {
    setHasAccount(false);
    setAccount('');
  };


  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-10 lg:p-36">
      <div className="w-full lg:w-1/3 p-10 bg-white shadow-lg rounded-lg mb-4 lg:mb-0 lg:mr-4">
        <div className="mb-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 flex items-center">
            <FaWallet className="mr-2" /> Treasury Wallet
          </h2>
          {error && <p className="text-red-500">{error}</p>}
          <p className="text-gray-600 text-sm lg:text-base">
            Current Balance: {balance[treasuryAddress] || 0} USDC
          </p>
          <p className="text-gray-600 truncate text-sm lg:text-base">
            Wallet Address: {treasuryAddress}
          </p>
        </div>
        <div>
          <h3 className="text-lg lg:text-xl font-semibold mb-4">
            Account Management
          </h3>
          {!hasAccount ? (
            <div>
              <button
                onClick={createNewWallet}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-300 ease-in-out w-full mb-2"
                aria-label="Create New Wallet"
              >
                Create New Wallet
              </button>
              <button
                onClick={requestAccount}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out w-full"
                aria-label="Connect with MetaMask"
              >
                <p className="inline-block mr-2"> Connect with MetaMask </p>
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 text-sm lg:text-base">
               Account: {account}
              </p>
              <p className="text-gray-600 text-sm lg:text-base">
               Balance:  {balance[account] || 0} USDC
              </p>
              <button
                onClick={handleDisconnect}
                className="bg-gray-300 text-white px-4 py-2 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 transition duration-300 ease-in-out w-full mt-4"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-2/3 p-10 bg-white shadow-lg rounded-lg">
        <div className="mb-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-4">
            Token Management
          </h2>
          <nav className="flex space-x-4 mb-4">
            {['mint', 'collection', 'burn'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition duration-300 ease-in-out ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === 'mint' && (
            <div id="mint-panel">
              <h3 className="text-lg font-semibold mb-2">Mint Tokens</h3>
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="Amount to Mint"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-4"
              />
              <button
                onClick={handleMint}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 ease-in-out"
              >
                <FaPlus className="mr-2" /> Mint
              </button>
            </div>
          )}

          {activeTab === 'collection' && (
            <div id="collection-panel" className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Collect Tokens</h3>
              <button
                onClick={handleCollect}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300 ease-in-out flex items-center min-w-[150px] "
              >
                <FaCoins className="mr-2" /> <span>Collect</span>
              </button>
            </div>
          )}

          {activeTab === 'burn' && (
            <div id="burn-panel" className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Burn Tokens</h3>
              <input
                type="number"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                placeholder="Amount to Burn"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-4"
              />
              <button
                onClick={handleBurn}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300 ease-in-out flex items-center min-w-[150px]"
              >
                <FaFire className="mr-2" /> Burn
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
