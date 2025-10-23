import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Web3Provider from '@/components/providers/Web3Provider';
import Layout from '@/components/layout/Layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MantleMusicFi - Decentralized Music Copyright Revenue Platform',
  description: 'Enabling tokenization, trading, and revenue distribution of music copyrights through blockchain technology, creating new value for artists and investors.',
  keywords: ['music', 'copyright', 'DeFi', 'blockchain', 'NFT', 'Web3', 'Mantle'],
  authors: [{ name: 'MantleMusicFi Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Web3Provider>
          <Layout>
            {children}
          </Layout>
        </Web3Provider>
      </body>
    </html>
  );
}