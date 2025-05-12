import React, { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { InvoiceContractABI } from '../constants/contractABIs';
import { INVOICE_CONTRACT_ADDRESS } from '../constants/contractAddresses';
import InvoiceList from './InvoiceList';

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

interface DashboardProps {
  userAddress?: string;
}

interface Metrics {
  totalCreated: number;
  totalPending: number;
  totalPaid: number;
  totalValue: number;
  receivedValue: number;
}

function Dashboard({ userAddress }: DashboardProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    totalCreated: 0,
    totalPending: 0,
    totalPaid: 0,
    totalValue: 0,
    receivedValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
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
        
        // Get created invoices
        const createdInvoices = await client.readContract({
          address: INVOICE_CONTRACT_ADDRESS as `0x${string}`,
          abi: InvoiceContractABI,
          functionName: 'getInvoicesByUser',
          args: [userAddress as `0x${string}`]
        }) as Invoice[];
        
        // Get pending invoices
        const pendingInvoices = await client.readContract({
          address: INVOICE_CONTRACT_ADDRESS as `0x${string}`,
          abi: InvoiceContractABI,
          functionName: 'getPendingInvoices',
          args: [userAddress as `0x${string}`]
        }) as Invoice[];
        
        // Calculate metrics
        const created = createdInvoices || [];
        const pending = pendingInvoices || [];
        
        const paidInvoices = created.filter(inv => inv.isPaid);
        const totalValue = created.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const receivedValue = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        
        setMetrics({
          totalCreated: created.length,
          totalPending: pending.length,
          totalPaid: paidInvoices.length,
          totalValue: totalValue / 1e18,
          receivedValue: receivedValue / 1e18
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, [userAddress]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Invoices Created</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalCreated}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Invoices to Pay</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalPending}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Total Value (ETH)</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalValue.toFixed(4)}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium">Received (ETH)</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.receivedValue.toFixed(4)}</p>
            </div>
          </div>
          
          <InvoiceList userAddress={userAddress} />
        </>
      )}
    </div>
  );
}

export default Dashboard;
