// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title YieldAggregator
 * @dev 收益聚合器合约 - 自动优化收益策略
 * 
 * 功能特性:
 * - 多策略收益优化
 * - 自动复投
 * - 风险管理
 * - 收益分配
 * - 策略切换
 */
contract YieldAggregator is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // 策略信息
    struct Strategy {
        address strategyAddress;    // 策略合约地址
        string name;               // 策略名称
        uint256 allocation;        // 分配比例 (基点)
        uint256 totalDeposited;    // 总存款
        uint256 totalEarned;       // 总收益
        uint256 lastHarvest;       // 最后收获时间
        uint256 performanceFee;    // 绩效费率
        uint256 managementFee;     // 管理费率
        bool isActive;             // 是否激活
        uint256 riskLevel;         // 风险等级 (1-5)
        uint256 expectedAPY;       // 预期年化收益率
    }
    
    // 用户信息
    struct UserInfo {
        uint256 shares;            // 份额
        uint256 lastDepositTime;   // 最后存款时间
        uint256 totalDeposited;    // 总存款
        uint256 totalWithdrawn;    // 总提取
        uint256 rewardDebt;        // 奖励债务
        uint256 pendingRewards;    // 待领取奖励
    }
    
    // 收益池信息
    struct Pool {
        IERC20 token;              // 代币
        uint256 totalShares;       // 总份额
        uint256 totalAssets;       // 总资产
        uint256 lastRewardTime;    // 最后奖励时间
        uint256 accRewardPerShare; // 累计每份额奖励
        uint256 depositFee;        // 存款费率
        uint256 withdrawalFee;     // 提取费率
        uint256 minDeposit;        // 最小存款
        uint256 maxDeposit;        // 最大存款
        bool isActive;             // 是否激活
    }
    
    // 策略映射
    mapping(uint256 => Strategy) public strategies;
    
    // 收益池映射
    mapping(address => Pool) public pools;
    
    // 用户信息映射
    mapping(address => mapping(address => UserInfo)) public userInfo;
    
    // 策略列表
    uint256[] public strategyIds;
    
    // 支持的代币列表
    address[] public supportedTokens;
    
    // 策略计数器
    uint256 public strategyCounter;
    
    // 总分配比例
    uint256 public totalAllocation;
    
    // 最大分配比例
    uint256 public constant MAX_ALLOCATION = 10000; // 100%
    
    // 最大费率
    uint256 public constant MAX_FEE = 1000; // 10%
    
    // 自动复投阈值
    uint256 public autoCompoundThreshold = 1000e18; // 1000 tokens
    
    // 事件定义
    event StrategyAdded(
        uint256 indexed strategyId,
        address indexed strategyAddress,
        string name,
        uint256 allocation
    );
    
    event StrategyUpdated(
        uint256 indexed strategyId,
        uint256 newAllocation,
        bool isActive
    );
    
    event PoolAdded(
        address indexed token,
        uint256 depositFee,
        uint256 withdrawalFee
    );
    
    event Deposit(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 shares
    );
    
    event Withdraw(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 shares
    );
    
    event Harvest(
        uint256 indexed strategyId,
        uint256 totalRewards,
        uint256 performanceFee
    );
    
    event Compound(
        address indexed token,
        uint256 amount,
        uint256 newShares
    );
    
    event RewardsClaimed(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    event StrategyRebalanced(
        uint256[] strategyIds,
        uint256[] newAllocations
    );
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev 添加策略
     */
    function addStrategy(
        address strategyAddress,
        string memory name,
        uint256 allocation,
        uint256 performanceFee,
        uint256 managementFee,
        uint256 riskLevel,
        uint256 expectedAPY
    ) external onlyOwner {
        require(strategyAddress != address(0), "Invalid strategy address");
        require(allocation <= MAX_ALLOCATION, "Allocation too high");
        require(performanceFee <= MAX_FEE, "Performance fee too high");
        require(managementFee <= MAX_FEE, "Management fee too high");
        require(riskLevel >= 1 && riskLevel <= 5, "Invalid risk level");
        require(totalAllocation + allocation <= MAX_ALLOCATION, "Total allocation exceeded");
        
        uint256 strategyId = strategyCounter++;
        
        strategies[strategyId] = Strategy({
            strategyAddress: strategyAddress,
            name: name,
            allocation: allocation,
            totalDeposited: 0,
            totalEarned: 0,
            lastHarvest: block.timestamp,
            performanceFee: performanceFee,
            managementFee: managementFee,
            isActive: true,
            riskLevel: riskLevel,
            expectedAPY: expectedAPY
        });
        
        strategyIds.push(strategyId);
        totalAllocation += allocation;
        
        emit StrategyAdded(strategyId, strategyAddress, name, allocation);
    }
    
    /**
     * @dev 添加收益池
     */
    function addPool(
        address token,
        uint256 depositFee,
        uint256 withdrawalFee,
        uint256 minDeposit,
        uint256 maxDeposit
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(depositFee <= MAX_FEE, "Deposit fee too high");
        require(withdrawalFee <= MAX_FEE, "Withdrawal fee too high");
        require(!pools[token].isActive, "Pool already exists");
        
        pools[token] = Pool({
            token: IERC20(token),
            totalShares: 0,
            totalAssets: 0,
            lastRewardTime: block.timestamp,
            accRewardPerShare: 0,
            depositFee: depositFee,
            withdrawalFee: withdrawalFee,
            minDeposit: minDeposit,
            maxDeposit: maxDeposit,
            isActive: true
        });
        
        supportedTokens.push(token);
        
        emit PoolAdded(token, depositFee, withdrawalFee);
    }
    
    /**
     * @dev 存款
     */
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        Pool storage pool = pools[token];
        require(pool.isActive, "Pool not active");
        require(amount >= pool.minDeposit, "Amount below minimum");
        require(amount <= pool.maxDeposit, "Amount above maximum");
        
        UserInfo storage user = userInfo[msg.sender][token];
        
        // 更新池奖励
        updatePool(token);
        
        // 计算存款费用
        uint256 depositFeeAmount = (amount * pool.depositFee) / MAX_ALLOCATION;
        uint256 netAmount = amount - depositFeeAmount;
        
        // 计算份额
        uint256 shares;
        if (pool.totalShares == 0) {
            shares = netAmount;
        } else {
            shares = (netAmount * pool.totalShares) / pool.totalAssets;
        }
        
        // 处理待领取奖励
        if (user.shares > 0) {
            uint256 pending = (user.shares * pool.accRewardPerShare) / 1e12 - user.rewardDebt;
            if (pending > 0) {
                user.pendingRewards += pending;
            }
        }
        
        // 更新用户信息
        user.shares += shares;
        user.lastDepositTime = block.timestamp;
        user.totalDeposited += amount;
        user.rewardDebt = (user.shares * pool.accRewardPerShare) / 1e12;
        
        // 更新池信息
        pool.totalShares += shares;
        pool.totalAssets += netAmount;
        
        // 转移代币
        pool.token.safeTransferFrom(msg.sender, address(this), amount);
        
        // 分配到策略
        distributeToStrategies(token, netAmount);
        
        emit Deposit(msg.sender, token, amount, shares);
    }
    
    /**
     * @dev 提取
     */
    function withdraw(address token, uint256 shares) external nonReentrant {
        Pool storage pool = pools[token];
        require(pool.isActive, "Pool not active");
        
        UserInfo storage user = userInfo[msg.sender][token];
        require(user.shares >= shares, "Insufficient shares");
        
        // 更新池奖励
        updatePool(token);
        
        // 计算提取金额
        uint256 amount = (shares * pool.totalAssets) / pool.totalShares;
        
        // 从策略中提取
        withdrawFromStrategies(token, amount);
        
        // 计算提取费用
        uint256 withdrawalFeeAmount = (amount * pool.withdrawalFee) / MAX_ALLOCATION;
        uint256 netAmount = amount - withdrawalFeeAmount;
        
        // 处理待领取奖励
        uint256 pending = (user.shares * pool.accRewardPerShare) / 1e12 - user.rewardDebt;
        if (pending > 0) {
            user.pendingRewards += pending;
        }
        
        // 更新用户信息
        user.shares -= shares;
        user.totalWithdrawn += netAmount;
        user.rewardDebt = (user.shares * pool.accRewardPerShare) / 1e12;
        
        // 更新池信息
        pool.totalShares -= shares;
        pool.totalAssets -= amount;
        
        // 转移代币
        pool.token.safeTransfer(msg.sender, netAmount);
        
        emit Withdraw(msg.sender, token, netAmount, shares);
    }
    
    /**
     * @dev 收获收益
     */
    function harvest(uint256 strategyId) external nonReentrant {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.isActive, "Strategy not active");
        
        // 调用策略收获
        uint256 rewards = IStrategy(strategy.strategyAddress).harvest();
        
        if (rewards > 0) {
            // 计算费用
            uint256 performanceFeeAmount = (rewards * strategy.performanceFee) / MAX_ALLOCATION;
            uint256 netRewards = rewards - performanceFeeAmount;
            
            // 更新策略信息
            strategy.totalEarned += netRewards;
            strategy.lastHarvest = block.timestamp;
            
            // 分配奖励到池
            distributeRewards(netRewards);
            
            emit Harvest(strategyId, rewards, performanceFeeAmount);
        }
    }
    
    /**
     * @dev 自动复投
     */
    function autoCompound(address token) external {
        Pool storage pool = pools[token];
        require(pool.isActive, "Pool not active");
        
        uint256 balance = pool.token.balanceOf(address(this));
        require(balance >= autoCompoundThreshold, "Below compound threshold");
        
        // 分配到策略
        distributeToStrategies(token, balance);
        
        // 更新池资产
        pool.totalAssets += balance;
        
        emit Compound(token, balance, 0);
    }
    
    /**
     * @dev 领取奖励
     */
    function claimRewards(address token) external nonReentrant {
        Pool storage pool = pools[token];
        UserInfo storage user = userInfo[msg.sender][token];
        
        // 更新池奖励
        updatePool(token);
        
        // 计算待领取奖励
        uint256 pending = (user.shares * pool.accRewardPerShare) / 1e12 - user.rewardDebt;
        uint256 totalRewards = pending + user.pendingRewards;
        
        if (totalRewards > 0) {
            // 重置奖励
            user.pendingRewards = 0;
            user.rewardDebt = (user.shares * pool.accRewardPerShare) / 1e12;
            
            // 转移奖励
            pool.token.safeTransfer(msg.sender, totalRewards);
            
            emit RewardsClaimed(msg.sender, token, totalRewards);
        }
    }
    
    /**
     * @dev 策略重平衡
     */
    function rebalanceStrategies(
        uint256[] memory strategyIds_,
        uint256[] memory newAllocations
    ) external onlyOwner {
        require(strategyIds_.length == newAllocations.length, "Array length mismatch");
        
        uint256 newTotalAllocation = 0;
        
        for (uint256 i = 0; i < strategyIds_.length; i++) {
            uint256 strategyId = strategyIds_[i];
            uint256 newAllocation = newAllocations[i];
            
            require(strategies[strategyId].isActive, "Strategy not active");
            require(newAllocation <= MAX_ALLOCATION, "Allocation too high");
            
            // 更新分配
            totalAllocation = totalAllocation - strategies[strategyId].allocation + newAllocation;
            strategies[strategyId].allocation = newAllocation;
            newTotalAllocation += newAllocation;
        }
        
        require(newTotalAllocation <= MAX_ALLOCATION, "Total allocation exceeded");
        
        emit StrategyRebalanced(strategyIds_, newAllocations);
    }
    
    /**
     * @dev 更新池奖励
     */
    function updatePool(address token) internal {
        Pool storage pool = pools[token];
        
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        
        if (pool.totalShares == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        
        // 计算奖励（简化版本）
        uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
        uint256 rewards = calculatePoolRewards(token, timeElapsed);
        
        if (rewards > 0) {
            pool.accRewardPerShare += (rewards * 1e12) / pool.totalShares;
        }
        
        pool.lastRewardTime = block.timestamp;
    }
    
    /**
     * @dev 计算池奖励
     */
    function calculatePoolRewards(address token, uint256 timeElapsed) internal view returns (uint256) {
        Pool memory pool = pools[token];
        
        // 基于总资产和时间计算奖励
        // 简化版本：假设年化收益率5%
        uint256 annualRate = 500; // 5%
        uint256 secondsPerYear = 365 * 24 * 60 * 60;
        
        return (pool.totalAssets * annualRate * timeElapsed) / (MAX_ALLOCATION * secondsPerYear);
    }
    
    /**
     * @dev 分配到策略
     */
    function distributeToStrategies(address token, uint256 amount) internal {
        for (uint256 i = 0; i < strategyIds.length; i++) {
            uint256 strategyId = strategyIds[i];
            Strategy storage strategy = strategies[strategyId];
            
            if (strategy.isActive && strategy.allocation > 0) {
                uint256 strategyAmount = (amount * strategy.allocation) / totalAllocation;
                
                if (strategyAmount > 0) {
                    // 转移到策略
                    IERC20(token).safeTransfer(strategy.strategyAddress, strategyAmount);
                    
                    // 调用策略存款
                    IStrategy(strategy.strategyAddress).deposit(strategyAmount);
                    
                    strategy.totalDeposited += strategyAmount;
                }
            }
        }
    }
    
    /**
     * @dev 从策略提取
     */
    function withdrawFromStrategies(address token, uint256 amount) internal {
        uint256 remainingAmount = amount;
        
        for (uint256 i = 0; i < strategyIds.length && remainingAmount > 0; i++) {
            uint256 strategyId = strategyIds[i];
            Strategy storage strategy = strategies[strategyId];
            
            if (strategy.isActive && strategy.totalDeposited > 0) {
                uint256 strategyAmount = (remainingAmount * strategy.allocation) / totalAllocation;
                
                if (strategyAmount > strategy.totalDeposited) {
                    strategyAmount = strategy.totalDeposited;
                }
                
                if (strategyAmount > 0) {
                    // 从策略提取
                    IStrategy(strategy.strategyAddress).withdraw(strategyAmount);
                    
                    strategy.totalDeposited -= strategyAmount;
                    remainingAmount -= strategyAmount;
                }
            }
        }
    }
    
    /**
     * @dev 分配奖励
     */
    function distributeRewards(uint256 totalRewards) internal {
        // 简化版本：平均分配到所有池
        uint256 rewardPerPool = totalRewards / supportedTokens.length;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            Pool storage pool = pools[token];
            
            if (pool.isActive && pool.totalShares > 0) {
                pool.accRewardPerShare += (rewardPerPool * 1e12) / pool.totalShares;
            }
        }
    }
    
    /**
     * @dev 获取用户信息
     */
    function getUserInfo(address user, address token) external view returns (
        uint256 shares,
        uint256 pendingRewards,
        uint256 totalDeposited,
        uint256 totalWithdrawn
    ) {
        UserInfo memory userInfo_ = userInfo[user][token];
        Pool memory pool = pools[token];
        
        shares = userInfo_.shares;
        totalDeposited = userInfo_.totalDeposited;
        totalWithdrawn = userInfo_.totalWithdrawn;
        
        // 计算待领取奖励
        uint256 pending = (userInfo_.shares * pool.accRewardPerShare) / 1e12 - userInfo_.rewardDebt;
        pendingRewards = pending + userInfo_.pendingRewards;
    }
    
    /**
     * @dev 获取策略信息
     */
    function getStrategyInfo(uint256 strategyId) external view returns (
        address strategyAddress,
        string memory name,
        uint256 allocation,
        uint256 totalDeposited,
        uint256 totalEarned,
        bool isActive,
        uint256 expectedAPY
    ) {
        Strategy memory strategy = strategies[strategyId];
        return (
            strategy.strategyAddress,
            strategy.name,
            strategy.allocation,
            strategy.totalDeposited,
            strategy.totalEarned,
            strategy.isActive,
            strategy.expectedAPY
        );
    }
    
    /**
     * @dev 获取池信息
     */
    function getPoolInfo(address token) external view returns (
        uint256 totalShares,
        uint256 totalAssets,
        uint256 depositFee,
        uint256 withdrawalFee,
        bool isActive
    ) {
        Pool memory pool = pools[token];
        return (
            pool.totalShares,
            pool.totalAssets,
            pool.depositFee,
            pool.withdrawalFee,
            pool.isActive
        );
    }
    
    /**
     * @dev 设置自动复投阈值
     */
    function setAutoCompoundThreshold(uint256 threshold) external onlyOwner {
        autoCompoundThreshold = threshold;
    }
    
    /**
     * @dev 暂停/恢复策略
     */
    function setStrategyStatus(uint256 strategyId, bool isActive) external onlyOwner {
        strategies[strategyId].isActive = isActive;
    }
    
    /**
     * @dev 暂停/恢复池
     */
    function setPoolStatus(address token, bool isActive) external onlyOwner {
        pools[token].isActive = isActive;
    }
    
    /**
     * @dev 紧急暂停
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复运行
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

/**
 * @title IStrategy
 * @dev 策略接口
 */
interface IStrategy {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function harvest() external returns (uint256);
    function balanceOf() external view returns (uint256);
    function earned() external view returns (uint256);
}