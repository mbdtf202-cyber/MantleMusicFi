const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');

// Middleware for validation
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Mock data for development
let zkVerifications = new Map();
let soulboundTokens = new Map();
let complianceRequirements = new Map();
let userTokens = new Map();

// Initialize mock data
const initializeMockData = () => {
  // Mock ZK verifications
  zkVerifications.set('0x1234567890123456789012345678901234567890', {
    commitmentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    nullifierHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    verificationTime: Date.now() - 86400000, // 1 day ago
    status: 'Verified',
    level: 'Standard',
    verifier: '0xverifier123',
    proofHash: '0xproof123',
    expiryTime: Date.now() + 31536000000 // 1 year from now
  });

  // Mock SBTs
  soulboundTokens.set(1, {
    tokenId: 1,
    holder: '0x1234567890123456789012345678901234567890',
    tokenType: 'Identity',
    dataHash: '0xdata123',
    issuedTime: Date.now() - 86400000,
    expiryTime: 0, // Permanent
    isActive: true,
    score: 200,
    metadataURI: 'https://api.mantlemusic.com/sbt/1'
  });

  soulboundTokens.set(2, {
    tokenId: 2,
    holder: '0x1234567890123456789012345678901234567890',
    tokenType: 'Reputation',
    dataHash: '0xdata456',
    issuedTime: Date.now() - 86400000,
    expiryTime: 0,
    isActive: true,
    score: 750,
    metadataURI: 'https://api.mantlemusic.com/sbt/2'
  });

  // Mock compliance requirements
  complianceRequirements.set('invest', {
    requiredLevel: 'Standard',
    requiresActiveKYC: true,
    requiresSpecificSBT: false,
    requiredSBTType: null,
    minimumScore: 0,
    isActive: true
  });

  complianceRequirements.set('accredited_invest', {
    requiredLevel: 'Enhanced',
    requiresActiveKYC: true,
    requiresSpecificSBT: true,
    requiredSBTType: 'Accreditation',
    minimumScore: 500,
    isActive: true
  });

  // Mock user tokens
  userTokens.set('0x1234567890123456789012345678901234567890', [1, 2]);
};

initializeMockData();

// ZK-KYC Routes

/**
 * @route POST /api/privacy/zk-kyc/submit
 * @desc Submit ZK-KYC verification
 */
