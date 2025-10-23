'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PrivacyService, { ZKVerification, SBTToken, ComplianceCheck, KYCSubmission } from '@/services/privacyService';
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
  Zap,
  Clock,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';

const PrivacyPage = () => {
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showSBTModal, setShowSBTModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [zkVerification, setZkVerification] = useState<ZKVerification | null>(null);
  const [sbtTokens, setSbtTokens] = useState<SBTToken[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState('0x1234567890123456789012345678901234567890'); // Mock address

  // KYC form data
  const [kycForm, setKycForm] = useState({
    level: 'Standard',
    commitmentHash: '',
    nullifierHash: '',
    proofHash: ''
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load ZK verification status
      const zkData = await PrivacyService.getZKVerificationStatus(userAddress);
      setZkVerification(zkData);

      // Load SBT tokens
      const sbtTokens = await PrivacyService.getUserSBTTokens(userAddress);
      setSbtTokens(sbtTokens);

      // Load compliance status for common requirements
      const requirements = ['invest', 'accredited_invest', 'high_value_invest', 'institutional_invest'];
      const complianceResults = await PrivacyService.getComplianceStatus(userAddress, requirements);
      setComplianceStatus(complianceResults);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitKYC = async () => {
    if (!kycForm.commitmentHash || !kycForm.nullifierHash || !kycForm.proofHash) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const submission: KYCSubmission = {
        address: userAddress,
        ...kycForm
      };

      const result = await PrivacyService.submitZKVerification(submission);
      
      if (result.success) {
        alert(result.message);
        setShowKYCModal(false);
        loadUserData(); // Refresh data
      } else {
        alert(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      alert('Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const generateMockProof = () => {
    setKycForm({
      ...kycForm,
      commitmentHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      nullifierHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      proofHash: `0x${Math.random().toString(16).substr(2, 64)}`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified': return CheckCircle;
      case 'Pending': return Clock;
      case 'Rejected': return X;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Privacy & Compliance Center
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Secure your identity with zero-knowledge proofs and soulbound tokens while maintaining full privacy
          </p>
        </motion.div>

        {/* User Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Privacy Status</h2>
              <Button
                variant="outline"
                onClick={loadUserData}
                disabled={loading}
                className="text-sm"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ZK-KYC Status */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-white">ZK-KYC</span>
                  </div>
                  {zkVerification && (
                    <div className="flex items-center space-x-1">
                      {React.createElement(getStatusIcon(zkVerification.status), {
                        className: "w-4 h-4",
                        style: { color: getStatusColor(zkVerification.status) }
                      })}
                      <span 
                        className="text-sm font-medium"
                        style={{ color: getStatusColor(zkVerification.status) }}
                      >
                        {zkVerification.status}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  {zkVerification?.status === 'Verified' 
                    ? `Level: ${zkVerification.level}` 
                    : 'Complete identity verification'}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowKYCModal(true)}
                  disabled={zkVerification?.status === 'Verified'}
                  className="w-full"
                >
                  {zkVerification?.status === 'Verified' ? 'Verified' : 'Start KYC'}
                </Button>
              </div>

              {/* SBT Tokens */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-white">SBT Tokens</span>
                  </div>
                  <span className="text-purple-400 font-bold">{sbtTokens.length}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  {sbtTokens.length > 0 
                    ? `${sbtTokens.filter(t => t.isActive).length} active tokens`
                    : 'No tokens issued yet'}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSBTModal(true)}
                  className="w-full"
                >
                  View Tokens
                </Button>
              </div>

              {/* Compliance Status */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white">Compliance</span>
                  </div>
                  <span className="text-green-400 font-bold">
                    {complianceStatus.filter(c => c.compliant).length}/{complianceStatus.length}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  {complianceStatus.filter(c => c.compliant).length === complianceStatus.length
                    ? 'All requirements met'
                    : 'Some requirements pending'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComplianceModal(true)}
                  className="w-full"
                >
                  Check Status
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Privacy Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* ZK-KYC Feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="glass" className="p-6 h-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">ZK-KYC Verification</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Use zero-knowledge proof technology for identity verification, protecting user privacy while meeting compliance requirements.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Privacy-preserving verification</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Multiple compliance levels</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Cryptographic proof generation</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* SBT Feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="glass" className="p-6 h-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Soulbound Tokens</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Obtain non-transferable soul-bound tokens to prove your identity, reputation, and achievements on-chain.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Non-transferable identity</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Reputation scoring</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Achievement tracking</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Privacy Protection Feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="glass" className="p-6 h-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Lock className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Privacy Protection</h3>
              </div>
              <p className="text-gray-300 mb-6">
                All personal data is encrypted and protected using advanced cryptographic techniques to ensure maximum privacy.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>End-to-end encryption</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Zero-knowledge architecture</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>GDPR compliant</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* SBT Tokens Display */}
        {sbtTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Card variant="glass" className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Your Soulbound Tokens</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sbtTokens.map((token) => (
                  <div key={token.tokenId} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-white">#{token.tokenId}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        token.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {token.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">{token.tokenType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Score:</span>
                        <span className="text-purple-400 font-bold">{token.score}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Issued:</span>
                        <span className="text-white">
                          {new Date(token.issuedTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Compliance Status Display */}
        {complianceStatus.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="glass" className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Compliance Status</h2>
              <div className="space-y-4">
                {complianceStatus.map((status, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white capitalize">
                        {status.requirement.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        {status.compliant ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <X className="w-5 h-5 text-red-400" />
                        )}
                        <span className={`font-medium ${
                          status.compliant ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {status.compliant ? 'Compliant' : 'Non-compliant'}
                        </span>
                      </div>
                    </div>
                    {!status.compliant && status.failureReasons.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-400 mb-1">Requirements:</p>
                        <ul className="text-sm text-red-400 space-y-1">
                          {status.failureReasons.map((reason, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* ZK-KYC Modal */}
      <Modal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">ZK-KYC Verification</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Compliance Level
              </label>
              <select
                value={kycForm.level}
                onChange={(e) => setKycForm({ ...kycForm, level: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Enhanced">Enhanced</option>
                <option value="Institutional">Institutional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Commitment Hash
              </label>
              <Input
                value={kycForm.commitmentHash}
                onChange={(e) => setKycForm({ ...kycForm, commitmentHash: e.target.value })}
                placeholder="0x..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nullifier Hash
              </label>
              <Input
                value={kycForm.nullifierHash}
                onChange={(e) => setKycForm({ ...kycForm, nullifierHash: e.target.value })}
                placeholder="0x..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proof Hash
              </label>
              <Input
                value={kycForm.proofHash}
                onChange={(e) => setKycForm({ ...kycForm, proofHash: e.target.value })}
                placeholder="0x..."
                className="w-full"
              />
            </div>

            <Button
              variant="outline"
              onClick={generateMockProof}
              className="w-full mb-4"
            >
              Generate Mock Proof (Demo)
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={submitKYC}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Verification'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowKYCModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* SBT Modal */}
      <Modal isOpen={showSBTModal} onClose={() => setShowSBTModal(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Soulbound Tokens</h2>
          
          {sbtTokens.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No SBT tokens issued yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Complete KYC verification to receive your first identity token
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sbtTokens.map((token) => (
                <div key={token.tokenId} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">Token #{token.tokenId}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      token.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {token.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <p className="text-white font-medium">{token.tokenType}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Score:</span>
                      <p className="text-purple-400 font-bold">{token.score}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Issued:</span>
                      <p className="text-white">{new Date(token.issuedTime).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Expires:</span>
                      <p className="text-white">
                        {token.expiryTime === 0 ? 'Never' : new Date(token.expiryTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(token.metadataURI, '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Metadata
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowSBTModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Compliance Modal */}
      <Modal isOpen={showComplianceModal} onClose={() => setShowComplianceModal(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Compliance Status</h2>
          
          {complianceStatus.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No compliance requirements found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complianceStatus.map((status, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white capitalize">
                      {status.requirement.replace('_', ' ')}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {status.compliant ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                      <span className={`font-medium ${
                        status.compliant ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {status.compliant ? 'Compliant' : 'Non-compliant'}
                      </span>
                    </div>
                  </div>
                  
                  {!status.compliant && status.failureReasons.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Missing requirements:</p>
                      <ul className="space-y-1">
                        {status.failureReasons.map((reason, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-sm text-red-400">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowComplianceModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PrivacyPage;