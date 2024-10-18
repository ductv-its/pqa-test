import { ethers } from 'ethers';

const verifySignature = (
  message: string,
  signature: string,
  address: string,
): boolean => {
  const signerAddress = ethers.verifyMessage(message, signature);
  return signerAddress.toLowerCase() === address.toLowerCase();
};

export default verifySignature;
