import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme
} from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

// Access environment variables directly
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || 'demo';
const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'your-project-id';

const wagmiConfig = getDefaultConfig({
  appName: 'Invio Invoice dApp',
  projectId: walletConnectProjectId,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`),
  }
})

// Create a client for React Query
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
