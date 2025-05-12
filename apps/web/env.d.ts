/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_API_KEY: string;
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
  readonly VITE_INVOICE_CONTRACT_ADDRESS: string;
  readonly VITE_MOCK_USDC_ADDRESS: string;
}
