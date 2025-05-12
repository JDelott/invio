import React, { useState } from 'react';
import { createWalletClient, custom } from 'viem';
import { hardhat } from 'viem/chains';
import { InvoiceContractABI } from '../constants/contractABIs';
import { INVOICE_CONTRACT_ADDRESS } from '../constants/contractAddresses';

interface Invoice {
  id: bigint;
  creator: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  description: string;
  ipfsHash: string;
  isPaid: boolean;
  createdAt: bigint;
  paidAt: bigint;
}

interface PayInvoiceProps {
  invoice: Invoice;
  userAddress?: string;
  onPaymentComplete?: (txHash: string) => void;
  onCancel?: () => void;
}

function PayInvoice({ invoice, userAddress, onPaymentComplete, onCancel }: PayInvoiceProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handlePayInvoice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }
      
      const walletClient = createWalletClient({
        chain: hardhat,
        transport: custom(window.ethereum)
      });
      
      const [account] = await walletClient.getAddresses();
      
      const txHash = await walletClient.writeContract({
        address: INVOICE_CONTRACT_ADDRESS as `0x${string}`,
        abi: InvoiceContractABI,
        functionName: 'payInvoiceWithEth',
        args: [invoice.id],
        account,
        value: invoice.amount, // The amount to pay (already in wei)
      });
      
      setTxHash(txHash);
      if (onPaymentComplete) onPaymentComplete(txHash);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-4">Pay Invoice #{Number(invoice.id)}</h2>
      
      <div className="mb-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <span className="font-medium text-sm sm:text-base sm:w-24">From:</span> 
          <span className="text-gray-700 text-sm sm:text-base break-all">
            {`${invoice.creator.substring(0, 6)}...${invoice.creator.substring(invoice.creator.length - 4)}`}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center">
          <span className="font-medium text-sm sm:text-base sm:w-24">Amount:</span> 
          <span className="text-gray-700 text-sm sm:text-base font-semibold">
            {(Number(invoice.amount) / 1e18).toFixed(4)} ETH
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start">
          <span className="font-medium text-sm sm:text-base sm:w-24">Description:</span> 
          <span className="text-gray-700 text-sm sm:text-base break-words">
            {invoice.description || 'No description'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {txHash && (
        <div className="mb-4 p-3 sm:p-4 bg-green-50 text-green-700 rounded-md text-sm">
          <p className="font-medium">Payment successful!</p>
          <p className="text-xs sm:text-sm break-all mt-1">
            Transaction hash: {`${txHash.substring(0, 8)}...${txHash.substring(txHash.length - 8)}`}
          </p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded text-sm sm:text-base"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handlePayInvoice}
          disabled={loading || invoice.isPaid}
          className={`${onCancel ? '' : 'w-full'} bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base`}
        >
          {loading ? 'Processing...' : invoice.isPaid ? 'Already Paid' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
}

export default PayInvoice;
