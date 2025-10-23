'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Music, Github, Twitter, MessageCircle, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  const socialLinks = [
    { name: 'GitHub', icon: Github, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Discord', icon: MessageCircle, href: '#' },
    { name: 'Website', icon: Globe, href: '#' },
  ];

  const footerLinks = [
    {
      title: 'Products',
    links: [
      { name: 'Artist Portal', href: '/artist' },
      { name: 'Investment Dashboard', href: '/dashboard' },
      { name: 'DeFi Protocol', href: '/defi' },
      { name: 'DAO Governance', href: '/governance' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { name: 'API Documentation', href: '#' },
      { name: 'Smart Contracts', href: '#' },
        { name: 'SDK', href: '#' },
        { name: 'GitHub', href: '#' },
      ],
    },
    {
      title: 'Community',
    links: [
      { name: 'Forum', href: '#' },
      { name: 'Discord', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Help Center', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Disclaimer', href: '#' },
      { name: 'Compliance', href: '#' },
      ],
    },
  ];

  return (
    <footer className="glass-dark border-t border-mantle-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-3 mb-4"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-mantle-primary to-mantle-secondary rounded-xl flex items-center justify-center neon-mantle">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold gradient-text-mantle">MantleMusicFi</span>
                <span className="text-xs text-mantle-primary/70">On Mantle Chain</span>
              </div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-300 text-sm leading-relaxed mb-6"
            >
              A decentralized music copyright revenue platform built on Mantle Network, enabling tokenization, trading, and revenue distribution of music copyrights through blockchain technology, creating new value for artists and investors. Enjoy ultra-low gas fees and high-performance advantages of Mantle Network.
            </motion.p>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex space-x-4"
            >
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-2 text-gray-400 hover:text-mantle-primary transition-colors duration-300 hover:bg-mantle-primary/10 rounded-lg border border-transparent hover:border-mantle-primary/30"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </motion.div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 3) }}
            >
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-mantle-primary transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t border-mantle-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-gray-400 text-sm">
            © 2024 MantleMusicFi. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0">
            Built with <span className="text-mantle-primary">❤️</span> for the decentralized music economy on <span className="text-mantle-primary font-medium">Mantle Network</span>
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;