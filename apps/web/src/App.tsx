import React, { useState } from 'react';
import './App.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';

function App() {
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const { address, isConnected } = useAccount();

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">Invio</div>
        <ConnectButton />
      </header>

      {isConnected && address ? (
        !showInvoiceForm ? (
          <>
            <div className="card">
              <h2 className="card-title">Create Invoice</h2>
              <p>Generate and send invoices with blockchain payment options</p>
              <button 
                className="button" 
                style={{ marginTop: '10px' }}
                onClick={() => setShowInvoiceForm(true)}
              >
                New Invoice
              </button>
            </div>

            <InvoiceList userAddress={address} />
          </>
        ) : (
          <div className="card">
            <InvoiceForm userAddress={address} />
            <button 
              className="button" 
              style={{ 
                marginTop: '10px', 
                backgroundColor: '#6b7280',
                display: 'block'
              }}
              onClick={() => setShowInvoiceForm(false)}
            >
              Back to Dashboard
            </button>
          </div>
        )
      ) : (
        <div className="card">
          <h2 className="card-title">Welcome to Invio</h2>
          <p>Connect your wallet to create and manage invoices on the blockchain</p>
        </div>
      )}

      <footer className="footer">
        © 2025 Invio. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
