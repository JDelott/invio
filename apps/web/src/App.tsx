import React, { useState, useEffect } from 'react';
import './App.css';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getContractAddresses } from './constants/contractAddresses';
import InvoiceDetail from './components/InvoiceDetail';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';

function App() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'create', or 'detail'
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<bigint | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Move wallet connection to a separate function for reuse
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setConnecting(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setUserAddress(accounts[0]);
          return accounts[0];
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      } finally {
        setConnecting(false);
      }
    }
    return null;
  };
  
  // Setup wallet listeners
  useEffect(() => {
    const setupWalletListeners = async () => {
      if (window.ethereum) {
        // Try to get accounts without prompting user
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setUserAddress(accounts[0]);
          }
        } catch (err) {
          console.log('No pre-authorized accounts found');
        }
        
        // Network detection
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const addresses = getContractAddresses(chainId);
        console.log('Network detected:', chainId);
        console.log('Using contract addresses:', addresses);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
          setUserAddress(newAccounts[0] || null);
        });
        
        // Listen for chain changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      }
      
      setConnecting(false);
    };
    
    setupWalletListeners();
    
    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Render a loading state while connecting
  if (connecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Connecting to wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-md fixed top-0 inset-x-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-indigo-600">Invio</h1>
              <p className="text-sm text-gray-600">Blockchain Invoice Platform</p>
            </div>
            
            <div className="hidden md:flex items-center">
              <div className="w-64 flex justify-between mr-6">
                <button 
                  onClick={() => setView('dashboard')}
                  className={`px-3 py-2 rounded-md ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setView('create')}
                  className={`px-3 py-2 rounded-md ${view === 'create' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Create Invoice
                </button>
              </div>
              
              {userAddress ? (
                <div className="bg-indigo-50 rounded-full px-4 py-1 text-sm text-indigo-700">
                  {`${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`}
                </div>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                >
                  Connect Wallet
                </button>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600"
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 border-t border-gray-200 mt-4">
              <nav className="grid grid-cols-1 gap-1">
                <button 
                  onClick={() => {
                    setView('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 px-3 rounded-md text-sm font-medium ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => {
                    setView('create');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 px-3 rounded-md text-sm font-medium ${view === 'create' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                >
                  Create Invoice
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>
      
      <div className="pt-24 flex-grow">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="w-full max-w-4xl mx-auto mb-16">
            <ErrorBoundary>
              {!userAddress ? (
                <div className="bg-white shadow-md rounded-lg p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Welcome to Invio</h2>
                  <p className="mb-6 text-gray-600">Connect your wallet to start managing invoices on the blockchain</p>
                  <button
                    onClick={connectWallet}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : selectedInvoiceId ? (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <InvoiceDetail 
                    invoiceId={selectedInvoiceId} 
                    userAddress={userAddress}
                    onBack={() => setSelectedInvoiceId(null)}
                  />
                </div>
              ) : view === 'dashboard' ? (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {typeof Dashboard !== 'undefined' ? (
                    <Dashboard 
                      userAddress={userAddress} 
                      onViewInvoice={(id) => {
                        console.log('App: onViewInvoice called with ID:', id.toString());
                        setSelectedInvoiceId(id);
                      }}
                    />
                  ) : (
                    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-500 to-indigo-600">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Invoice Dashboard</h2>
                      <p className="text-blue-100 mt-1 text-sm sm:text-base">View and manage your invoices</p>
                      <div className="bg-white p-4 sm:p-6 md:p-8">
                        <InvoiceList 
                          userAddress={userAddress} 
                          onViewInvoice={(id) => {
                            console.log('App: onViewInvoice called with ID:', id.toString());
                            alert(`App: Setting selectedInvoiceId to ${id.toString()}`);
                            setSelectedInvoiceId(id);
                            console.log('Current view:', view);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <InvoiceForm userAddress={userAddress} />
                </div>
              )}
            </ErrorBoundary>
          </div>
        </main>
      </div>
      
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          Invio - Blockchain Invoice Platform © 2023
        </div>
      </footer>
    </div>
  );
}

export default App;
