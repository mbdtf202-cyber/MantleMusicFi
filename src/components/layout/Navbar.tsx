'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Music, TrendingUp, Users, Settings, Shield, Zap, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import WalletButton from '../wallet/WalletButton';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '/', icon: Music },
    { name: 'Artist Portal', href: '/artist', icon: Users, horizontal: true },
    { name: 'Dashboard', href: '/dashboard', icon: TrendingUp },
    { name: 'DeFi', href: '/defi', icon: TrendingUp },
    { name: 'Governance', href: '/governance', icon: Shield },
    { name: 'Privacy', href: '/privacy', icon: Shield },
    { name: 'Analytics', href: '/analytics', icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark backdrop-blur-xl border-b border-mantle-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-mantle-primary to-mantle-secondary rounded-xl flex items-center justify-center neon-mantle">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text-mantle">MantleMusicFi</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center ${item.horizontal ? 'flex-row space-x-1' : 'space-x-2'} text-gray-300 hover:text-mantle-primary transition-all duration-300 group relative px-3 py-2 rounded-lg hover:bg-mantle-primary/10`}
                >
                  <item.icon className="w-4 h-4 group-hover:text-mantle-primary transition-colors" />
                  <span className={`group-hover:text-mantle-primary transition-colors font-medium ${item.horizontal ? 'text-sm' : ''}`}>
                    {item.horizontal ? item.name.replace(' ', '') : item.name}
                  </span>
                  <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-mantle-primary/30 transition-colors"></div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Wallet Connection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <WalletButton />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-mantle-primary transition-colors rounded-lg hover:bg-mantle-primary/10"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden glass-dark border-t border-mantle-border/50"
      >
        <div className="px-4 py-4 space-y-2">
          {navItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center ${item.horizontal ? 'space-x-2' : 'space-x-3'} p-3 text-gray-300 hover:text-mantle-primary hover:bg-mantle-primary/10 rounded-lg transition-all duration-300 border border-transparent hover:border-mantle-primary/30`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">
                  {item.horizontal ? item.name.replace(' ', '') : item.name}
                </span>
              </Link>
            </motion.div>
          ))}
          
          {/* Mobile Mantle Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 10 }}
            transition={{ delay: navItems.length * 0.1 }}
            className="mt-4 pt-4 border-t border-mantle-border/50"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-mantle-primary/70 bg-mantle-primary/5 rounded-lg p-3">
              <Zap className="w-4 h-4" />
              <span>Deployed on Mantle Network</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;