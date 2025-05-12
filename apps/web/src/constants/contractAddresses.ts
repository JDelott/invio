/**
 * Hardhat deployment contract addresses
 * These addresses are fixed for local Hardhat deployments
 */
export const INVOICE_CONTRACT_ADDRESS = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512';
export const MOCK_USDC_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

/**
 * Helper function to get contract address by network ID
 * @param chainId The connected chain ID
 * @returns Object containing contract addresses for the specified network
 */
export function getContractAddresses(chainId: string | number | undefined) {
  // Convert number to hex string if needed
  const chainIdHex = typeof chainId === 'number' ? `0x${chainId.toString(16)}` : chainId;
  
  // Hardhat default chainId is 31337 (0x7a69)
  if (chainIdHex === '0x7a69' || chainIdHex === '31337') {
    return {
      invoiceContract: INVOICE_CONTRACT_ADDRESS,
      mockUsdc: MOCK_USDC_ADDRESS
    };
  }
  
  // Add other networks here as needed
  // e.g., Sepolia, Goerli, Mainnet
  
  // Default fallback to Hardhat addresses
  return {
    invoiceContract: INVOICE_CONTRACT_ADDRESS,
    mockUsdc: MOCK_USDC_ADDRESS
  };
}
