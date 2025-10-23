// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
/**
 * @title PrivacyCompliance
 * @dev Implements ZK-KYC verification and Soulbound Tokens (SBT) for privacy-preserving compliance
 */
contract PrivacyCompliance is ERC721, AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");

    // Token ID counter
    uint256 private _tokenIdCounter;

    // ZK-KYC verification status
    enum VerificationStatus {
        Unverified,
        Pending,
        Verified,
        Rejected,
        Revoked
    }

    // Compliance levels
    enum ComplianceLevel {
        Basic,      // Basic identity verification
        Standard,   // Standard KYC
        Enhanced,   // Enhanced due diligence
        Institutional // Institutional grade compliance
    }

    // SBT Types
    enum SBTType {
        Identity,       // Identity verification SBT
        Accreditation, // Accredited investor SBT
        Reputation,    // Reputation score SBT
        Compliance,    // Compliance certification SBT
        Achievement    // Achievement/milestone SBT
    }

    // ZK-KYC Verification Data
    struct ZKVerification {
        bytes32 commitmentHash;     // ZK commitment hash
        bytes32 nullifierHash;      // Nullifier to prevent double verification
        uint256 verificationTime;   // Timestamp of verification
        VerificationStatus status;  // Current verification status
        ComplianceLevel level;      // Compliance level achieved
        address verifier;           // Address of the verifier
        bytes32 proofHash;         // Hash of the ZK proof
        uint256 expiryTime;        // Verification expiry time
    }

    // Soulbound Token Data
    struct SoulboundToken {
        uint256 tokenId;           // Token ID
        address holder;            // Token holder (cannot be transferred)
        SBTType tokenType;         // Type of SBT
        bytes32 dataHash;          // Hash of token metadata
        uint256 issuedTime;        // Token issuance time
        uint256 expiryTime;        // Token expiry time (0 for permanent)
        bool isActive;             // Token active status
        uint256 score;             // Reputation/compliance score
        string metadataURI;        // Metadata URI
    }

    // Compliance Requirements
    struct ComplianceRequirement {
        ComplianceLevel requiredLevel;
        bool requiresActiveKYC;
        bool requiresSpecificSBT;
        SBTType requiredSBTType;
        uint256 minimumScore;
        bool isActive;
    }

    // Storage
    mapping(address => ZKVerification) public zkVerifications;
    mapping(uint256 => SoulboundToken) public soulboundTokens;
    mapping(address => uint256[]) public userTokens;
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(string => ComplianceRequirement) public complianceRequirements;
    mapping(address => mapping(SBTType => uint256)) public userSBTsByType;

    // Events
    event ZKVerificationSubmitted(
        address indexed user,
        bytes32 commitmentHash,
        bytes32 nullifierHash,
        ComplianceLevel level
    );

    event ZKVerificationApproved(
        address indexed user,
        ComplianceLevel level,
        address indexed verifier
    );

    event ZKVerificationRejected(
        address indexed user,
        string reason,
        address indexed verifier
    );

    event SBTIssued(
        uint256 indexed tokenId,
        address indexed holder,
        SBTType tokenType,
        uint256 score
    );

    event SBTRevoked(
        uint256 indexed tokenId,
        address indexed holder,
        string reason
    );

    event ComplianceRequirementUpdated(
        string indexed requirement,
        ComplianceLevel level,
        bool requiresKYC
    );

    constructor() ERC721("MantleMusic SBT", "MMSBT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);
    }

    // ZK-KYC Functions

    /**
     * @dev Submit ZK-KYC verification
     */
    function submitZKVerification(
        bytes32 _commitmentHash,
        bytes32 _nullifierHash,
        bytes32 _proofHash,
        ComplianceLevel _level
    ) external whenNotPaused {
        require(!usedNullifiers[_nullifierHash], "Nullifier already used");
        require(
            zkVerifications[msg.sender].status == VerificationStatus.Unverified ||
            zkVerifications[msg.sender].status == VerificationStatus.Rejected,
            "Verification already exists"
        );

        usedNullifiers[_nullifierHash] = true;

        zkVerifications[msg.sender] = ZKVerification({
            commitmentHash: _commitmentHash,
            nullifierHash: _nullifierHash,
            verificationTime: block.timestamp,
            status: VerificationStatus.Pending,
            level: _level,
            verifier: address(0),
            proofHash: _proofHash,
            expiryTime: block.timestamp + 365 days // 1 year validity
        });

        emit ZKVerificationSubmitted(msg.sender, _commitmentHash, _nullifierHash, _level);
    }

    /**
     * @dev Approve ZK-KYC verification
     */
    function approveZKVerification(
        address _user,
        ComplianceLevel _approvedLevel
    ) external onlyRole(VERIFIER_ROLE) {
        require(
            zkVerifications[_user].status == VerificationStatus.Pending,
            "No pending verification"
        );

        zkVerifications[_user].status = VerificationStatus.Verified;
        zkVerifications[_user].level = _approvedLevel;
        zkVerifications[_user].verifier = msg.sender;

        // Issue identity SBT
        _issueSBT(_user, SBTType.Identity, uint256(_approvedLevel) * 100, "");

        emit ZKVerificationApproved(_user, _approvedLevel, msg.sender);
    }

    /**
     * @dev Reject ZK-KYC verification
     */
    function rejectZKVerification(
        address _user,
        string calldata _reason
    ) external onlyRole(VERIFIER_ROLE) {
        require(
            zkVerifications[_user].status == VerificationStatus.Pending,
            "No pending verification"
        );

        zkVerifications[_user].status = VerificationStatus.Rejected;
        zkVerifications[_user].verifier = msg.sender;

        emit ZKVerificationRejected(_user, _reason, msg.sender);
    }

    /**
     * @dev Revoke ZK-KYC verification
     */
    function revokeZKVerification(
        address _user,
        string calldata _reason
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(
            zkVerifications[_user].status == VerificationStatus.Verified,
            "No verified status to revoke"
        );

        zkVerifications[_user].status = VerificationStatus.Revoked;

        // Revoke associated SBTs
        _revokeUserSBTs(_user, _reason);

        emit ZKVerificationRejected(_user, _reason, msg.sender);
    }

    // Soulbound Token Functions

    /**
     * @dev Issue a Soulbound Token
     */
    function issueSBT(
        address _to,
        SBTType _tokenType,
        uint256 _score,
        string calldata _metadataURI
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        _issueSBT(_to, _tokenType, _score, _metadataURI);
    }

    /**
     * @dev Internal function to issue SBT
     */
    function _issueSBT(
        address _to,
        SBTType _tokenType,
        uint256 _score,
        string memory _metadataURI
    ) internal {
        require(_to != address(0), "Cannot issue to zero address");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        // Create SBT
        soulboundTokens[tokenId] = SoulboundToken({
            tokenId: tokenId,
            holder: _to,
            tokenType: _tokenType,
            dataHash: keccak256(abi.encodePacked(_to, _tokenType, _score, block.timestamp)),
            issuedTime: block.timestamp,
            expiryTime: 0, // Permanent by default
            isActive: true,
            score: _score,
            metadataURI: _metadataURI
        });

        // Update user mappings
        userTokens[_to].push(tokenId);
        userSBTsByType[_to][_tokenType] = tokenId;

        // Mint the token (but make it non-transferable)
        _safeMint(_to, tokenId);

        emit SBTIssued(tokenId, _to, _tokenType, _score);
    }

    /**
     * @dev Revoke a Soulbound Token
     */
    function revokeSBT(
        uint256 _tokenId,
        string calldata _reason
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(soulboundTokens[_tokenId].holder != address(0), "Token does not exist");
        require(soulboundTokens[_tokenId].isActive, "Token already revoked");

        address holder = soulboundTokens[_tokenId].holder;
        soulboundTokens[_tokenId].isActive = false;

        // Remove from user's SBT mapping
        userSBTsByType[holder][soulboundTokens[_tokenId].tokenType] = 0;

        emit SBTRevoked(_tokenId, holder, _reason);
    }

    /**
     * @dev Revoke all SBTs for a user
     */
    function _revokeUserSBTs(address _user, string memory _reason) internal {
        uint256[] memory tokens = userTokens[_user];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (soulboundTokens[tokens[i]].isActive) {
                soulboundTokens[tokens[i]].isActive = false;
                userSBTsByType[_user][soulboundTokens[tokens[i]].tokenType] = 0;
                emit SBTRevoked(tokens[i], _user, _reason);
            }
        }
    }

    // Compliance Functions

    /**
     * @dev Set compliance requirement for a specific action
     */
    function setComplianceRequirement(
        string calldata _requirement,
        ComplianceLevel _requiredLevel,
        bool _requiresActiveKYC,
        bool _requiresSpecificSBT,
        SBTType _requiredSBTType,
        uint256 _minimumScore
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        complianceRequirements[_requirement] = ComplianceRequirement({
            requiredLevel: _requiredLevel,
            requiresActiveKYC: _requiresActiveKYC,
            requiresSpecificSBT: _requiresSpecificSBT,
            requiredSBTType: _requiredSBTType,
            minimumScore: _minimumScore,
            isActive: true
        });

        emit ComplianceRequirementUpdated(_requirement, _requiredLevel, _requiresActiveKYC);
    }

    /**
     * @dev Check if user meets compliance requirements
     */
    function checkCompliance(
        address _user,
        string calldata _requirement
    ) external view returns (bool) {
        ComplianceRequirement memory req = complianceRequirements[_requirement];
        if (!req.isActive) return true;

        // Check KYC requirement
        if (req.requiresActiveKYC) {
            ZKVerification memory verification = zkVerifications[_user];
            if (verification.status != VerificationStatus.Verified) return false;
            if (verification.expiryTime < block.timestamp) return false;
            if (uint256(verification.level) < uint256(req.requiredLevel)) return false;
        }

        // Check SBT requirement
        if (req.requiresSpecificSBT) {
            uint256 tokenId = userSBTsByType[_user][req.requiredSBTType];
            if (tokenId == 0) return false;
            
            SoulboundToken memory sbt = soulboundTokens[tokenId];
            if (!sbt.isActive) return false;
            if (sbt.expiryTime > 0 && sbt.expiryTime < block.timestamp) return false;
            if (sbt.score < req.minimumScore) return false;
        }

        return true;
    }

    // View Functions

    /**
     * @dev Get user's verification status
     */
    function getVerificationStatus(address _user) external view returns (
        VerificationStatus status,
        ComplianceLevel level,
        uint256 expiryTime,
        bool isValid
    ) {
        ZKVerification memory verification = zkVerifications[_user];
        return (
            verification.status,
            verification.level,
            verification.expiryTime,
            verification.status == VerificationStatus.Verified && 
            verification.expiryTime > block.timestamp
        );
    }

    /**
     * @dev Get user's SBTs
     */
    function getUserSBTs(address _user) external view returns (uint256[] memory) {
        return userTokens[_user];
    }

    /**
     * @dev Get SBT details
     */
    function getSBTDetails(uint256 _tokenId) external view returns (
        address holder,
        SBTType tokenType,
        uint256 score,
        bool isActive,
        uint256 issuedTime,
        uint256 expiryTime
    ) {
        require(soulboundTokens[_tokenId].holder != address(0), "Token does not exist");
        SoulboundToken memory sbt = soulboundTokens[_tokenId];
        return (
            sbt.holder,
            sbt.tokenType,
            sbt.score,
            sbt.isActive,
            sbt.issuedTime,
            sbt.expiryTime
        );
    }

    /**
     * @dev Get user's reputation score
     */
    function getUserReputationScore(address _user) external view returns (uint256) {
        uint256 tokenId = userSBTsByType[_user][SBTType.Reputation];
        if (tokenId == 0) return 0;
        
        SoulboundToken memory sbt = soulboundTokens[tokenId];
        if (!sbt.isActive) return 0;
        if (sbt.expiryTime > 0 && sbt.expiryTime < block.timestamp) return 0;
        
        return sbt.score;
    }

    // Override _update function to make tokens soulbound
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // But prevent transfers between addresses
        if (from != address(0) && to != address(0)) {
            revert("Soulbound tokens cannot be transferred");
        }
        
        return super._update(to, tokenId, auth);
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound tokens cannot be approved");
    }

    // Admin Functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(soulboundTokens[tokenId].holder != address(0), "Token does not exist");
        return soulboundTokens[tokenId].metadataURI;
    }
}