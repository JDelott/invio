import React, { useState, useEffect } from 'react';
import { createPublicClient, http, parseEther } from 'viem';
import { hardhat } from 'viem/chains';
import { INVOICE_CONTRACT_ADDRESS, InvoiceContractABI } from '../constants/contractABIs';

interface Invoice {
  id: number;
  creator: string;
  recipient: string;
  amount: bigint;
  description: string;
  ipfsHash: string;
  isPaid: boolean;
  createdAt: bigint;
  paidAt: bigint;
}

function InvoiceList({ userAddress }: { userAddress?: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!userAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const publicClient = createPublicClient({
          chain: hardhat,
          transport: http()
        });

        const invoiceData = await publicClient.readContract({
          address: '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512', // Use hardcoded address for now
          abi: InvoiceContractABI,
          functionName: 'getInvoicesByUser',
          args: [userAddress as `0x${string}`]
        });

        setInvoices(invoiceData as Invoice[]);
      } catch (err: any) {
        console.error('Error fetching invoices:', err);
        setError(`Failed to load invoices: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [userAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  if (!userAddress) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        Please connect your wallet to view your invoices.
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-8 rounded mb-4 text-center">
        No invoices found. Create your first invoice to get started!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Your Invoices</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={Number(invoice.id)} className="hover:bg-gray-50">
                <td className="py-4 px-4 whitespace-nowrap">{Number(invoice.id)}</td>
                <td className="py-4 px-4 whitespace-nowrap">
                  {`${invoice.recipient.substring(0, 6)}...${invoice.recipient.substring(invoice.recipient.length - 4)}`}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  {parseFloat(invoice.amount.toString()) / 1e18} ETH
                </td>
                <td className="py-4 px-4">{invoice.description}</td>
                <td className="py-4 px-4 whitespace-nowrap">
                  {new Date(Number(invoice.createdAt) * 1000).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  {invoice.isPaid ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Paid
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm">
                  <button
                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                    onClick={() => alert(`View details for invoice #${invoice.id}`)}
                  >
                    View
                  </button>
                  {!invoice.isPaid && (
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => alert(`Send payment reminder for invoice #${invoice.id}`)}
                    >
                      Remind
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvoiceList;
