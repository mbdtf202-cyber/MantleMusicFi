// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DAOGovernance
 * @dev DAO治理合约，实现去中心化治理投票和提案系统
 */
contract DAOGovernance is 
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    // 提案类型枚举
    enum ProposalType {
        GENERAL,        // 一般提案
        TREASURY,       // 财库提案
        PARAMETER,      // 参数调整
        UPGRADE,        // 合约升级
        EMERGENCY       // 紧急提案
    }

    // 提案状态枚举
    enum ProposalStatus {
        PENDING,        // 待投票
        ACTIVE,         // 投票中
        CANCELED,       // 已取消
        DEFEATED,       // 被否决
        SUCCEEDED,      // 通过
        QUEUED,         // 已排队
        EXPIRED,        // 已过期
        EXECUTED        // 已执行
    }

    // 投票权重类型
    enum VotingPowerType {
        TOKEN_BASED,    // 基于代币
        REPUTATION,     // 基于声誉
        HYBRID          // 混合模式
    }

    // 提案详细信息结构
    struct ProposalDetails {
        uint256 id;
        address proposer;
        string title;
        string description;
        ProposalType proposalType;
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
        mapping(address => uint8) votes; // 0=Against, 1=For, 2=Abstain
    }

    // 委托信息结构
    struct DelegationInfo {
        address delegate;
        uint256 delegatedPower;
        uint256 timestamp;
    }

    // 投票历史结构
    struct VoteHistory {
        uint256 proposalId;
        address voter;
        uint8 support;
        uint256 weight;
        uint256 timestamp;
        string reason;
    }

    // 状态变量
    mapping(uint256 => ProposalDetails) public proposalDetails;
    mapping(address => DelegationInfo) public delegations;
    mapping(uint256 => VoteHistory[]) public voteHistories;
    mapping(address => uint256) public reputationScores;
    mapping(address => bool) public proposalCreators;
    
    uint256 public proposalCount;
    uint256 public minimumProposalThreshold;
    uint256 public minimumQuorum;
    VotingPowerType public votingPowerType;
    IERC20 public governanceToken;
    
    // 提案费用
    uint256 public proposalFee;
    address public treasuryAddress;
    
    // 紧急提案设置
    mapping(address => bool) public emergencyProposers;
    uint256 public emergencyVotingPeriod;
    
    // 事件定义
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalType proposalType,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event DelegationChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event ReputationUpdated(address indexed user, uint256 oldScore, uint256 newScore);
    event EmergencyProposerAdded(address indexed proposer);
    event EmergencyProposerRemoved(address indexed proposer);

    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _treasuryAddress
    )
        Governor("MantleMusic DAO")
        GovernorSettings(1, 45818, 0) // 1 block, ~1 week, 0 proposal threshold
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4%
        GovernorTimelockControl(_timelock)
    {
        governanceToken = IERC20(address(_token));
        treasuryAddress = _treasuryAddress;
        minimumProposalThreshold = 1000 * 10**18; // 1000 tokens
        minimumQuorum = 4; // 4%
        votingPowerType = VotingPowerType.HYBRID;
        proposalFee = 100 * 10**18; // 100 tokens
        emergencyVotingPeriod = 86400; // 24 hours
    }

    // 重写必要的函数
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
        proposalDetails[proposalId].executed = true;
        emit ProposalExecuted(proposalId);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        uint256 proposalId = super._cancel(targets, values, calldatas, descriptionHash);
        proposalDetails[proposalId].canceled = true;
        emit ProposalCanceled(proposalId);
        return proposalId;
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev 创建提案
     */
    function createProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        string memory title,
        ProposalType proposalType
    ) public payable nonReentrant whenNotPaused returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        // 检查提案费用
        if (proposalFee > 0) {
            require(governanceToken.transferFrom(msg.sender, treasuryAddress, proposalFee), "Proposal fee payment failed");
        }
        
        // 检查提案权限
        if (proposalType == ProposalType.EMERGENCY) {
            require(emergencyProposers[msg.sender], "Not authorized for emergency proposals");
        } else {
            require(getVotes(msg.sender, block.number - 1) >= proposalThreshold(), "Insufficient voting power");
        }

        uint256 proposalId = propose(targets, values, calldatas, description);
        
        // 存储提案详细信息
        ProposalDetails storage proposal = proposalDetails[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.proposalType = proposalType;
        proposal.startTime = block.timestamp + votingDelay();
        
        if (proposalType == ProposalType.EMERGENCY) {
            proposal.endTime = proposal.startTime + emergencyVotingPeriod;
        } else {
            proposal.endTime = proposal.startTime + votingPeriod();
        }
        
        proposalCount++;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            proposalType,
            proposal.startTime,
            proposal.endTime
        );
        
        return proposalId;
    }

    /**
     * @dev 投票
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public override nonReentrant whenNotPaused returns (uint256) {
        require(support <= 2, "Invalid vote type");
        
        ProposalDetails storage proposal = proposalDetails[proposalId];
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 weight = _getVotingPower(msg.sender, proposalSnapshot(proposalId));
        require(weight > 0, "No voting power");
        
        // 记录投票
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = support;
        
        if (support == 0) {
            proposal.againstVotes += weight;
        } else if (support == 1) {
            proposal.forVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }
        
        // 记录投票历史
        voteHistories[proposalId].push(VoteHistory({
            proposalId: proposalId,
            voter: msg.sender,
            support: support,
            weight: weight,
            timestamp: block.timestamp,
            reason: reason
        }));
        
        emit VoteCast(msg.sender, proposalId, support, weight, reason);
        
        return super.castVoteWithReason(proposalId, support, reason);
    }

    /**
     * @dev 委托投票权
     */
    function delegateVotingPower(address to) external nonReentrant {
        require(to != address(0), "Cannot delegate to zero address");
        require(to != msg.sender, "Cannot delegate to self");
        
        address oldDelegate = delegations[msg.sender].delegate;
        
        delegations[msg.sender] = DelegationInfo({
            delegate: to,
            delegatedPower: getVotes(msg.sender, block.number - 1),
            timestamp: block.timestamp
        });
        
        emit DelegationChanged(msg.sender, oldDelegate, to);
    }

    /**
     * @dev 撤销委托
     */
    function revokeDelegation() external nonReentrant {
        address oldDelegate = delegations[msg.sender].delegate;
        delete delegations[msg.sender];
        
        emit DelegationChanged(msg.sender, oldDelegate, address(0));
    }

    /**
     * @dev 更新声誉分数（仅限管理员）
     */
    function updateReputationScore(address user, uint256 newScore) external onlyOwner {
        uint256 oldScore = reputationScores[user];
        reputationScores[user] = newScore;
        
        emit ReputationUpdated(user, oldScore, newScore);
    }

    /**
     * @dev 添加紧急提案创建者
     */
    function addEmergencyProposer(address proposer) external onlyOwner {
        emergencyProposers[proposer] = true;
        emit EmergencyProposerAdded(proposer);
    }

    /**
     * @dev 移除紧急提案创建者
     */
    function removeEmergencyProposer(address proposer) external onlyOwner {
        emergencyProposers[proposer] = false;
        emit EmergencyProposerRemoved(proposer);
    }

    /**
     * @dev 设置投票权重类型
     */
    function setVotingPowerType(VotingPowerType _type) external onlyOwner {
        votingPowerType = _type;
    }

    /**
     * @dev 设置提案费用
     */
    function setProposalFee(uint256 _fee) external onlyOwner {
        proposalFee = _fee;
    }

    /**
     * @dev 设置紧急投票期间
     */
    function setEmergencyVotingPeriod(uint256 _period) external onlyOwner {
        emergencyVotingPeriod = _period;
    }

    /**
     * @dev 获取投票权重
     */
    function _getVotingPower(address account, uint256 blockNumber) internal view returns (uint256) {
        if (votingPowerType == VotingPowerType.TOKEN_BASED) {
            return getVotes(account, blockNumber);
        } else if (votingPowerType == VotingPowerType.REPUTATION) {
            return reputationScores[account];
        } else {
            // 混合模式：代币权重 + 声誉权重
            uint256 tokenPower = getVotes(account, blockNumber);
            uint256 reputationPower = reputationScores[account];
            return (tokenPower * 70 + reputationPower * 30) / 100;
        }
    }

    /**
     * @dev 获取提案详细信息
     */
    function getProposalDetails(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        ProposalType proposalType,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool executed,
        bool canceled
    ) {
        ProposalDetails storage proposal = proposalDetails[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.proposalType,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed,
            proposal.canceled
        );
    }

    /**
     * @dev 获取投票历史
     */
    function getVoteHistory(uint256 proposalId) external view returns (VoteHistory[] memory) {
        return voteHistories[proposalId];
    }

    /**
     * @dev 获取用户投票记录
     */
    function getUserVote(uint256 proposalId, address user) external view returns (bool hasVoted, uint8 vote) {
        ProposalDetails storage proposal = proposalDetails[proposalId];
        return (proposal.hasVoted[user], proposal.votes[user]);
    }

    /**
     * @dev 获取委托信息
     */
    function getDelegationInfo(address user) external view returns (DelegationInfo memory) {
        return delegations[user];
    }

    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 紧急停止（仅限紧急情况）
     */
    function emergencyStop() external onlyOwner {
        _pause();
    }
}