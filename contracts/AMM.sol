// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AMM
 * @dev 自动做市商合约 - 为MRT代币提供流动性
 * 
 * 功能特性:
 * - 恒定乘积公式 (x * y = k)
 * - 流动性提供和移除
 * - 代币交换
 * - 手续费收取
 * - 价格预言机
 */
contract AMM is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // 流动性池信息
    struct Pool {
        address tokenA;             // 代币A地址
        address tokenB;             // 代币B地址
        uint256 reserveA;           // 代币A储备量
        uint256 reserveB;           // 代币B储备量
        uint256 totalLiquidity;     // 总流动性代币
        uint256 feeRate;            // 手续费率 (基点，300 = 0.3%)
        bool isActive;              // 是否激活
        uint256 createdAt;          // 创建时间
    }
    
    // 流动性提供者信息
    struct LiquidityProvider {
        uint256 liquidity;          // 流动性代币数量
        uint256 lastAddTime;        // 最后添加时间
        uint256 totalFeesEarned;    // 累计手续费收益
    }
    
    // 池ID到池信息的映射
    mapping(bytes32 => Pool) public pools;
    
    // 池ID到用户到流动性提供者信息的映射
    mapping(bytes32 => mapping(address => LiquidityProvider)) public liquidityProviders;
    
    // 所有池ID列表
    bytes32[] public poolIds;
    
    // 最小流动性
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    
    // 默认手续费率 (0.3%)
    uint256 public constant DEFAULT_FEE_RATE = 300;
    
    // 最大手续费率 (1%)
    uint256 public constant MAX_FEE_RATE = 1000;
    
    // 事件定义
    event PoolCreated(
        bytes32 indexed poolId,
        address indexed tokenA,
        address indexed tokenB,
        uint256 feeRate
    );
    
    event LiquidityAdded(
        bytes32 indexed poolId,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        bytes32 indexed poolId,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event Swap(
        bytes32 indexed poolId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    
    event FeesCollected(
        bytes32 indexed poolId,
        address indexed provider,
        uint256 amount
    );
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev 创建新的流动性池
     */
    function createPool(
        address tokenA,
        address tokenB,
        uint256 feeRate
    ) external onlyOwner returns (bytes32 poolId) {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token addresses");
        require(tokenA != tokenB, "Identical tokens");
        require(feeRate <= MAX_FEE_RATE, "Fee rate too high");
        
        // 确保代币顺序一致
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }
        
        poolId = keccak256(abi.encodePacked(tokenA, tokenB));
        require(!pools[poolId].isActive, "Pool already exists");
        
        pools[poolId] = Pool({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: 0,
            reserveB: 0,
            totalLiquidity: 0,
            feeRate: feeRate == 0 ? DEFAULT_FEE_RATE : feeRate,
            isActive: true,
            createdAt: block.timestamp
        });
        
        poolIds.push(poolId);
        
        emit PoolCreated(poolId, tokenA, tokenB, feeRate);
    }
    
    /**
     * @dev 添加流动性
     */
    function addLiquidity(
        bytes32 poolId,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant whenNotPaused returns (uint256 liquidity) {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        
        uint256 amountA;
        uint256 amountB;
        
        if (pool.reserveA == 0 && pool.reserveB == 0) {
            // 首次添加流动性
            amountA = amountADesired;
            amountB = amountBDesired;
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            pool.totalLiquidity = liquidity + MINIMUM_LIQUIDITY;
        } else {
            // 按比例添加流动性
            uint256 amountBOptimal = (amountADesired * pool.reserveB) / pool.reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = (amountBDesired * pool.reserveA) / pool.reserveB;
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "Insufficient A amount");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
            
            liquidity = min(
                (amountA * pool.totalLiquidity) / pool.reserveA,
                (amountB * pool.totalLiquidity) / pool.reserveB
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        // 转移代币
        IERC20(pool.tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(pool.tokenB).safeTransferFrom(msg.sender, address(this), amountB);
        
        // 更新储备量和流动性
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLiquidity += liquidity;
        
        // 更新流动性提供者信息
        LiquidityProvider storage provider = liquidityProviders[poolId][msg.sender];
        provider.liquidity += liquidity;
        provider.lastAddTime = block.timestamp;
        
        emit LiquidityAdded(poolId, msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev 移除流动性
     */
    function removeLiquidity(
        bytes32 poolId,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        
        LiquidityProvider storage provider = liquidityProviders[poolId][msg.sender];
        require(provider.liquidity >= liquidity, "Insufficient liquidity");
        
        // 计算可提取的代币数量
        amountA = (liquidity * pool.reserveA) / pool.totalLiquidity;
        amountB = (liquidity * pool.reserveB) / pool.totalLiquidity;
        
        require(amountA >= amountAMin && amountB >= amountBMin, "Insufficient output amount");
        
        // 更新状态
        provider.liquidity -= liquidity;
        pool.totalLiquidity -= liquidity;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        
        // 转移代币
        IERC20(pool.tokenA).safeTransfer(msg.sender, amountA);
        IERC20(pool.tokenB).safeTransfer(msg.sender, amountB);
        
        emit LiquidityRemoved(poolId, msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev 代币交换
     */
    function swap(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        require(tokenIn == pool.tokenA || tokenIn == pool.tokenB, "Invalid token");
        require(amountIn > 0, "Invalid input amount");
        
        bool isTokenA = tokenIn == pool.tokenA;
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
        
        // 计算输出数量（扣除手续费）
        uint256 amountInWithFee = amountIn * (10000 - pool.feeRate);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 10000 + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut >= amountOutMin, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");
        
        // 转移代币
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        address tokenOut = isTokenA ? pool.tokenB : pool.tokenA;
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        
        // 更新储备量
        if (isTokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        
        uint256 fee = amountIn * pool.feeRate / 10000;
        
        emit Swap(poolId, msg.sender, tokenIn, tokenOut, amountIn, amountOut, fee);
    }
    
    /**
     * @dev 获取交换输出数量
     */
    function getAmountOut(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        Pool memory pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        require(tokenIn == pool.tokenA || tokenIn == pool.tokenB, "Invalid token");
        
        bool isTokenA = tokenIn == pool.tokenA;
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
        
        if (reserveIn == 0 || reserveOut == 0) {
            return 0;
        }
        
        uint256 amountInWithFee = amountIn * (10000 - pool.feeRate);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 10000 + amountInWithFee;
        amountOut = numerator / denominator;
    }
    
    /**
     * @dev 获取池信息
     */
    function getPoolInfo(bytes32 poolId) external view returns (
        address tokenA,
        address tokenB,
        uint256 reserveA,
        uint256 reserveB,
        uint256 totalLiquidity,
        uint256 feeRate
    ) {
        Pool memory pool = pools[poolId];
        return (
            pool.tokenA,
            pool.tokenB,
            pool.reserveA,
            pool.reserveB,
            pool.totalLiquidity,
            pool.feeRate
        );
    }
    
    /**
     * @dev 获取所有池ID
     */
    function getAllPoolIds() external view returns (bytes32[] memory) {
        return poolIds;
    }
    
    /**
     * @dev 暂停/恢复池
     */
    function setPoolStatus(bytes32 poolId, bool isActive) external onlyOwner {
        pools[poolId].isActive = isActive;
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
    
    // 辅助函数
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}