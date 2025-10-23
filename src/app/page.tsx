'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Music, TrendingUp, Shield, Zap, Users, Globe, Hexagon, Layers, Network } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Music,
      title: 'Artist Portal',
      description: 'Publish music NFTs on Mantle chain and tokenize copyright revenue',
      href: '/artist',
      color: 'from-mantle-primary to-mantle-secondary',
      gradient: 'bg-gradient-to-br from-[#00D4AA]/20 to-[#0066FF]/20',
    },
    {
      icon: TrendingUp,
      title: 'Investment Dashboard',
      description: 'DeFi investments on Mantle network with low gas fees and high returns',
      href: '/dashboard',
      color: 'from-mantle-secondary to-mantle-accent',
      gradient: 'bg-gradient-to-br from-[#0066FF]/20 to-[#FF6B35]/20',
    },
    {
      icon: Zap,
      title: 'DeFi Protocol',
      description: 'Native AMM on Mantle chain for ultra-low cost music asset trading',
      href: '/defi',
      color: 'from-mantle-accent to-mantle-primary',
      gradient: 'bg-gradient-to-br from-[#FF6B35]/20 to-[#00D4AA]/20',
    },
    {
      icon: Shield,
      title: 'DAO Governance',
      description: 'MantleMusicFi community governance to build the music metaverse',
      href: '/governance',
      color: 'from-green-500 to-mantle-primary',
      gradient: 'bg-gradient-to-br from-green-500/20 to-[#00D4AA]/20',
    },
    {
      icon: Users,
      title: 'Privacy Compliance',
      description: 'Zero-knowledge proofs on Mantle network to protect artist privacy',
      href: '/privacy',
      color: 'from-purple-500 to-mantle-secondary',
      gradient: 'bg-gradient-to-br from-purple-500/20 to-[#0066FF]/20',
    },
    {
      icon: Globe,
      title: 'AI Analytics',
      description: 'On-chain data analysis to predict music market trends',
      href: '/analytics',
      color: 'from-blue-500 to-mantle-accent',
      gradient: 'bg-gradient-to-br from-blue-500/20 to-[#FF6B35]/20',
    },
  ];

  const stats = [
    { label: 'Total Value Locked', value: '$12.5M', change: '+15.2%', icon: TrendingUp },
    { label: 'Active Artists', value: '2,847', change: '+8.7%', icon: Users },
    { label: 'MRT Tokens', value: '156K', change: '+23.1%', icon: Hexagon },
    { label: 'Mantle Transactions', value: '847K', change: '+12.4%', icon: Network },
  ];

  return (
    <div className="min-h-screen bg-mantle-dark relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 cyber-grid opacity-40"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-mantle-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-mantle-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mantle-accent/5 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative">
        <div className="container-responsive py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >


            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 font-['Orbitron']">
              <span className="gradient-text-mantle">MantleMusicFi</span>
            </h1>
            <h2 className="text-2xl lg:text-3xl text-mantle-primary mb-8 font-semibold">
              Next-Generation Music Copyright Financialization Platform
            </h2>
            <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
              Ultra-low cost music NFT & DeFi ecosystem built on <span className="text-mantle-primary font-semibold">Mantle Network</span>
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
              Leveraging Mantle chain's high performance and low gas fees to provide global music creators with copyright tokenization, revenue distribution, and decentralized trading services
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/artist">
                <Button
                  variant="primary"
                  size="lg"
                  className="btn-pulse neon-mantle hover-lift bg-gradient-to-r from-mantle-primary to-mantle-secondary text-white font-semibold"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Create on Mantle
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="hover-glow-blue border-mantle-secondary text-mantle-secondary hover:bg-mantle-secondary/10"
                >
                  Explore DeFi Investments
                </Button>
              </Link>
            </div>

            {/* Mantle Network Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              <div className="glass-card p-6 rounded-xl">
                <Zap className="w-8 h-8 text-mantle-primary mb-3 mx-auto" />
                <h3 className="text-white font-semibold mb-2">Ultra-Low Gas Fees</h3>
                <p className="text-gray-400 text-sm">Mantle network provides near-zero cost transaction experience</p>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <Shield className="w-8 h-8 text-mantle-secondary mb-3 mx-auto" />
                <h3 className="text-white font-semibold mb-2">Ethereum Security</h3>
                <p className="text-gray-400 text-sm">Inherits the security and decentralization of Ethereum mainnet</p>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <Network className="w-8 h-8 text-mantle-accent mb-3 mx-auto" />
                <h3 className="text-white font-semibold mb-2">High-Performance Scaling</h3>
                <p className="text-gray-400 text-sm">Supports large-scale music NFT minting and trading</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 font-['Orbitron']">
              MantleMusicFi <span className="gradient-text-mantle">Ecosystem Data</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Real-time data from the music DeFi ecosystem built on Mantle Network
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card variant="glass" className="text-center p-6 hover-lift glass-card group">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-mantle-primary to-mantle-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-2 font-['Orbitron']">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
                  <div className="text-mantle-primary text-sm font-medium flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 font-['Orbitron']">
              <span className="gradient-text-mantle">Core Features</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Complete music copyright financialization solution built on Mantle Network, enjoy ultra-low gas fees and high-performance experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={feature.href}>
                  <Card variant="glass" className={`h-full p-6 hover-lift group cursor-pointer glass-card relative overflow-hidden ${feature.gradient}`}>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-mantle-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative z-10">
                      <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3 font-['Orbitron']">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed mb-4">
                        {feature.description}
                      </p>
                      <div className="flex items-center text-mantle-primary group-hover:text-white transition-colors">
                        <span className="text-sm font-medium">Experience on Mantle</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="absolute inset-0 rounded-xl border border-mantle-primary/50 shadow-[0_0_20px_rgba(0,212,170,0.3)]"></div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-mantle-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-mantle-secondary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-responsive relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-dark p-12 lg:p-16 rounded-2xl text-center relative overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 cyber-grid opacity-20"></div>
            
            <div className="relative z-10">
              {/* Mantle Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-mantle-primary/20 border border-mantle-primary/40 rounded-full mb-6"
              >
                <Hexagon className="w-4 h-4 text-mantle-primary" />
                <span className="text-mantle-primary font-semibold text-sm">Powered by Mantle Network</span>
              </motion.div>

              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 font-['Orbitron']">
                Join the <span className="gradient-text-mantle">MantleMusicFi</span> Revolution
              </h2>
              <p className="text-xl text-gray-300 mb-4 max-w-3xl mx-auto">
                Start the new era of music copyright financialization on Mantle Network
              </p>
              <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                Enjoy ultra-low gas fees and high-performance trading, benefiting both music creators and investors
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/artist">
                  <Button
                    variant="primary"
                    size="lg"
                    className="btn-pulse neon-mantle hover-lift bg-gradient-to-r from-mantle-primary to-mantle-secondary text-white font-semibold px-8 py-4"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Create Music on Mantle
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="lg"
                    className="hover-glow-blue border-mantle-secondary text-mantle-secondary hover:bg-mantle-secondary/10 px-8 py-4"
                  >
                    Explore DeFi Opportunities
                  </Button>
                </Link>
              </div>

              {/* Additional info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
              >
                <div className="flex items-center justify-center gap-3 text-gray-400">
                  <Zap className="w-5 h-5 text-mantle-primary" />
                  <span>Ultra-Low Gas Fees</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-gray-400">
                  <Shield className="w-5 h-5 text-mantle-secondary" />
                  <span>Ethereum-Level Security</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-gray-400">
                  <Network className="w-5 h-5 text-mantle-accent" />
                  <span>High-Performance Scaling</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;