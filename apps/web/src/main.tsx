import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { hardhat } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme
} from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

// Create a client for React Query
const queryClient = new QueryClient()

// For development, ONLY use the local hardhat network
const wagmiConfig = getDefaultConfig({
  appName: 'Invio Invoice dApp',
  projectId: import.meta.env?.VITE_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [hardhat], // ONLY use hardhat for development
  transports: {
    // Local Hardhat node
    [hardhat.id]: http('http://127.0.0.1:8545'),
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
