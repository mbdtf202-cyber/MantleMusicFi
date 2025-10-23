// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Treasury
 * @dev 音乐版权收益分配合约
 * 
 * 功能特性:
 * - 接收版权收益
 * - 按持有比例分配收益
 * - 支持多种代币收益
 * - 快照机制
 * - 批量分配
 */
contract Treasury is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // MRT代币合约接口
    IERC20 public immutable mrtToken;
    
    // 收益分配信息
    struct RoyaltyDistribution {
        uint256 totalAmount;        // 总收益金额
        uint256 timestamp;          // 分配时间戳
        uint256 snapshotId;         // 快照ID
        address token;              // 收益代币地址 (address(0) = ETH)
        uint256 totalSupply;        // 快照时的总供应量
        bool isDistributed;         // 是否已分配
        mapping(address => bool) claimed; // 用户是否已领取
    }
    
    // 用户余额快照
    struct BalanceSnapshot {
        uint256 balance;
        uint256 timestamp;
    }
    
    // 分配ID到分配信息的映射
    mapping(uint256 => RoyaltyDistribution) public distributions;
    
    // 用户地址到快照ID到余额的映射
    mapping(address => mapping(uint256 => BalanceSnapshot)) public balanceSnapshots;
    
    // 快照ID到总供应量的映射
    mapping(uint256 => uint256) public totalSupplySnapshots;
    
    // 用户待领取收益
    mapping(address => mapping(address => uint256)) public pendingRoyalties;
    
    // 分配计数器
    uint256 private _distributionIdCounter;
    
    // 快照计数器
    uint256 private _snapshotIdCounter;
    
    // 最小分配金额
    uint256 public constant MIN_DISTRIBUTION_AMOUNT = 0.01 ether;
    
    // 分配手续费率 (基点，100 = 1%)
    uint256 public distributionFeeRate = 100; // 1%
    
    // 累计手续费
    mapping(address => uint256) public accumulatedFees;
    
    // 事件定义
    event RoyaltyReceived(
        address indexed from,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event RoyaltyDistributed(
        uint256 indexed distributionId,
        address indexed token,
        uint256 totalAmount,
        uint256 snapshotId,
        uint256 timestamp
    );
    
    event RoyaltyClaimed(
        address indexed user,
        uint256 indexed distributionId,
        address indexed token,
        uint256 amount
    );
    
    event SnapshotTaken(
        uint256 indexed snapshotId,
        uint256 totalSupply,
        uint256 timestamp
    );
    
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);
    
    constructor(address _mrtToken, address initialOwner) Ownable(initialOwner) {
        require(_mrtToken != address(0), "Treasury: MRT token cannot be zero address");
        mrtToken = IERC20(_mrtToken);
        _distributionIdCounter = 1;
        _snapshotIdCounter = 1;
    }
    
    /**
     * @dev 接收ETH收益
     */
    receive() external payable {
        require(msg.value > 0, "Treasury: amount must be greater than 0");
        emit RoyaltyReceived(msg.sender, address(0), msg.value, block.timestamp);
    }
    
    /**
     * @dev 接收ERC20代币收益
     */
    function receiveTokenRoyalty(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Treasury: token cannot be zero address");
        require(amount > 0, "Treasury: amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        emit RoyaltyReceived(msg.sender, token, amount, block.timestamp);
    }
    
    /**
     * @dev 创建余额快照
     */
    function takeSnapshot() external onlyOwner returns (uint256) {
        uint256 snapshotId = _snapshotIdCounter++;
        uint256 totalSupply = mrtToken.totalSupply();
        
        totalSupplySnapshots[snapshotId] = totalSupply;
        
        emit SnapshotTaken(snapshotId, totalSupply, block.timestamp);
        
        return snapshotId;
    }
    
    /**
     * @dev 批量记录用户余额快照
     */
    function batchRecordBalances(
        uint256 snapshotId,
        address[] memory users
    ) external onlyOwner {
        require(totalSupplySnapshots[snapshotId] > 0, "Treasury: snapshot does not exist");
        require(users.length <= 100, "Treasury: too many users");
        
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (balanceSnapshots[user][snapshotId].timestamp == 0) {
                balanceSnapshots[user][snapshotId] = BalanceSnapshot({
                    balance: mrtToken.balanceOf(user),
                    timestamp: block.timestamp
                });
            }
        }
    }
    
    /**
     * @dev 分配收益
     */
    function distributeRoyalties(
        address token,
        uint256 amount,
        uint256 snapshotId
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256) {
        require(amount >= MIN_DISTRIBUTION_AMOUNT, "Treasury: amount too small");
        require(totalSupplySnapshots[snapshotId] > 0, "Treasury: snapshot does not exist");
        
        // 检查合约余额
        if (token == address(0)) {
            require(address(this).balance >= amount, "Treasury: insufficient ETH balance");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Treasury: insufficient token balance");
        }
        
        uint256 distributionId = _distributionIdCounter++;
        
        // 计算手续费
        uint256 fee = (amount * distributionFeeRate) / 10000;
        uint256 netAmount = amount - fee;
        
        // 记录手续费
        accumulatedFees[token] += fee;
        
        // 创建分配记录
        RoyaltyDistribution storage distribution = distributions[distributionId];
        distribution.totalAmount = netAmount;
        distribution.timestamp = block.timestamp;
        distribution.snapshotId = snapshotId;
        distribution.token = token;
        distribution.totalSupply = totalSupplySnapshots[snapshotId];
        distribution.isDistributed = true;
        
        emit RoyaltyDistributed(distributionId, token, netAmount, snapshotId, block.timestamp);
        
        return distributionId;
    }
    
    /**
     * @dev 用户领取收益
     */
    function claimRoyalties(uint256 distributionId) external nonReentrant whenNotPaused {
        RoyaltyDistribution storage distribution = distributions[distributionId];
        require(distribution.isDistributed, "Treasury: distribution does not exist");
        require(!distribution.claimed[msg.sender], "Treasury: already claimed");
        
        uint256 snapshotId = distribution.snapshotId;
        uint256 userBalance = balanceSnapshots[msg.sender][snapshotId].balance;
        require(userBalance > 0, "Treasury: no balance at snapshot");
        
        // 计算用户应得收益
        uint256 userRoyalty = (distribution.totalAmount * userBalance) / distribution.totalSupply;
        require(userRoyalty > 0, "Treasury: no royalty to claim");
        
        // 标记为已领取
        distribution.claimed[msg.sender] = true;
        
        // 转账
        if (distribution.token == address(0)) {
            payable(msg.sender).transfer(userRoyalty);
        } else {
            IERC20(distribution.token).safeTransfer(msg.sender, userRoyalty);
        }
        
        emit RoyaltyClaimed(msg.sender, distributionId, distribution.token, userRoyalty);
    }
    
    /**
     * @dev 批量领取收益
     */
    function batchClaimRoyalties(uint256[] memory distributionIds) external nonReentrant whenNotPaused {
        require(distributionIds.length <= 20, "Treasury: too many distributions");
        
        for (uint256 i = 0; i < distributionIds.length; i++) {
            uint256 distributionId = distributionIds[i];
            RoyaltyDistribution storage distribution = distributions[distributionId];
            
            if (distribution.isDistributed && !distribution.claimed[msg.sender]) {
                uint256 snapshotId = distribution.snapshotId;
                uint256 userBalance = balanceSnapshots[msg.sender][snapshotId].balance;
                
                if (userBalance > 0) {
                    uint256 userRoyalty = (distribution.totalAmount * userBalance) / distribution.totalSupply;
                    
                    if (userRoyalty > 0) {
                        distribution.claimed[msg.sender] = true;
                        
                        if (distribution.token == address(0)) {
                            payable(msg.sender).transfer(userRoyalty);
                        } else {
                            IERC20(distribution.token).safeTransfer(msg.sender, userRoyalty);
                        }
                        
                        emit RoyaltyClaimed(msg.sender, distributionId, distribution.token, userRoyalty);
                    }
                }
            }
        }
    }
    
    /**
     * @dev 计算用户待领取收益
     */
    function calculatePendingRoyalties(
        address user,
        uint256 distributionId
    ) external view returns (uint256) {
        RoyaltyDistribution storage distribution = distributions[distributionId];
        
        if (!distribution.isDistributed || distribution.claimed[user]) {
            return 0;
        }
        
        uint256 snapshotId = distribution.snapshotId;
        uint256 userBalance = balanceSnapshots[user][snapshotId].balance;
        
        if (userBalance == 0 || distribution.totalSupply == 0) {
            return 0;
        }
        
        return (distribution.totalAmount * userBalance) / distribution.totalSupply;
    }
    
    /**
     * @dev 获取用户在快照时的余额
     */
    function getBalanceAtSnapshot(
        address user,
        uint256 snapshotId
    ) external view returns (uint256) {
        return balanceSnapshots[user][snapshotId].balance;
    }
    
    /**
     * @dev 检查用户是否已领取收益
     */
    function hasClaimed(address user, uint256 distributionId) external view returns (bool) {
        return distributions[distributionId].claimed[user];
    }
    
    /**
     * @dev 设置分配手续费率
     */
    function setDistributionFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Treasury: fee rate too high"); // 最大10%
        
        uint256 oldRate = distributionFeeRate;
        distributionFeeRate = newRate;
        
        emit FeeRateUpdated(oldRate, newRate);
    }
    
    /**
     * @dev 提取累计手续费
     */
    function withdrawFees(address token) external onlyOwner {
        uint256 fee = accumulatedFees[token];
        require(fee > 0, "Treasury: no fees to withdraw");
        
        accumulatedFees[token] = 0;
        
        if (token == address(0)) {
            payable(owner()).transfer(fee);
        } else {
            IERC20(token).safeTransfer(owner(), fee);
        }
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
     * @dev 紧急提取
     */
    function emergencyWithdraw(address token) external onlyOwner {
        if (token == address(0)) {
            uint256 balance = address(this).balance;
            if (balance > 0) {
                payable(owner()).transfer(balance);
            }
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > 0) {
                IERC20(token).safeTransfer(owner(), balance);
            }
        }
    }
}