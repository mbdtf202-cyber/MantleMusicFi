'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  Lock,
  Key,
  FileCheck,
  UserCheck,
  Award,
  Zap
} from 'lucide-react';

const PrivacyPage = () => {
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showSBTModal, setShowSBTModal] = useState(false);
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
  const [sbtStatus, setSbtStatus] = useState<'none' | 'minted' | 'pending'>('none');

  const privacyFeatures = [
    {
      title: 'ZK-KYC Verification',
      description: 'Use zero-knowledge proof technology for identity verification, protecting user privacy while meeting compliance requirements',
      icon: Shield,
      color: '#3B82F6',
      status: kycStatus,
      action: () => setShowKYCModal(true)
    },
    {
      title: 'SBT Identity Token',
      description: 'Obtain non-transferable soul-bound tokens to prove your identity and reputation',
      icon: Award,
      color: '#8B5CF6',
      status: sbtStatus,
      action: () => setShowSBTModal(true)
    },
    {
      title: 'Privacy Protection',
      description: 'All personal data is encrypted to ensure user privacy and security',
      icon: Lock,
      color: '#10B981',
      status: 'active',
      action: () => {}
    },
    {
      title: 'Compliance Monitoring',
      description: 'Real-time monitoring of transaction compliance, automatic identification and prevention of risky behavior',
      icon: Eye,
      color: '#F59E0B',
      status: 'active',
      action: () => {}
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'minted':
      case 'active':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string, type: string) => {
    if (type === 'kyc') {
      switch (status) {
        case 'verified': return 'Verified';
        case 'pending': return 'Under Review';
        case 'rejected': return 'Rejected';
        default: return 'Not Verified';
      }
    } else if (type === 'sbt') {
      switch (status) {
        case 'minted': return 'Minted';
        case 'pending': return 'Minting';
        default: return 'Not Minted';
      }
    } else {
      return 'Active';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'minted':
      case 'active':
        return CheckCircle;
      case 'pending':
        return AlertTriangle;
      case 'rejected':
        return AlertTriangle;
      default:
        return Shield;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="cyber-grid opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Privacy & Compliance Center
          </h1>
          <p className="text-gray-300">
            Protect your privacy and ensure platform compliance
          </p>
        </motion.div>

        {/* Privacy Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card variant="glass" className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Privacy Status Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {kycStatus === 'verified' ? 'Verified' : 'Not Verified'}
                </div>
                <div className="text-sm text-gray-400">KYC Status</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {sbtStatus === 'minted' ? 'Obtained' : 'Not Obtained'}
                </div>
                <div className="text-sm text-gray-400">SBT Token</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">100%</div>
                <div className="text-sm text-gray-400">Data Encryption</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-8 h-8 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">Real-time</div>
                <div className="text-sm text-gray-400">Compliance Monitoring</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Privacy Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          {privacyFeatures.map((feature, index) => {
            const StatusIcon = getStatusIcon(feature.status);
            const statusType = feature.title.includes('KYC') ? 'kyc' : 
                              feature.title.includes('SBT') ? 'sbt' : 'other';
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card variant="glass" className="p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${feature.color}20` }}
                      >
                        <feature.icon 
                          className="w-6 h-6" 
                          style={{ color: feature.color }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {feature.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon className={`w-4 h-4 ${getStatusColor(feature.status)}`} />
                          <span className={`text-sm ${getStatusColor(feature.status)}`}>
                            {getStatusText(feature.status, statusType)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-6">
                    {feature.description}
                  </p>
                  
                  {(statusType === 'kyc' || statusType === 'sbt') && (
                    <Button
                      variant="outline"
                      onClick={feature.action}
                      className="w-full"
                    >
                      {statusType === 'kyc' ? 
                        (kycStatus === 'none' ? 'Start Verification' : 'View Status') :
                        (sbtStatus === 'none' ? 'Mint SBT' : 'View Token')
                      }
                    </Button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Privacy Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card variant="glass" className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Privacy Protection Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-blue-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-white">Private Key Security</h4>
                    <p className="text-sm text-gray-400">
                      Keep your private keys safe and never share them with anyone
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-white">Data Minimization</h4>
                    <p className="text-sm text-gray-400">
                      We only collect necessary data and regularly delete expired information
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-white">Identity Verification</h4>
                    <p className="text-sm text-gray-400">
                      Use zero-knowledge proof technology to protect your identity privacy
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-orange-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-white">Real-time Monitoring</h4>
                    <p className="text-sm text-gray-400">
                      24/7 monitoring of suspicious activities to protect your asset security
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* KYC Modal */}
      <Modal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        title="ZK-KYC Identity Verification"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Zero-Knowledge Identity Verification
            </h3>
            <p className="text-gray-400">
              Use advanced zero-knowledge proof technology to complete identity verification without revealing personal information
            </p>
          </div>
          
          {kycStatus === 'none' && (
            <div className="space-y-4">
              <Input label="ID Document Type" placeholder="Select document type..." />
              <Input label="Document Number" placeholder="Enter document number..." />
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShowKYCModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => {
                    setKycStatus('pending');
                    setShowKYCModal(false);
                  }}
                >
                  Start Verification
                </Button>
              </div>
            </div>
          )}
          
          {kycStatus === 'pending' && (
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-white mb-4">Your identity verification is under review...</p>
              <Button variant="outline" onClick={() => setShowKYCModal(false)}>
                Close
              </Button>
            </div>
          )}
          
          {kycStatus === 'verified' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white mb-4">Identity verification completed!</p>
              <Button variant="primary" onClick={() => setShowKYCModal(false)}>
                Complete
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* SBT Modal */}
      <Modal
        isOpen={showSBTModal}
        onClose={() => setShowSBTModal(false)}
        title="SBT Identity Token"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Award className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Soul Bound Token
            </h3>
            <p className="text-gray-400">
              Obtain non-transferable identity tokens to prove your reputation and contributions on the platform
            </p>
          </div>
          
          {sbtStatus === 'none' && (
            <div className="space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">SBT Features</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Non-transferable, permanently bound to your address</li>
                  <li>• Records your platform contributions and reputation</li>
                  <li>• Unlocks special features and benefits</li>
                  <li>• Participate in advanced governance voting</li>
                </ul>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShowSBTModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => {
                    setSbtStatus('pending');
                    setTimeout(() => setSbtStatus('minted'), 2000);
                  }}
                >
                  Mint SBT
                </Button>
              </div>
            </div>
          )}
          
          {sbtStatus === 'pending' && (
            <div className="text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-white mb-4">Minting your SBT token...</p>
            </div>
          )}
          
          {sbtStatus === 'minted' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white mb-4">SBT token minted successfully!</p>
              <Button variant="primary" onClick={() => setShowSBTModal(false)}>
                View Token
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PrivacyPage;