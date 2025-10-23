'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';

const WalletButton: React.FC = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    variant="neon"
                    size="sm"
                    leftIcon={<Wallet className="w-4 h-4" />}
                    onClick={openConnectModal}
                  >
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openChainModal}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Wrong Network
                  </Button>
                );
              }

              return (
                <div className="flex items-center space-x-2">
                  {/* Chain Selector */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openChainModal}
                    className="flex items-center space-x-2 px-3 py-2 bg-dark-800 border border-primary-400/50 rounded-lg text-primary-400 hover:bg-primary-400/10 transition-all duration-300"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 16, height: 16 }}
                          />
                        )}
                      </div>
                    )}
                    <span className="text-sm font-medium">{chain.name}</span>
                    <ChevronDown className="w-3 h-3" />
                  </motion.button>

                  {/* Account Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openAccountModal}
                    className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg text-white hover:from-primary-600 hover:to-secondary-600 transition-all duration-300"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {account.displayName}
                    </span>
                    {account.displayBalance && (
                      <span className="text-xs opacity-80">
                        {account.displayBalance}
                      </span>
                    )}
                  </motion.button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletButton;