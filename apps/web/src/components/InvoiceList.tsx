import React from 'react';

interface InvoiceListProps {
  userAddress?: string;
}

function InvoiceList({ userAddress }: InvoiceListProps) {
  return (
    <div className="card">
      <h2 className="card-title">Recent Transactions</h2>
      
      {/* Sample invoice data - you'll replace this with actual data from your contract */}
      <div className="transaction">
        <div>
          <div>Invoice #1094</div>
          <div>Web Development</div>
        </div>
        <div>0.5 ETH</div>
      </div>
      <div className="transaction">
        <div>
          <div>Invoice #1093</div>
          <div>UI/UX Design</div>
        </div>
        <div>500 USDC</div>
      </div>
      
      {/* Add more placeholder transactions as needed */}
      
      <p className="mt-4 text-sm text-gray-500">
        Connected with wallet: {userAddress ? 
          `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}` : 
          'Not connected'
        }
      </p>
    </div>
  );
}

export default InvoiceList;
