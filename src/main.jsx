import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 1. Import CSS bawaan RainbowKit
import '@rainbow-me/rainbowkit/styles.css';

// 2. Import modul RainbowKit, Wagmi, dan React Query
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains'; 
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// 3. Konfigurasi Jaringan & Project ID
const config = getDefaultConfig({
  appName: 'Freesia DEX',
  projectId: '78f61ffbae79f906864cc993f157e794', // Wajib diisi agar modal dompet bisa muncul
  chains: [mainnet, sepolia], // Kita pakai jaringan Ethereum & Sepolia dulu sebelum memasukkan LitVM
});

const queryClient = new QueryClient();

// 4. Membungkus <App /> dengan Provider (Mesin Web3)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* Tema gelap dengan aksen tombol warna kuning Freesia */}
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#FFD700', 
          accentColorForeground: 'black',
          borderRadius: 'medium',
        })}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

