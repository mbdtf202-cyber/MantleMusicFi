// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title PriceOracle
 * @dev 价格预言机合约，提供音乐资产和代币的实时价格数据
 */
contract PriceOracle is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // 价格数据结构
    struct PriceData {
        uint256 price;          // 价格（以wei为单位）
        uint256 timestamp;      // 更新时间戳
        uint256 confidence;     // 置信度（0-100）
        address updater;        // 更新者地址
        bool isActive;          // 是否活跃
    }

    // 聚合价格数据
    struct AggregatedPrice {
        uint256 price;          // 聚合价格
        uint256 timestamp;      // 最后更新时间
        uint256 deviation;      // 价格偏差
        uint256 sourceCount;    // 数据源数量
    }

    // 价格历史记录
    struct PriceHistory {
        uint256 price;
        uint256 timestamp;
        uint256 volume;         // 交易量
    }

    // 数据源信息
    struct DataSource {
        string name;            // 数据源名称
        address oracle;         // 预言机地址
        uint256 weight;         // 权重（0-100）
        bool isActive;          // 是否活跃
        uint256 lastUpdate;     // 最后更新时间
        uint256 reliability;    // 可靠性评分
    }

    // 状态变量
    mapping(string => mapping(address => PriceData)) public priceFeeds;  // symbol => oracle => price
    mapping(string => AggregatedPrice) public aggregatedPrices;          // symbol => aggregated price
    mapping(string => PriceHistory[]) public priceHistory;               // symbol => history
    mapping(address => DataSource) public dataSources;                   // oracle => source info
    mapping(string => address[]) public symbolOracles;                   // symbol => oracle addresses
    
    address[] public authorizedOracles;                                  // 授权的预言机列表
    mapping(address => bool) public isAuthorizedOracle;                  // 预言机授权状态
    
    uint256 public constant PRICE_DECIMALS = 18;                        // 价格精度
    uint256 public constant MAX_PRICE_AGE = 3600;                       // 最大价格年龄（秒）
    uint256 public constant MIN_SOURCES = 3;                            // 最小数据源数量
    uint256 public constant MAX_DEVIATION = 1000;                       // 最大偏差（基点）

    // 事件
    event PriceUpdated(
        string indexed symbol,
        address indexed oracle,
        uint256 price,
        uint256 timestamp,
        uint256 confidence
    );
    
    event AggregatedPriceUpdated(
        string indexed symbol,
        uint256 price,
        uint256 timestamp,
        uint256 deviation,
        uint256 sourceCount
    );
    
    event OracleAuthorized(address indexed oracle, string name);
    event OracleRevoked(address indexed oracle);
    event DataSourceUpdated(address indexed oracle, uint256 weight, bool isActive);

    // 修饰符
    modifier onlyAuthorizedOracle() {
        require(isAuthorizedOracle[msg.sender], "Not authorized oracle");
        _;
    }

    modifier validSymbol(string memory symbol) {
        require(bytes(symbol).length > 0, "Invalid symbol");
        _;
    }

    constructor() {}

    /**
     * @dev 授权预言机
     */
    function authorizeOracle(
        address oracle,
        string memory name,
        uint256 weight
    ) external onlyOwner {
        require(oracle != address(0), "Invalid oracle address");
        require(!isAuthorizedOracle[oracle], "Oracle already authorized");
        require(weight <= 100, "Invalid weight");

        isAuthorizedOracle[oracle] = true;
        authorizedOracles.push(oracle);
        
        dataSources[oracle] = DataSource({
            name: name,
            oracle: oracle,
            weight: weight,
            isActive: true,
            lastUpdate: 0,
            reliability: 100
        });

        emit OracleAuthorized(oracle, name);
    }

    /**
     * @dev 撤销预言机授权
     */
    function revokeOracle(address oracle) external onlyOwner {
        require(isAuthorizedOracle[oracle], "Oracle not authorized");
        
        isAuthorizedOracle[oracle] = false;
        dataSources[oracle].isActive = false;
        
        // 从授权列表中移除
        for (uint256 i = 0; i < authorizedOracles.length; i++) {
            if (authorizedOracles[i] == oracle) {
                authorizedOracles[i] = authorizedOracles[authorizedOracles.length - 1];
                authorizedOracles.pop();
                break;
            }
        }

        emit OracleRevoked(oracle);
    }

    /**
     * @dev 更新数据源配置
     */
    function updateDataSource(
        address oracle,
        uint256 weight,
        bool isActive
    ) external onlyOwner {
        require(isAuthorizedOracle[oracle], "Oracle not authorized");
        require(weight <= 100, "Invalid weight");

        dataSources[oracle].weight = weight;
        dataSources[oracle].isActive = isActive;

        emit DataSourceUpdated(oracle, weight, isActive);
    }

    /**
     * @dev 更新价格数据
     */
    function updatePrice(
        string memory symbol,
        uint256 price,
        uint256 confidence
    ) external onlyAuthorizedOracle validSymbol(symbol) {
        require(price > 0, "Invalid price");
        require(confidence <= 100, "Invalid confidence");

        // 更新价格数据
        priceFeeds[symbol][msg.sender] = PriceData({
            price: price,
            timestamp: block.timestamp,
            confidence: confidence,
            updater: msg.sender,
            isActive: true
        });

        // 更新数据源最后更新时间
        dataSources[msg.sender].lastUpdate = block.timestamp;

        // 添加到符号预言机列表（如果不存在）
        bool exists = false;
        address[] storage oracles = symbolOracles[symbol];
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i] == msg.sender) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            oracles.push(msg.sender);
        }

        emit PriceUpdated(symbol, msg.sender, price, block.timestamp, confidence);

        // 触发聚合价格更新
        _updateAggregatedPrice(symbol);
    }

    /**
     * @dev 批量更新价格
     */
    function updatePrices(
        string[] memory symbols,
        uint256[] memory prices,
        uint256[] memory confidences
    ) external onlyAuthorizedOracle {
        require(
            symbols.length == prices.length && 
            prices.length == confidences.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < symbols.length; i++) {
            updatePrice(symbols[i], prices[i], confidences[i]);
        }
    }

    /**
     * @dev 内部函数：更新聚合价格
     */
    function _updateAggregatedPrice(string memory symbol) internal {
        address[] memory oracles = symbolOracles[symbol];
        require(oracles.length > 0, "No oracles for symbol");

        uint256 totalWeight = 0;
        uint256 weightedSum = 0;
        uint256 validSources = 0;
        uint256[] memory validPrices = new uint256[](oracles.length);

        // 收集有效价格数据
        for (uint256 i = 0; i < oracles.length; i++) {
            address oracle = oracles[i];
            PriceData memory data = priceFeeds[symbol][oracle];
            DataSource memory source = dataSources[oracle];

            // 检查数据有效性
            if (
                data.isActive &&
                source.isActive &&
                block.timestamp.sub(data.timestamp) <= MAX_PRICE_AGE &&
                data.confidence >= 50  // 最小置信度
            ) {
                uint256 weight = source.weight.mul(data.confidence).div(100);
                weightedSum = weightedSum.add(data.price.mul(weight));
                totalWeight = totalWeight.add(weight);
                validPrices[validSources] = data.price;
                validSources++;
            }
        }

        require(validSources >= MIN_SOURCES, "Insufficient valid sources");

        // 计算聚合价格
        uint256 aggregatedPrice = weightedSum.div(totalWeight);

        // 计算价格偏差
        uint256 deviation = _calculateDeviation(validPrices, validSources, aggregatedPrice);
        require(deviation <= MAX_DEVIATION, "Price deviation too high");

        // 更新聚合价格
        aggregatedPrices[symbol] = AggregatedPrice({
            price: aggregatedPrice,
            timestamp: block.timestamp,
            deviation: deviation,
            sourceCount: validSources
        });

        // 添加到历史记录
        priceHistory[symbol].push(PriceHistory({
            price: aggregatedPrice,
            timestamp: block.timestamp,
            volume: 0  // 可以从外部数据源获取
        }));

        emit AggregatedPriceUpdated(symbol, aggregatedPrice, block.timestamp, deviation, validSources);
    }

    /**
     * @dev 计算价格偏差
     */
    function _calculateDeviation(
        uint256[] memory prices,
        uint256 count,
        uint256 average
    ) internal pure returns (uint256) {
        if (count <= 1) return 0;

        uint256 sumSquaredDiff = 0;
        for (uint256 i = 0; i < count; i++) {
            uint256 diff = prices[i] > average ? 
                prices[i].sub(average) : average.sub(prices[i]);
            sumSquaredDiff = sumSquaredDiff.add(diff.mul(diff));
        }

        uint256 variance = sumSquaredDiff.div(count);
        uint256 stdDev = _sqrt(variance);
        
        // 返回相对标准差（基点）
        return stdDev.mul(10000).div(average);
    }

    /**
     * @dev 平方根计算（牛顿法）
     */
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = x.add(1).div(2);
        uint256 y = x;
        while (z < y) {
            y = z;
            z = x.div(z).add(z).div(2);
        }
        return y;
    }

    /**
     * @dev 获取最新价格
     */
    function getLatestPrice(string memory symbol) 
        external 
        view 
        validSymbol(symbol) 
        returns (uint256 price, uint256 timestamp, uint256 confidence) 
    {
        AggregatedPrice memory aggPrice = aggregatedPrices[symbol];
        require(aggPrice.timestamp > 0, "Price not available");
        require(
            block.timestamp.sub(aggPrice.timestamp) <= MAX_PRICE_AGE,
            "Price too old"
        );

        return (aggPrice.price, aggPrice.timestamp, 100 - aggPrice.deviation.div(100));
    }

    /**
     * @dev 获取价格历史
     */
    function getPriceHistory(
        string memory symbol,
        uint256 fromTimestamp,
        uint256 toTimestamp
    ) external view returns (PriceHistory[] memory) {
        PriceHistory[] memory history = priceHistory[symbol];
        
        // 简化实现：返回所有历史记录
        // 实际应用中可以根据时间范围过滤
        return history;
    }

    /**
     * @dev 获取多个符号的价格
     */
    function getMultiplePrices(string[] memory symbols)
        external
        view
        returns (uint256[] memory prices, uint256[] memory timestamps)
    {
        prices = new uint256[](symbols.length);
        timestamps = new uint256[](symbols.length);

        for (uint256 i = 0; i < symbols.length; i++) {
            AggregatedPrice memory aggPrice = aggregatedPrices[symbols[i]];
            prices[i] = aggPrice.price;
            timestamps[i] = aggPrice.timestamp;
        }
    }

    /**
     * @dev 获取预言机状态
     */
    function getOracleStatus(address oracle)
        external
        view
        returns (
            string memory name,
            uint256 weight,
            bool isActive,
            uint256 lastUpdate,
            uint256 reliability
        )
    {
        DataSource memory source = dataSources[oracle];
        return (
            source.name,
            source.weight,
            source.isActive,
            source.lastUpdate,
            source.reliability
        );
    }

    /**
     * @dev 获取符号的所有预言机
     */
    function getSymbolOracles(string memory symbol)
        external
        view
        returns (address[] memory)
    {
        return symbolOracles[symbol];
    }

    /**
     * @dev 获取授权预言机列表
     */
    function getAuthorizedOracles() external view returns (address[] memory) {
        return authorizedOracles;
    }

    /**
     * @dev 检查价格是否可用
     */
    function isPriceAvailable(string memory symbol) external view returns (bool) {
        AggregatedPrice memory aggPrice = aggregatedPrices[symbol];
        return aggPrice.timestamp > 0 && 
               block.timestamp.sub(aggPrice.timestamp) <= MAX_PRICE_AGE;
    }

    /**
     * @dev 紧急暂停价格更新
     */
    function emergencyPause(string memory symbol) external onlyOwner {
        address[] memory oracles = symbolOracles[symbol];
        for (uint256 i = 0; i < oracles.length; i++) {
            priceFeeds[symbol][oracles[i]].isActive = false;
        }
    }

    /**
     * @dev 恢复价格更新
     */
    function emergencyResume(string memory symbol) external onlyOwner {
        address[] memory oracles = symbolOracles[symbol];
        for (uint256 i = 0; i < oracles.length; i++) {
            if (dataSources[oracles[i]].isActive) {
                priceFeeds[symbol][oracles[i]].isActive = true;
            }
        }
    }
}