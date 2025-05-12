import React, { useState, useEffect } from 'react';
import './App.css';
import InvoiceForm from './components/InvoiceForm';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function App() {
  const { address: userAddress, isConnected } = useAccount();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invio</h1>
            <p className="text-sm text-gray-600">Blockchain Invoicing Platform</p>
          </div>
          <ConnectButton />
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isConnected ? (
          <InvoiceForm userAddress={userAddress} />
        ) : (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Welcome to Invio</h2>
            <p className="text-gray-600 mb-6">Connect your wallet to start creating invoices on the blockchain.</p>
            <ConnectButton />
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-gray-500">Invio - Blockchain Invoice Platform © 2023</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