router.post('/zk-kyc/submit', [
  body('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
  body('commitmentHash').isLength({ min: 66, max: 66 }).withMessage('Valid commitment hash required'),
  body('nullifierHash').isLength({ min: 66, max: 66 }).withMessage('Valid nullifier hash required'),
  body('proofHash').isLength({ min: 66, max: 66 }).withMessage('Valid proof hash required'),
  body('level').isIn(['Basic', 'Standard', 'Enhanced', 'Institutional']).withMessage('Valid compliance level required'),
  validateRequest
], async (req, res) => {
  try {
    const { address, commitmentHash, nullifierHash, proofHash, level } = req.body;

    // Check if nullifier already used
    const existingVerifications = Array.from(zkVerifications.values());
    const nullifierUsed = existingVerifications.some(v => v.nullifierHash === nullifierHash);
    
    if (nullifierUsed) {
      return res.status(400).json({
        success: false,
        message: 'Nullifier already used'
      });
    }

    // Check if user already has pending/verified status
    const existingVerification = zkVerifications.get(address);
    if (existingVerification && ['Pending', 'Verified'].includes(existingVerification.status)) {
      return res.status(400).json({
        success: false,
        message: 'Verification already exists'
      });
    }

    // Create new verification
    const verification = {
      commitmentHash,
      nullifierHash,
      verificationTime: Date.now(),
      status: 'Pending',
      level,
      verifier: null,
      proofHash,
      expiryTime: Date.now() + 31536000000 // 1 year validity
    };

    zkVerifications.set(address, verification);

    res.json({
      success: true,
      message: 'ZK-KYC verification submitted successfully',
      data: {
        address,
        status: 'Pending',
        level,
        submissionTime: verification.verificationTime
      }
    });
  } catch (error) {
    console.error('ZK-KYC submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/privacy/zk-kyc/status/:address
 * @desc Get ZK-KYC verification status
 */
router.get('/zk-kyc/status/:address', [
  param('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
  validateRequest
], async (req, res) => {
  try {
    const { address } = req.params;
    const verification = zkVerifications.get(address);

    if (!verification) {
      return res.json({
        success: true,
        data: {
          status: 'Unverified',
          level: null,
          expiryTime: null,
          isValid: false
        }
      });
    }

    const isValid = verification.status === 'Verified' && verification.expiryTime > Date.now();

    res.json({
      success: true,
      data: {
        status: verification.status,
        level: verification.level,
        expiryTime: verification.expiryTime,
        isValid,
        verificationTime: verification.verificationTime,
        verifier: verification.verifier
      }
    });
  } catch (error) {
    console.error('ZK-KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/privacy/zk-kyc/approve
 * @desc Approve ZK-KYC verification (Admin only)
 */
router.post('/zk-kyc/approve', [
  body('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
  body('approvedLevel').isIn(['Basic', 'Standard', 'Enhanced', 'Institutional']).withMessage('Valid compliance level required'),
  body('verifier').isEthereumAddress().withMessage('Valid verifier address required'),
  validateRequest
], async (req, res) => {
  try {
    const { address, approvedLevel, verifier } = req.body;
    const verification = zkVerifications.get(address);

    if (!verification || verification.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending verification found'
      });
    }

    // Update verification status
    verification.status = 'Verified';
    verification.level = approvedLevel;
    verification.verifier = verifier;
    zkVerifications.set(address, verification);

    // Issue Identity SBT
    const tokenId = soulboundTokens.size + 1;
    const levelScores = { Basic: 100, Standard: 200, Enhanced: 300, Institutional: 400 };
    
    const sbt = {
      tokenId,
      holder: address,
      tokenType: 'Identity',
      dataHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      issuedTime: Date.now(),
      expiryTime: 0, // Permanent
      isActive: true,
      score: levelScores[approvedLevel],
      metadataURI: `https://api.mantlemusic.com/sbt/${tokenId}`
    };

    soulboundTokens.set(tokenId, sbt);
    
    // Update user tokens
    const tokens = userTokens.get(address) || [];
    tokens.push(tokenId);
    userTokens.set(address, tokens);

    res.json({
      success: true,
      message: 'ZK-KYC verification approved successfully',
      data: {
        address,
        status: 'Verified',
        level: approvedLevel,
        sbtIssued: {
          tokenId,
          type: 'Identity',
          score: levelScores[approvedLevel]
        }
      }
    });
  } catch (error) {
    console.error('ZK-KYC approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/privacy/zk-kyc/reject
 * @desc Reject ZK-KYC verification (Admin only)
 */
router.post('/zk-kyc/reject', [
  body('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
  body('reason').isLength({ min: 1, max: 500 }).withMessage('Rejection reason required'),
  body('verifier').isEthereumAddress().withMessage('Valid verifier address required'),
  validateRequest
], async (req, res) => {
  try {
    const { address, reason, verifier } = req.body;
    const verification = zkVerifications.get(address);

    if (!verification || verification.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending verification found'
      });
    }

    // Update verification status
    verification.status = 'Rejected';
    verification.verifier = verifier;
    verification.rejectionReason = reason;
    zkVerifications.set(address, verification);

    res.json({
      success: true,
      message: 'ZK-KYC verification rejected',
      data: {
        address,
        status: 'Rejected',
        reason
      }
    });
  } catch (error) {
    console.error('ZK-KYC rejection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Soulbound Token Routes

/**
 * @route GET /api/privacy/sbt/user/:address
 * @desc Get user's Soulbound Tokens
 */
router.get('/sbt/user/:address', [
  param('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
  validateRequest
], async (req, res) => {
  try {
    const { address } = req.params;
    const tokenIds = userTokens.get(address) || [];
    
    const tokens = tokenIds.map(id => soulboundTokens.get(id)).filter(Boolean);

    res.json({
      success: true,
      data: {
        address,
        tokens: tokens.map(token => ({
          tokenId: token.tokenId,
          tokenType: token.tokenType,
          score: token.score,
          isActive: token.isActive,
          issuedTime: token.issuedTime,
          expiryTime: token.expiryTime,
          metadataURI: token.metadataURI
        }))
      }
    });
  } catch (error) {
    console.error('SBT user tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/privacy/sbt/:tokenId
 * @desc Get SBT details
 */
router.get('/sbt/:tokenId', [
  param('tokenId').isInt({ min: 1 }).withMessage('Valid token ID required'),
  validateRequest
], async (req, res) => {
  try {
    const tokenId = parseInt(req.params.tokenId);
    const token = soulboundTokens.get(tokenId);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    res.json({
      success: true,
      data: {
        tokenId: token.tokenId,
        holder: token.holder,
        tokenType: token.tokenType,
        score: token.score,
        isActive: token.isActive,
        issuedTime: token.issuedTime,
        expiryTime: token.expiryTime,
        metadataURI: token.metadataURI
      }
    });
  } catch (error) {
    console.error('SBT details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/privacy/sbt/issue
 * @desc Issue a Soulbound Token (Admin only)
 */
router.post('/sbt/issue', [
  body('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
  body('tokenType').isIn(['Identity', 'Accreditation', 'Reputation', 'Compliance', 'Achievement']).withMessage('Valid token type required'),
  body('score').isInt({ min: 0, max: 1000 }).withMessage('Score must be between 0 and 1000'),
  body('metadataURI').optional().isURL().withMessage('Valid metadata URI required'),
  validateRequest
], async (req, res) => {
  try {
    const { address, tokenType, score, metadataURI } = req.body;
    
    const tokenId = soulboundTokens.size + 1;
    
    const sbt = {
      tokenId,
      holder: address,
      tokenType,
      dataHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      issuedTime: Date.now(),
      expiryTime: 0, // Permanent by default
      isActive: true,
      score,
      metadataURI: metadataURI || `https://api.mantlemusic.com/sbt/${tokenId}`
    };

    soulboundTokens.set(tokenId, sbt);
    
    // Update user tokens
    const tokens = userTokens.get(address) || [];
    tokens.push(tokenId);
    userTokens.set(address, tokens);

    res.json({
      success: true,
      message: 'Soulbound Token issued successfully',
      data: {
        tokenId,
        holder: address,
        tokenType,
        score,
        issuedTime: sbt.issuedTime
      }
    });
  } catch (error) {
    console.error('SBT issuance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/privacy/sbt/revoke
 * @desc Revoke a Soulbound Token (Admin only)
 */
router.post('/sbt/revoke', [
  body('tokenId').isInt({ min: 1 }).withMessage('Valid token ID required'),
  body('reason').isLength({ min: 1, max: 500 }).withMessage('Revocation reason required'),
  validateRequest
], async (req, res) => {
  try {
    const { tokenId, reason } = req.body;
    const token = soulboundTokens.get(parseInt(tokenId));

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    if (!token.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Token already revoked'
      });
    }

    // Revoke token
    token.isActive = false;
    token.revocationReason = reason;
    token.revocationTime = Date.now();
    soulboundTokens.set(parseInt(tokenId), token);

    res.json({
      success: true,
      message: 'Soulbound Token revoked successfully',
      data: {
        tokenId: parseInt(tokenId),
        holder: token.holder,
        reason,
        revocationTime: token.revocationTime
      }
    });
  } catch (error) {
    console.error('SBT revocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Compliance Routes

/**
 * @route GET /api/privacy/compliance/check/:address
 * @desc Check user compliance for specific requirements
 */
router.get('/compliance/check/:address', [
  param('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
  query('requirement').isLength({ min: 1 }).withMessage('Requirement parameter required'),
  validateRequest
], async (req, res) => {
  try {
    const { address } = req.params;
    const { requirement } = req.query;
    
    const req_data = complianceRequirements.get(requirement);
    if (!req_data || !req_data.isActive) {
      return res.json({
        success: true,
        data: {
          compliant: true,
          requirement,
          message: 'No active compliance requirement'
        }
      });
    }

    let compliant = true;
    let failureReasons = [];

    // Check KYC requirement
    if (req_data.requiresActiveKYC) {
      const verification = zkVerifications.get(address);
      if (!verification || verification.status !== 'Verified') {
        compliant = false;
        failureReasons.push('KYC verification required');
      } else if (verification.expiryTime < Date.now()) {
        compliant = false;
        failureReasons.push('KYC verification expired');
      } else {
        const levelOrder = { Basic: 0, Standard: 1, Enhanced: 2, Institutional: 3 };
        if (levelOrder[verification.level] < levelOrder[req_data.requiredLevel]) {
          compliant = false;
          failureReasons.push(`${req_data.requiredLevel} KYC level required`);
        }
      }
    }

    // Check SBT requirement
    if (req_data.requiresSpecificSBT) {
      const tokens = userTokens.get(address) || [];
      const requiredSBT = tokens
        .map(id => soulboundTokens.get(id))
        .find(token => token && token.tokenType === req_data.requiredSBTType && token.isActive);

      if (!requiredSBT) {
        compliant = false;
        failureReasons.push(`${req_data.requiredSBTType} SBT required`);
      } else if (requiredSBT.expiryTime > 0 && requiredSBT.expiryTime < Date.now()) {
        compliant = false;
        failureReasons.push(`${req_data.requiredSBTType} SBT expired`);
      } else if (requiredSBT.score < req_data.minimumScore) {
        compliant = false;
        failureReasons.push(`Minimum score of ${req_data.minimumScore} required`);
      }
    }

    res.json({
      success: true,
      data: {
        compliant,
        requirement,
        address,
        requirements: req_data,
        failureReasons: compliant ? [] : failureReasons
      }
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/privacy/compliance/requirements
 * @desc Get all compliance requirements
 */
router.get('/compliance/requirements', async (req, res) => {
  try {
    const requirements = Array.from(complianceRequirements.entries()).map(([key, value]) => ({
      requirement: key,
      ...value
    }));

    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('Compliance requirements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/privacy/compliance/requirements
 * @desc Set compliance requirement (Admin only)
 */
router.post('/compliance/requirements', [
  body('requirement').isLength({ min: 1, max: 100 }).withMessage('Valid requirement name required'),
  body('requiredLevel').isIn(['Basic', 'Standard', 'Enhanced', 'Institutional']).withMessage('Valid compliance level required'),
  body('requiresActiveKYC').isBoolean().withMessage('requiresActiveKYC must be boolean'),
  body('requiresSpecificSBT').isBoolean().withMessage('requiresSpecificSBT must be boolean'),
  body('requiredSBTType').optional().isIn(['Identity', 'Accreditation', 'Reputation', 'Compliance', 'Achievement']).withMessage('Valid SBT type required'),
  body('minimumScore').isInt({ min: 0, max: 1000 }).withMessage('Score must be between 0 and 1000'),
  validateRequest
], async (req, res) => {
  try {
    const { requirement, requiredLevel, requiresActiveKYC, requiresSpecificSBT, requiredSBTType, minimumScore } = req.body;

    const requirementData = {
      requiredLevel,
      requiresActiveKYC,
      requiresSpecificSBT,
      requiredSBTType: requiresSpecificSBT ? requiredSBTType : null,
      minimumScore,
      isActive: true
    };

    complianceRequirements.set(requirement, requirementData);

    res.json({
      success: true,
      message: 'Compliance requirement set successfully',
      data: {
        requirement,
        ...requirementData
      }
    });
  } catch (error) {
    console.error('Set compliance requirement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/privacy/reputation/:address
 * @desc Get user's reputation score
 */
router.get('/reputation/:address', [
  param('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
  validateRequest
], async (req, res) => {
  try {
    const { address } = req.params;
    const tokens = userTokens.get(address) || [];
    
    const reputationToken = tokens
      .map(id => soulboundTokens.get(id))
      .find(token => token && token.tokenType === 'Reputation' && token.isActive);

    let score = 0;
    let details = null;

    if (reputationToken && (reputationToken.expiryTime === 0 || reputationToken.expiryTime > Date.now())) {
      score = reputationToken.score;
      details = {
        tokenId: reputationToken.tokenId,
        issuedTime: reputationToken.issuedTime,
        expiryTime: reputationToken.expiryTime
      };
    }

    res.json({
      success: true,
      data: {
        address,
        reputationScore: score,
        details
      }
    });
  } catch (error) {
    console.error('Reputation score error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;