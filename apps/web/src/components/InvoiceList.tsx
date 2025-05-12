import React, { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { InvoiceContractABI } from '../constants/contractABIs';
import { INVOICE_CONTRACT_ADDRESS } from '../constants/contractAddresses';

// Define the Invoice type
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

// Define the InvoiceList props
interface InvoiceListProps {
  userAddress?: string;
  onViewInvoice?: (id: bigint) => void; // Callback for viewing invoice
}

// Define the structure for our invoices state
interface InvoicesState {
  created: Invoice[];
  pending: Invoice[];
}

function InvoiceList({ userAddress, onViewInvoice }: InvoiceListProps) {
  // Initialize with the correct type
  const [invoices, setInvoices] = useState<InvoicesState>({
    created: [],
    pending: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!userAddress) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const client = createPublicClient({
          chain: hardhat,
          transport: http()
        });
        
        // Get invoices created by the user
        const createdInvoices = await client.readContract({
          address: INVOICE_CONTRACT_ADDRESS as `0x${string}`,
          abi: InvoiceContractABI,
          functionName: 'getInvoicesByUser',
          args: [userAddress as `0x${string}`]
        }) as Invoice[];
        
        // Get invoices where user is recipient
        const pendingInvoices = await client.readContract({
          address: INVOICE_CONTRACT_ADDRESS as `0x${string}`,
          abi: InvoiceContractABI,
          functionName: 'getPendingInvoices',
          args: [userAddress as `0x${string}`]
        }) as Invoice[];
        
        setInvoices({
          created: createdInvoices || [],
          pending: pendingInvoices || []
        });
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoices();
  }, [userAddress]);

  // Handle payment directly
  const handlePayInvoice = (invoiceToPayFor: Invoice) => {
    // Directly go to invoice detail view with the ID
    if (onViewInvoice) {
      console.log('Redirecting to pay invoice with ID:', invoiceToPayFor.id.toString());
      onViewInvoice(invoiceToPayFor.id);
    }
  };

  // Inside the InvoiceList component, add a debug function
  const handleViewInvoice = (id: bigint) => {
    console.log('View button clicked for invoice ID:', id.toString());
    
    if (onViewInvoice) {
      console.log('Calling onViewInvoice with ID:', id.toString());
      onViewInvoice(id);
    } else {
      console.error('onViewInvoice prop is not defined');
      
      // Fallback approach - try to find the global state management
      // This assumes you're using React Router or a similar navigation system
      if (typeof window !== 'undefined') {
        // Attempt to redirect to a detail page
        window.location.href = `/invoice/${id.toString()}`;
        // Or if you'd prefer to show an error message to the user:
        alert(`Cannot view invoice details. Please try again later.`);
      }
    }
  };

  // Mobile invoice card component for small screens
  const InvoiceCard = ({ invoice, isPending = false }: { invoice: Invoice, isPending?: boolean }) => (
    <div className="bg-white p-4 rounded-lg shadow mb-3 border border-gray-100">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-semibold">ID: {Number(invoice.id)}</span>
        {invoice.isPaid ? (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
            Paid
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
            Pending
          </span>
        )}
      </div>
      
      <div className="mb-2">
        <p className="text-xs text-gray-500">
          {isPending ? 'From:' : 'To:'}
        </p>
        <p className="text-sm truncate">
          {isPending 
            ? `${invoice.creator.substring(0, 6)}...${invoice.creator.substring(invoice.creator.length - 4)}`
            : `${invoice.recipient.substring(0, 6)}...${invoice.recipient.substring(invoice.recipient.length - 4)}`
          }
        </p>
      </div>
      
      <div className="mb-3">
        <p className="text-xs text-gray-500">Amount:</p>
        <p className="text-sm font-medium">
          {(Number(invoice.amount) / 1e18).toFixed(4)} ETH
        </p>
      </div>
      
      {isPending && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">Description:</p>
          <p className="text-sm truncate">{invoice.description || 'No description'}</p>
        </div>
      )}
      
      <div className="flex space-x-2 mt-2">
        <button 
          onClick={() => handleViewInvoice(invoice.id)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
        >
          View
        </button>
        {isPending && !invoice.isPaid && (
          <button 
            onClick={() => handlePayInvoice(invoice)}
            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md hover:bg-green-200"
          >
            Pay
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Invoices You Created */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-500 text-white px-4 py-3">
              <h2 className="text-lg font-semibold">Invoices You Created</h2>
            </div>
            
            {/* Desktop view */}
            {invoices.created && invoices.created.length > 0 ? (
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.created.map((invoice, index) => (
                      <tr key={Number(invoice.id)} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4 text-sm">{Number(invoice.id)}</td>
                        <td className="py-3 px-4 text-sm">{`${invoice.recipient.substring(0, 6)}...${invoice.recipient.substring(invoice.recipient.length - 4)}`}</td>
                        <td className="py-3 px-4 text-sm font-medium">{(Number(invoice.amount) / 1e18).toFixed(4)} ETH</td>
                        <td className="py-3 px-4">
                          {invoice.isPaid ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Paid</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="hidden md:flex justify-center items-center p-8 text-gray-500">
                No invoices created yet
              </div>
            )}
            
            {/* Mobile view */}
            <div className="md:hidden">
              {invoices.created && invoices.created.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {invoices.created.map(invoice => (
                    <div key={`mobile-${Number(invoice.id)}`} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium">Invoice #{Number(invoice.id)}</div>
                        {invoice.isPaid ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Paid</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500">Recipient</div>
                          <div className="text-sm">{`${invoice.recipient.substring(0, 6)}...${invoice.recipient.substring(invoice.recipient.length - 4)}`}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Amount</div>
                          <div className="text-sm font-medium">{(Number(invoice.amount) / 1e18).toFixed(4)} ETH</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="w-full py-2 text-center bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No invoices created yet
                </div>
              )}
            </div>
          </div>

          {/* Invoices To Pay */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-green-500 text-white px-4 py-3">
              <h2 className="text-lg font-semibold">Invoices To Pay</h2>
            </div>
            
            {/* Desktop view */}
            {invoices.pending && invoices.pending.length > 0 ? (
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.pending.map((invoice, index) => (
                      <tr key={Number(invoice.id)} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4 text-sm">{Number(invoice.id)}</td>
                        <td className="py-3 px-4 text-sm">{`${invoice.creator.substring(0, 6)}...${invoice.creator.substring(invoice.creator.length - 4)}`}</td>
                        <td className="py-3 px-4 text-sm font-medium">{(Number(invoice.amount) / 1e18).toFixed(4)} ETH</td>
                        <td className="py-3 px-4 text-sm">
                          <div className="max-w-xs line-clamp-1">
                            {invoice.description || 'No description'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <button 
                            onClick={() => handlePayInvoice(invoice)}
                            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md hover:bg-green-200"
                          >
                            Pay
                          </button>
                          <button 
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="hidden md:flex justify-center items-center p-8 text-gray-500">
                No pending invoices
              </div>
            )}
            
            {/* Mobile view */}
            <div className="md:hidden">
              {invoices.pending && invoices.pending.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {invoices.pending.map(invoice => (
                    <div key={`mobile-pending-${Number(invoice.id)}`} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium">Invoice #{Number(invoice.id)}</div>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500">From</div>
                          <div className="text-sm">{`${invoice.creator.substring(0, 6)}...${invoice.creator.substring(invoice.creator.length - 4)}`}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Amount</div>
                          <div className="text-sm font-medium">{(Number(invoice.amount) / 1e18).toFixed(4)} ETH</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Description</div>
                          <div className="text-sm line-clamp-2">{invoice.description || 'No description'}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handlePayInvoice(invoice)}
                          className="flex-1 py-2 text-center bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200"
                        >
                          Pay Now
                        </button>
                        <button 
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="flex-1 py-2 text-center bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No pending invoices
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceList;
