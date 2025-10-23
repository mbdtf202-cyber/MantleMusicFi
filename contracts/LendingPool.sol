// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LendingPool
 * @dev 借贷池合约 - 为音乐版权代币提供借贷服务
 * 
 * 功能特性:
 * - 存款和取款
 * - 借款和还款
 * - 利率计算
 * - 清算机制
 * - 健康因子监控
 */
contract LendingPool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // 资产信息
    struct Asset {
        address token;              // 代币地址
        uint256 totalDeposits;      // 总存款
        uint256 totalBorrows;       // 总借款
        uint256 baseRate;           // 基础利率
        uint256 multiplier;         // 利率乘数
        uint256 jumpMultiplier;     // 跳跃乘数
        uint256 kink;               // 拐点利用率
        uint256 reserveFactor;      // 储备金因子
        uint256 collateralFactor;   // 抵押因子
        uint256 liquidationThreshold; // 清算阈值
        uint256 liquidationBonus;   // 清算奖励
        bool isActive;              // 是否激活
        uint256 lastUpdateTime;     // 最后更新时间
        uint256 borrowIndex;        // 借款指数
        uint256 supplyIndex;        // 存款指数
    }
    
    // 用户账户信息
    struct UserAccount {
        mapping(address => uint256) deposits;    // 存款余额
        mapping(address => uint256) borrows;     // 借款余额
        mapping(address => uint256) lastBorrowIndex; // 最后借款指数
        mapping(address => uint256) lastSupplyIndex; // 最后存款指数
    }
    
    // 资产映射
    mapping(address => Asset) public assets;
    
    // 用户账户映射
    mapping(address => UserAccount) private userAccounts;
    
    // 支持的资产列表
    address[] public supportedAssets;
    
    // 常量
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public constant BASE_UNIT = 1e18;
    uint256 public constant MAX_COLLATERAL_FACTOR = 0.9e18; // 90%
    uint256 public constant MIN_HEALTH_FACTOR = 1e18; // 1.0
    
    // 事件定义
    event AssetAdded(
        address indexed token,
        uint256 baseRate,
        uint256 multiplier,
        uint256 collateralFactor
    );
    
    event Deposit(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 newBalance
    );
    
    event Withdraw(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 newBalance
    );
    
    event Borrow(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 newBalance
    );
    
    event Repay(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 newBalance
    );
    
    event Liquidation(
        address indexed liquidator,
        address indexed borrower,
        address indexed collateralToken,
        address debtToken,
        uint256 debtAmount,
        uint256 collateralAmount
    );
    
    event InterestAccrued(
        address indexed token,
        uint256 borrowIndex,
        uint256 supplyIndex,
        uint256 totalBorrows,
        uint256 totalReserves
    );
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev 添加支持的资产
     */
    function addAsset(
        address token,
        uint256 baseRate,
        uint256 multiplier,
        uint256 jumpMultiplier,
        uint256 kink,
        uint256 reserveFactor,
        uint256 collateralFactor,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!assets[token].isActive, "Asset already exists");
        require(collateralFactor <= MAX_COLLATERAL_FACTOR, "Collateral factor too high");
        
        assets[token] = Asset({
            token: token,
            totalDeposits: 0,
            totalBorrows: 0,
            baseRate: baseRate,
            multiplier: multiplier,
            jumpMultiplier: jumpMultiplier,
            kink: kink,
            reserveFactor: reserveFactor,
            collateralFactor: collateralFactor,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus,
            isActive: true,
            lastUpdateTime: block.timestamp,
            borrowIndex: BASE_UNIT,
            supplyIndex: BASE_UNIT
        });
        
        supportedAssets.push(token);
        
        emit AssetAdded(token, baseRate, multiplier, collateralFactor);
    }
    
    /**
     * @dev 存款
     */
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(assets[token].isActive, "Asset not supported");
        require(amount > 0, "Invalid amount");
        
        // 更新利息
        accrueInterest(token);
        
        Asset storage asset = assets[token];
        UserAccount storage account = userAccounts[msg.sender];
        
        // 计算新的存款余额
        uint256 currentBalance = getCurrentSupplyBalance(msg.sender, token);
        uint256 newBalance = currentBalance + amount;
        
        // 更新状态
        account.deposits[token] = newBalance;
        account.lastSupplyIndex[token] = asset.supplyIndex;
        asset.totalDeposits += amount;
        
        // 转移代币
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        emit Deposit(msg.sender, token, amount, newBalance);
    }
    
    /**
     * @dev 取款
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        require(assets[token].isActive, "Asset not supported");
        require(amount > 0, "Invalid amount");
        
        // 更新利息
        accrueInterest(token);
        
        Asset storage asset = assets[token];
        UserAccount storage account = userAccounts[msg.sender];
        
        uint256 currentBalance = getCurrentSupplyBalance(msg.sender, token);
        require(currentBalance >= amount, "Insufficient balance");
        
        uint256 newBalance = currentBalance - amount;
        
        // 检查健康因子
        require(checkHealthFactor(msg.sender, token, 0, amount), "Health factor too low");
        
        // 更新状态
        account.deposits[token] = newBalance;
        account.lastSupplyIndex[token] = asset.supplyIndex;
        asset.totalDeposits -= amount;
        
        // 转移代币
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, token, amount, newBalance);
    }
    
    /**
     * @dev 借款
     */
    function borrow(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(assets[token].isActive, "Asset not supported");
        require(amount > 0, "Invalid amount");
        
        // 更新利息
        accrueInterest(token);
        
        Asset storage asset = assets[token];
        UserAccount storage account = userAccounts[msg.sender];
        
        uint256 currentBalance = getCurrentBorrowBalance(msg.sender, token);
        uint256 newBalance = currentBalance + amount;
        
        // 检查健康因子
        require(checkHealthFactor(msg.sender, token, amount, 0), "Health factor too low");
        
        // 检查流动性
        require(asset.totalDeposits >= asset.totalBorrows + amount, "Insufficient liquidity");
        
        // 更新状态
        account.borrows[token] = newBalance;
        account.lastBorrowIndex[token] = asset.borrowIndex;
        asset.totalBorrows += amount;
        
        // 转移代币
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Borrow(msg.sender, token, amount, newBalance);
    }
    
    /**
     * @dev 还款
     */
    function repay(address token, uint256 amount) external nonReentrant {
        require(assets[token].isActive, "Asset not supported");
        require(amount > 0, "Invalid amount");
        
        // 更新利息
        accrueInterest(token);
        
        Asset storage asset = assets[token];
        UserAccount storage account = userAccounts[msg.sender];
        
        uint256 currentBalance = getCurrentBorrowBalance(msg.sender, token);
        require(currentBalance > 0, "No debt to repay");
        
        // 限制还款金额不超过债务
        if (amount > currentBalance) {
            amount = currentBalance;
        }
        
        uint256 newBalance = currentBalance - amount;
        
        // 更新状态
        account.borrows[token] = newBalance;
        account.lastBorrowIndex[token] = asset.borrowIndex;
        asset.totalBorrows -= amount;
        
        // 转移代币
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        emit Repay(msg.sender, token, amount, newBalance);
    }
    
    /**
     * @dev 清算
     */
    function liquidate(
        address borrower,
        address debtToken,
        uint256 debtAmount,
        address collateralToken
    ) external nonReentrant {
        require(assets[debtToken].isActive && assets[collateralToken].isActive, "Asset not supported");
        require(debtAmount > 0, "Invalid amount");
        
        // 更新利息
        accrueInterest(debtToken);
        accrueInterest(collateralToken);
        
        // 检查是否可以清算
        uint256 healthFactor = calculateHealthFactor(borrower);
        require(healthFactor < MIN_HEALTH_FACTOR, "Health factor above threshold");
        
        // 计算清算金额
        uint256 maxDebtAmount = getCurrentBorrowBalance(borrower, debtToken) / 2; // 最多清算50%
        if (debtAmount > maxDebtAmount) {
            debtAmount = maxDebtAmount;
        }
        
        // 计算抵押品数量
        uint256 collateralAmount = calculateCollateralAmount(debtToken, debtAmount, collateralToken);
        
        // 检查抵押品余额
        uint256 collateralBalance = getCurrentSupplyBalance(borrower, collateralToken);
        require(collateralBalance >= collateralAmount, "Insufficient collateral");
        
        // 更新借款人状态
        UserAccount storage borrowerAccount = userAccounts[borrower];
        uint256 newDebtBalance = getCurrentBorrowBalance(borrower, debtToken) - debtAmount;
        uint256 newCollateralBalance = collateralBalance - collateralAmount;
        
        borrowerAccount.borrows[debtToken] = newDebtBalance;
        borrowerAccount.deposits[collateralToken] = newCollateralBalance;
        borrowerAccount.lastBorrowIndex[debtToken] = assets[debtToken].borrowIndex;
        borrowerAccount.lastSupplyIndex[collateralToken] = assets[collateralToken].supplyIndex;
        
        // 更新资产状态
        assets[debtToken].totalBorrows -= debtAmount;
        assets[collateralToken].totalDeposits -= collateralAmount;
        
        // 转移代币
        IERC20(debtToken).safeTransferFrom(msg.sender, address(this), debtAmount);
        IERC20(collateralToken).safeTransfer(msg.sender, collateralAmount);
        
        emit Liquidation(msg.sender, borrower, collateralToken, debtToken, debtAmount, collateralAmount);
    }
    
    /**
     * @dev 计算利息
     */
    function accrueInterest(address token) public {
        Asset storage asset = assets[token];
        require(asset.isActive, "Asset not supported");
        
        uint256 currentTime = block.timestamp;
        uint256 timeDelta = currentTime - asset.lastUpdateTime;
        
        if (timeDelta == 0) {
            return;
        }
        
        uint256 borrowRate = getBorrowRate(token);
        uint256 supplyRate = getSupplyRate(token);
        
        // 计算新的指数
        uint256 borrowIndexNew = asset.borrowIndex + (asset.borrowIndex * borrowRate * timeDelta) / SECONDS_PER_YEAR / BASE_UNIT;
        uint256 supplyIndexNew = asset.supplyIndex + (asset.supplyIndex * supplyRate * timeDelta) / SECONDS_PER_YEAR / BASE_UNIT;
        
        // 更新状态
        asset.borrowIndex = borrowIndexNew;
        asset.supplyIndex = supplyIndexNew;
        asset.lastUpdateTime = currentTime;
        
        emit InterestAccrued(token, borrowIndexNew, supplyIndexNew, asset.totalBorrows, 0);
    }
    
    /**
     * @dev 获取借款利率
     */
    function getBorrowRate(address token) public view returns (uint256) {
        Asset memory asset = assets[token];
        
        if (asset.totalDeposits == 0) {
            return asset.baseRate;
        }
        
        uint256 utilizationRate = (asset.totalBorrows * BASE_UNIT) / asset.totalDeposits;
        
        if (utilizationRate <= asset.kink) {
            return asset.baseRate + (utilizationRate * asset.multiplier) / BASE_UNIT;
        } else {
            uint256 normalRate = asset.baseRate + (asset.kink * asset.multiplier) / BASE_UNIT;
            uint256 excessUtil = utilizationRate - asset.kink;
            return normalRate + (excessUtil * asset.jumpMultiplier) / BASE_UNIT;
        }
    }
    
    /**
     * @dev 获取存款利率
     */
    function getSupplyRate(address token) public view returns (uint256) {
        Asset memory asset = assets[token];
        
        if (asset.totalDeposits == 0) {
            return 0;
        }
        
        uint256 borrowRate = getBorrowRate(token);
        uint256 utilizationRate = (asset.totalBorrows * BASE_UNIT) / asset.totalDeposits;
        uint256 rateToPool = borrowRate * (BASE_UNIT - asset.reserveFactor) / BASE_UNIT;
        
        return (utilizationRate * rateToPool) / BASE_UNIT;
    }
    
    /**
     * @dev 获取当前存款余额
     */
    function getCurrentSupplyBalance(address user, address token) public view returns (uint256) {
        UserAccount storage account = userAccounts[user];
        Asset memory asset = assets[token];
        
        if (account.lastSupplyIndex[token] == 0) {
            return 0;
        }
        
        return (account.deposits[token] * asset.supplyIndex) / account.lastSupplyIndex[token];
    }
    
    /**
     * @dev 获取当前借款余额
     */
    function getCurrentBorrowBalance(address user, address token) public view returns (uint256) {
        UserAccount storage account = userAccounts[user];
        Asset memory asset = assets[token];
        
        if (account.lastBorrowIndex[token] == 0) {
            return 0;
        }
        
        return (account.borrows[token] * asset.borrowIndex) / account.lastBorrowIndex[token];
    }
    
    /**
     * @dev 计算健康因子
     */
    function calculateHealthFactor(address user) public view returns (uint256) {
        uint256 totalCollateralValue = 0;
        uint256 totalBorrowValue = 0;
        
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address token = supportedAssets[i];
            Asset memory asset = assets[token];
            
            // 计算抵押品价值
            uint256 supplyBalance = getCurrentSupplyBalance(user, token);
            if (supplyBalance > 0) {
                uint256 collateralValue = (supplyBalance * asset.collateralFactor) / BASE_UNIT;
                totalCollateralValue += collateralValue;
            }
            
            // 计算借款价值
            uint256 borrowBalance = getCurrentBorrowBalance(user, token);
            if (borrowBalance > 0) {
                totalBorrowValue += borrowBalance;
            }
        }
        
        if (totalBorrowValue == 0) {
            return type(uint256).max;
        }
        
        return (totalCollateralValue * BASE_UNIT) / totalBorrowValue;
    }
    
    /**
     * @dev 检查健康因子
     */
    function checkHealthFactor(
        address user,
        address token,
        uint256 borrowAmount,
        uint256 withdrawAmount
    ) internal view returns (bool) {
        uint256 totalCollateralValue = 0;
        uint256 totalBorrowValue = 0;
        
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address assetToken = supportedAssets[i];
            Asset memory asset = assets[assetToken];
            
            // 计算抵押品价值
            uint256 supplyBalance = getCurrentSupplyBalance(user, assetToken);
            if (assetToken == token && withdrawAmount > 0) {
                supplyBalance = supplyBalance > withdrawAmount ? supplyBalance - withdrawAmount : 0;
            }
            
            if (supplyBalance > 0) {
                uint256 collateralValue = (supplyBalance * asset.collateralFactor) / BASE_UNIT;
                totalCollateralValue += collateralValue;
            }
            
            // 计算借款价值
            uint256 borrowBalance = getCurrentBorrowBalance(user, assetToken);
            if (assetToken == token && borrowAmount > 0) {
                borrowBalance += borrowAmount;
            }
            
            if (borrowBalance > 0) {
                totalBorrowValue += borrowBalance;
            }
        }
        
        if (totalBorrowValue == 0) {
            return true;
        }
        
        uint256 healthFactor = (totalCollateralValue * BASE_UNIT) / totalBorrowValue;
        return healthFactor >= MIN_HEALTH_FACTOR;
    }
    
    /**
     * @dev 计算清算抵押品数量
     */
    function calculateCollateralAmount(
        address debtToken,
        uint256 debtAmount,
        address collateralToken
    ) internal view returns (uint256) {
        // 简化版本：假设1:1价格比率
        // 实际应用中需要接入价格预言机
        uint256 liquidationBonus = assets[collateralToken].liquidationBonus;
        return debtAmount + (debtAmount * liquidationBonus) / BASE_UNIT;
    }
    
    /**
     * @dev 获取用户账户信息
     */
    function getUserAccountInfo(address user) external view returns (
        uint256 totalCollateralValue,
        uint256 totalBorrowValue,
        uint256 healthFactor
    ) {
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address token = supportedAssets[i];
            Asset memory asset = assets[token];
            
            uint256 supplyBalance = getCurrentSupplyBalance(user, token);
            if (supplyBalance > 0) {
                uint256 collateralValue = (supplyBalance * asset.collateralFactor) / BASE_UNIT;
                totalCollateralValue += collateralValue;
            }
            
            uint256 borrowBalance = getCurrentBorrowBalance(user, token);
            if (borrowBalance > 0) {
                totalBorrowValue += borrowBalance;
            }
        }
        
        healthFactor = calculateHealthFactor(user);
    }
    
    /**
     * @dev 获取支持的资产列表
     */
    function getSupportedAssets() external view returns (address[] memory) {
        return supportedAssets;
    }
    
    /**
     * @dev 暂停/恢复资产
     */
    function setAssetStatus(address token, bool isActive) external onlyOwner {
        assets[token].isActive = isActive;
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