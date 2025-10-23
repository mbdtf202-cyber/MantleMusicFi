// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OracleManager
 * @dev Oracle数据喂价管理合约
 * 
 * 功能特性:
 * - 多Oracle数据源
 * - 数据验证和聚合
 * - 价格喂食
 * - 收益数据更新
 * - 访问控制
 */
contract OracleManager is Ownable, ReentrancyGuard, Pausable {
    
    // Oracle数据结构
    struct OracleData {
        address oracle;             // Oracle地址
        bool isActive;              // 是否激活
        uint256 lastUpdateTime;     // 最后更新时间
        uint256 updateCount;        // 更新次数
        string dataSource;          // 数据源描述
    }
    
    // 价格数据结构
    struct PriceData {
        uint256 price;              // 价格 (18位小数)
        uint256 timestamp;          // 时间戳
        uint256 confidence;         // 置信度 (0-10000, 10000=100%)
        address oracle;             // 提供数据的Oracle
    }
    
    // 收益数据结构
    struct RoyaltyData {
        uint256 tokenId;            // MRT代币ID
        uint256 royaltyAmount;      // 收益金额
        uint256 period;             // 收益周期 (月份)
        uint256 timestamp;          // 时间戳
        address oracle;             // 提供数据的Oracle
        bool isVerified;            // 是否已验证
    }
    
    // Oracle地址到信息的映射
    mapping(address => OracleData) public oracles;
    
    // 资产符号到最新价格的映射
    mapping(string => PriceData) public latestPrices;
    
    // 资产符号到历史价格的映射
    mapping(string => PriceData[]) public priceHistory;
    
    // 代币ID到收益数据的映射
    mapping(uint256 => RoyaltyData[]) public royaltyHistory;
    
    // 代币ID到最新收益的映射
    mapping(uint256 => RoyaltyData) public latestRoyalties;
    
    // Oracle地址列表
    address[] public oracleList;
    
    // 最小置信度阈值
    uint256 public constant MIN_CONFIDENCE = 7000; // 70%
    
    // 价格偏差阈值 (基点)
    uint256 public priceDeviationThreshold = 500; // 5%
    
    // 数据过期时间
    uint256 public dataExpiryTime = 1 hours;
    
    // Treasury合约地址
    address public treasuryContract;
    
    // 事件定义
    event OracleAdded(address indexed oracle, string dataSource);
    event OracleRemoved(address indexed oracle);
    event OracleActivated(address indexed oracle);
    event OracleDeactivated(address indexed oracle);
    
    event PriceUpdated(
        string indexed symbol,
        uint256 price,
        uint256 confidence,
        address indexed oracle,
        uint256 timestamp
    );
    
    event RoyaltyUpdated(
        uint256 indexed tokenId,
        uint256 royaltyAmount,
        uint256 period,
        address indexed oracle,
        uint256 timestamp
    );
    
    event RoyaltyVerified(uint256 indexed tokenId, uint256 period);
    
    modifier onlyOracle() {
        require(oracles[msg.sender].isActive, "OracleManager: caller is not an active oracle");
        _;
    }
    
    constructor(address initialOwner) Ownable(initialOwner) {
        // 初始化时添加合约部署者作为第一个Oracle
        _addOracle(initialOwner, "Default Oracle");
    }
    
    /**
     * @dev 添加Oracle
     */
    function addOracle(address oracle, string memory dataSource) external onlyOwner {
        _addOracle(oracle, dataSource);
    }
    
    function _addOracle(address oracle, string memory dataSource) internal {
        require(oracle != address(0), "OracleManager: oracle cannot be zero address");
        require(!oracles[oracle].isActive, "OracleManager: oracle already exists");
        
        oracles[oracle] = OracleData({
            oracle: oracle,
            isActive: true,
            lastUpdateTime: block.timestamp,
            updateCount: 0,
            dataSource: dataSource
        });
        
        oracleList.push(oracle);
        
        emit OracleAdded(oracle, dataSource);
    }
    
    /**
     * @dev 移除Oracle
     */
    function removeOracle(address oracle) external onlyOwner {
        require(oracles[oracle].isActive, "OracleManager: oracle does not exist");
        
        oracles[oracle].isActive = false;
        
        // 从列表中移除
        for (uint256 i = 0; i < oracleList.length; i++) {
            if (oracleList[i] == oracle) {
                oracleList[i] = oracleList[oracleList.length - 1];
                oracleList.pop();
                break;
            }
        }
        
        emit OracleRemoved(oracle);
    }
    
    /**
     * @dev 激活/停用Oracle
     */
    function setOracleActive(address oracle, bool active) external onlyOwner {
        require(oracles[oracle].oracle != address(0), "OracleManager: oracle does not exist");
        
        oracles[oracle].isActive = active;
        
        if (active) {
            emit OracleActivated(oracle);
        } else {
            emit OracleDeactivated(oracle);
        }
    }
    
    /**
     * @dev 更新价格数据
     */
    function updatePrice(
        string memory symbol,
        uint256 price,
        uint256 confidence
    ) public onlyOracle whenNotPaused {
        require(bytes(symbol).length > 0, "OracleManager: symbol cannot be empty");
        require(price > 0, "OracleManager: price must be greater than 0");
        require(confidence >= MIN_CONFIDENCE && confidence <= 10000, "OracleManager: invalid confidence");
        
        PriceData memory newPrice = PriceData({
            price: price,
            timestamp: block.timestamp,
            confidence: confidence,
            oracle: msg.sender
        });
        
        // 验证价格偏差
        if (latestPrices[symbol].timestamp > 0) {
            uint256 deviation = _calculateDeviation(latestPrices[symbol].price, price);
            require(deviation <= priceDeviationThreshold, "OracleManager: price deviation too high");
        }
        
        // 更新最新价格
        latestPrices[symbol] = newPrice;
        
        // 添加到历史记录
        priceHistory[symbol].push(newPrice);
        
        // 限制历史记录长度
        if (priceHistory[symbol].length > 1000) {
            // 移除最旧的记录
            for (uint256 i = 0; i < priceHistory[symbol].length - 1; i++) {
                priceHistory[symbol][i] = priceHistory[symbol][i + 1];
            }
            priceHistory[symbol].pop();
        }
        
        // 更新Oracle统计
        oracles[msg.sender].lastUpdateTime = block.timestamp;
        oracles[msg.sender].updateCount++;
        
        emit PriceUpdated(symbol, price, confidence, msg.sender, block.timestamp);
    }
    
    /**
     * @dev 更新收益数据
     */
    function updateRoyalty(
        uint256 tokenId,
        uint256 royaltyAmount,
        uint256 period
    ) external onlyOracle whenNotPaused {
        require(tokenId > 0, "OracleManager: invalid token ID");
        require(royaltyAmount > 0, "OracleManager: royalty amount must be greater than 0");
        require(period > 0, "OracleManager: period must be greater than 0");
        
        RoyaltyData memory newRoyalty = RoyaltyData({
            tokenId: tokenId,
            royaltyAmount: royaltyAmount,
            period: period,
            timestamp: block.timestamp,
            oracle: msg.sender,
            isVerified: false
        });
        
        // 更新最新收益
        latestRoyalties[tokenId] = newRoyalty;
        
        // 添加到历史记录
        royaltyHistory[tokenId].push(newRoyalty);
        
        // 更新Oracle统计
        oracles[msg.sender].lastUpdateTime = block.timestamp;
        oracles[msg.sender].updateCount++;
        
        emit RoyaltyUpdated(tokenId, royaltyAmount, period, msg.sender, block.timestamp);
    }
    
    /**
     * @dev 验证收益数据
     */
    function verifyRoyalty(uint256 tokenId, uint256 period) external onlyOwner {
        require(latestRoyalties[tokenId].period == period, "OracleManager: period mismatch");
        require(!latestRoyalties[tokenId].isVerified, "OracleManager: already verified");
        
        latestRoyalties[tokenId].isVerified = true;
        
        // 更新历史记录中的验证状态
        for (uint256 i = royaltyHistory[tokenId].length; i > 0; i--) {
            if (royaltyHistory[tokenId][i-1].period == period) {
                royaltyHistory[tokenId][i-1].isVerified = true;
                break;
            }
        }
        
        emit RoyaltyVerified(tokenId, period);
        
        // 如果设置了Treasury合约，触发收益分配
        if (treasuryContract != address(0)) {
            _triggerRoyaltyDistribution(tokenId, latestRoyalties[tokenId].royaltyAmount);
        }
    }
    
    /**
     * @dev 批量更新价格
     */
    function batchUpdatePrices(
        string[] memory symbols,
        uint256[] memory prices,
        uint256[] memory confidences
    ) external onlyOracle whenNotPaused {
        require(symbols.length == prices.length, "OracleManager: arrays length mismatch");
        require(symbols.length == confidences.length, "OracleManager: arrays length mismatch");
        require(symbols.length <= 50, "OracleManager: too many updates");
        
        for (uint256 i = 0; i < symbols.length; i++) {
            updatePrice(symbols[i], prices[i], confidences[i]);
        }
    }
    
    /**
     * @dev 获取最新价格
     */
    function getLatestPrice(string memory symbol) external view returns (PriceData memory) {
        require(latestPrices[symbol].timestamp > 0, "OracleManager: price not available");
        require(block.timestamp - latestPrices[symbol].timestamp <= dataExpiryTime, "OracleManager: price data expired");
        
        return latestPrices[symbol];
    }
    
    /**
     * @dev 获取历史价格
     */
    function getPriceHistory(string memory symbol, uint256 limit) external view returns (PriceData[] memory) {
        uint256 length = priceHistory[symbol].length;
        if (limit > length) {
            limit = length;
        }
        
        PriceData[] memory result = new PriceData[](limit);
        for (uint256 i = 0; i < limit; i++) {
            result[i] = priceHistory[symbol][length - limit + i];
        }
        
        return result;
    }
    
    /**
     * @dev 获取最新收益
     */
    function getLatestRoyalty(uint256 tokenId) external view returns (RoyaltyData memory) {
        require(latestRoyalties[tokenId].timestamp > 0, "OracleManager: royalty not available");
        
        return latestRoyalties[tokenId];
    }
    
    /**
     * @dev 获取收益历史
     */
    function getRoyaltyHistory(uint256 tokenId, uint256 limit) external view returns (RoyaltyData[] memory) {
        uint256 length = royaltyHistory[tokenId].length;
        if (limit > length) {
            limit = length;
        }
        
        RoyaltyData[] memory result = new RoyaltyData[](limit);
        for (uint256 i = 0; i < limit; i++) {
            result[i] = royaltyHistory[tokenId][length - limit + i];
        }
        
        return result;
    }
    
    /**
     * @dev 获取活跃Oracle列表
     */
    function getActiveOracles() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < oracleList.length; i++) {
            if (oracles[oracleList[i]].isActive) {
                activeCount++;
            }
        }
        
        address[] memory activeOracles = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < oracleList.length; i++) {
            if (oracles[oracleList[i]].isActive) {
                activeOracles[index] = oracleList[i];
                index++;
            }
        }
        
        return activeOracles;
    }
    
    /**
     * @dev 设置Treasury合约地址
     */
    function setTreasuryContract(address _treasuryContract) external onlyOwner {
        treasuryContract = _treasuryContract;
    }
    
    /**
     * @dev 设置价格偏差阈值
     */
    function setPriceDeviationThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 5000, "OracleManager: threshold too high"); // 最大50%
        priceDeviationThreshold = threshold;
    }
    
    /**
     * @dev 设置数据过期时间
     */
    function setDataExpiryTime(uint256 expiryTime) external onlyOwner {
        require(expiryTime >= 5 minutes && expiryTime <= 24 hours, "OracleManager: invalid expiry time");
        dataExpiryTime = expiryTime;
    }
    
    /**
     * @dev 计算价格偏差
     */
    function _calculateDeviation(uint256 oldPrice, uint256 newPrice) internal pure returns (uint256) {
        if (oldPrice == 0) return 0;
        
        uint256 diff = oldPrice > newPrice ? oldPrice - newPrice : newPrice - oldPrice;
        return (diff * 10000) / oldPrice;
    }
    
    /**
     * @dev 触发收益分配
     */
    function _triggerRoyaltyDistribution(uint256 tokenId, uint256 amount) internal {
        // 这里可以调用Treasury合约的分配函数
        // 为了简化，这里只是一个占位符
        // 实际实现中需要根据具体的Treasury接口来调用
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
}