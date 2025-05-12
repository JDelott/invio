import React, { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { InvoiceContractABI } from '../constants/contractABIs';
import { INVOICE_CONTRACT_ADDRESS } from '../constants/contractAddresses';
import PayInvoice from './PayInvoice';

// Define the Invoice interface
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

interface InvoiceDetailProps {
  invoiceId: bigint;
  userAddress?: string;
  onBack: () => void;
}

function InvoiceDetail({ invoiceId, userAddress, onBack }: InvoiceDetailProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching invoice details for ID:', invoiceId.toString());
        
        const client = createPublicClient({
          chain: hardhat,
          transport: http()
        });
        
        // Debug the contract address
        console.log('Using contract address:', INVOICE_CONTRACT_ADDRESS);
        
        // Get invoice by ID
        const invoiceData = await client.readContract({
          address: INVOICE_CONTRACT_ADDRESS as `0x${string}`,
          abi: InvoiceContractABI,
          functionName: 'invoices',
          args: [invoiceId]
        });
        
        console.log('Raw invoice data:', invoiceData);
        
        // Structure the data properly - it might be returned as an array or object
        // without proper property names
        let structuredInvoice: Invoice;
        
        if (Array.isArray(invoiceData)) {
          // If it's an array, map it to an object with proper property names
          structuredInvoice = {
            id: invoiceData[0] as bigint,
            creator: invoiceData[1] as `0x${string}`,
            recipient: invoiceData[2] as `0x${string}`,
            amount: invoiceData[3] as bigint,
            description: invoiceData[4] as string,
            ipfsHash: invoiceData[5] as string,
            isPaid: invoiceData[6] as boolean,
            createdAt: invoiceData[7] as bigint,
            paidAt: invoiceData[8] as bigint
          };
        } else if (typeof invoiceData === 'object' && invoiceData !== null) {
          // If it's already an object, we'll cast it
          structuredInvoice = invoiceData as unknown as Invoice;
        } else {
          throw new Error('Unexpected invoice data format');
        }
        
        console.log('Structured invoice:', structuredInvoice);
        setInvoice(structuredInvoice);
      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 m-4">
        {error}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 m-4">
        Invoice not found
      </div>
    );
  }

  // Safe comparison with null checks
  const isRecipient = userAddress && invoice.recipient 
    ? userAddress.toLowerCase() === invoice.recipient.toLowerCase() 
    : false;
    
  const isCreator = userAddress && invoice.creator 
    ? userAddress.toLowerCase() === invoice.creator.toLowerCase() 
    : false;
    
  const formattedDate = invoice.createdAt && Number(invoice.createdAt) > 0
    ? new Date(Number(invoice.createdAt) * 1000).toLocaleDateString()
    : 'Unknown date';
    
  const formattedAmount = invoice.amount 
    ? (Number(invoice.amount) / 1e18).toFixed(4)
    : '0.0000';
    
  // Format addresses for better display on small screens
  const formatAddress = (address: string) => {
    // On small screens, show less characters
    const isMobile = window.innerWidth < 640;
    const displayChars = isMobile ? 4 : 6;
    return `${address.substring(0, displayChars)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div>
      {/* Header - Responsive design for all screen sizes */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-2 p-1 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Invoice Details</h2>
            <p className="text-blue-100 mt-1 text-sm sm:text-base">View and manage this invoice</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Invoice Details - Responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">Invoice Details</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center">
                <span className="font-medium w-24 text-sm sm:text-base">Status:</span> 
                {invoice.isPaid ? (
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm">
                    Paid
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs sm:text-sm">
                    Pending
                  </span>
                )}
              </div>
              <div className="flex items-start">
                <span className="font-medium w-24 text-sm sm:text-base">Amount:</span> 
                <span className="text-sm sm:text-base">{formattedAmount} ETH</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium w-24 text-sm sm:text-base">Created:</span> 
                <span className="text-sm sm:text-base">{formattedDate}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium w-24 text-sm sm:text-base">Description:</span>
                <span className="text-sm sm:text-base break-words">{invoice.description || 'No description'}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">Parties</h3>
            <div className="space-y-3">
              <div className="flex flex-col">
                <div className="flex items-start">
                  <span className="font-medium w-24 text-sm sm:text-base">Creator:</span>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm overflow-hidden text-ellipsis break-all">
                      {invoice.creator || 'N/A'}
                    </span>
                    {isCreator && <span className="text-xs text-indigo-600">(You)</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-start">
                  <span className="font-medium w-24 text-sm sm:text-base">Recipient:</span>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm overflow-hidden text-ellipsis break-all">
                      {invoice.recipient || 'N/A'}
                    </span>
                    {isRecipient && <span className="text-xs text-indigo-600">(You)</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Section */}
        {isRecipient && !invoice.isPaid && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <PayInvoice 
              invoice={invoice} 
              userAddress={userAddress}
              onPaymentComplete={() => {
                // Refresh data after payment
                window.location.reload();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoiceDetail;
