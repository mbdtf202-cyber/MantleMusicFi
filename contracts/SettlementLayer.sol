// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IPriceOracle {
    function getLatestPrice(string memory symbol) 
        external 
        view 
        returns (uint256 price, uint256 timestamp, uint256 confidence);
}

/**
 * @title SettlementLayer
 * @dev Handles cross-chain settlements and payment processing for MantleMusic
 * Supports multiple payment methods and cross-chain transactions
 */
contract SettlementLayer is 
    Ownable, 
    ReentrancyGuard, 
    Pausable 
{
    using SafeERC20 for IERC20;

    // 结算类型枚举
    enum SettlementType {
        ROYALTY_DISTRIBUTION,   // 版税分配
        TRADE_SETTLEMENT,       // 交易结算
        YIELD_DISTRIBUTION,     // 收益分配
        LOAN_REPAYMENT,        // 贷款还款
        INSURANCE_CLAIM        // 保险理赔
    }

    // 结算状态枚举
    enum SettlementStatus {
        PENDING,               // 待处理
        PROCESSING,            // 处理中
        COMPLETED,             // 已完成
        FAILED,                // 失败
        CANCELLED              // 已取消
    }

    // 结算任务结构
    struct SettlementTask {
        uint256 id;                    // 任务ID
        SettlementType taskType;       // 任务类型
        address initiator;             // 发起者
        address[] recipients;          // 接收者列表
        uint256[] amounts;             // 金额列表
        address token;                 // 代币地址
        uint256 totalAmount;           // 总金额
        uint256 executionTime;         // 执行时间
        uint256 deadline;              // 截止时间
        SettlementStatus status;       // 状态
        bytes32 dataHash;              // 数据哈希
        string metadata;               // 元数据
        bool isRecurring;              // 是否循环
        uint256 recurringInterval;     // 循环间隔
        uint256 nextExecution;         // 下次执行时间
    }

    // 版税分配结构
    struct RoyaltyDistribution {
        string musicId;                // 音乐ID
        address[] stakeholders;        // 利益相关者
        uint256[] percentages;         // 分配比例（基点）
        uint256 totalRevenue;          // 总收入
        uint256 distributedAmount;     // 已分配金额
        uint256 lastDistribution;      // 最后分配时间
        bool isActive;                 // 是否活跃
    }

    // 交易结算结构
    struct TradeSettlement {
        address buyer;                 // 买方
        address seller;                // 卖方
        address asset;                 // 资产地址
        uint256 amount;                // 数量
        uint256 price;                 // 价格
        address paymentToken;          // 支付代币
        uint256 settlementTime;        // 结算时间
        bool isEscrow;                 // 是否托管
        bytes32 tradeHash;             // 交易哈希
    }

    // 自动化规则结构
    struct AutomationRule {
        uint256 id;                    // 规则ID
        address creator;               // 创建者
        SettlementType triggerType;    // 触发类型
        bytes triggerCondition;        // 触发条件
        bytes executionData;           // 执行数据
        uint256 gasLimit;              // Gas限制
        uint256 gasPrice;              // Gas价格
        bool isActive;                 // 是否活跃
        uint256 lastExecution;         // 最后执行时间
        uint256 executionCount;        // 执行次数
    }

    // 状态变量
    IPriceOracle public priceOracle;                                    // 价格预言机
    
    mapping(uint256 => SettlementTask) public settlementTasks;          // 结算任务
    mapping(string => RoyaltyDistribution) public royaltyDistributions; // 版税分配
    mapping(bytes32 => TradeSettlement) public tradeSettlements;        // 交易结算
    mapping(uint256 => AutomationRule) public automationRules;          // 自动化规则
    
    mapping(address => uint256[]) public userTasks;                     // 用户任务
    mapping(address => mapping(address => uint256)) public balances;    // 用户余额
    mapping(address => bool) public authorizedExecutors;                // 授权执行者
    
    uint256 public nextTaskId = 1;                                      // 下一个任务ID
    uint256 public nextRuleId = 1;                                      // 下一个规则ID
    uint256 public executionFee = 0.001 ether;                         // 执行费用
    uint256 public maxGasLimit = 500000;                               // 最大Gas限制
    
    address[] public supportedTokens;                                   // 支持的代币
    mapping(address => bool) public isSupportedToken;                   // 代币支持状态

    // 事件
    event SettlementTaskCreated(
        uint256 indexed taskId,
        SettlementType taskType,
        address indexed initiator,
        uint256 totalAmount,
        uint256 executionTime
    );
    
    event SettlementExecuted(
        uint256 indexed taskId,
        SettlementStatus status,
        uint256 executedAmount,
        uint256 gasUsed
    );
    
    event RoyaltyDistributed(
        string indexed musicId,
        uint256 totalAmount,
        uint256 stakeholderCount,
        uint256 timestamp
    );
    
    event TradeSettled(
        bytes32 indexed tradeHash,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 price
    );
    
    event AutomationRuleCreated(
        uint256 indexed ruleId,
        address indexed creator,
        SettlementType triggerType
    );
    
    event AutomationExecuted(
        uint256 indexed ruleId,
        uint256 indexed taskId,
        bool success
    );

    // 修饰符
    modifier onlyAuthorizedExecutor() {
        require(
            authorizedExecutors[msg.sender] || msg.sender == owner(),
            "Not authorized executor"
        );
        _;
    }

    modifier validToken(address token) {
        require(isSupportedToken[token], "Token not supported");
        _;
    }

    constructor(address _priceOracle, address initialOwner) Ownable(initialOwner) {
        priceOracle = IPriceOracle(_priceOracle);
        authorizedExecutors[msg.sender] = true;
    }

    /**
     * @dev 设置价格预言机
     */
    function setPriceOracle(address _priceOracle) external onlyOwner {
        require(_priceOracle != address(0), "Invalid oracle address");
        priceOracle = IPriceOracle(_priceOracle);
    }

    /**
     * @dev 添加支持的代币
     */
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!isSupportedToken[token], "Token already supported");
        
        isSupportedToken[token] = true;
        supportedTokens.push(token);
    }

    /**
     * @dev 授权执行者
     */
    function authorizeExecutor(address executor) external onlyOwner {
        require(executor != address(0), "Invalid executor address");
        authorizedExecutors[executor] = true;
    }

    /**
     * @dev 撤销执行者授权
     */
    function revokeExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = false;
    }

    /**
     * @dev 创建结算任务
     */
    function createSettlementTask(
        SettlementType taskType,
        address[] memory recipients,
        uint256[] memory amounts,
        address token,
        uint256 executionTime,
        uint256 deadline,
        string memory metadata,
        bool isRecurring,
        uint256 recurringInterval
    ) external payable validToken(token) returns (uint256 taskId) {
        require(recipients.length == amounts.length, "Array length mismatch");
        require(recipients.length > 0, "No recipients");
        require(executionTime >= block.timestamp, "Invalid execution time");
        require(deadline > executionTime, "Invalid deadline");
        require(msg.value >= executionFee, "Insufficient execution fee");

        // 计算总金额
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Invalid amount");
            totalAmount = totalAmount + amounts[i];
        }

        // 转移代币到合约
        if (token != address(0)) {
            IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
        } else {
            require(msg.value >= totalAmount + executionFee, "Insufficient ETH");
        }

        taskId = nextTaskId++;
        
        settlementTasks[taskId] = SettlementTask({
            id: taskId,
            taskType: taskType,
            initiator: msg.sender,
            recipients: recipients,
            amounts: amounts,
            token: token,
            totalAmount: totalAmount,
            executionTime: executionTime,
            deadline: deadline,
            status: SettlementStatus.PENDING,
            dataHash: keccak256(abi.encodePacked(recipients, amounts)),
            metadata: metadata,
            isRecurring: isRecurring,
            recurringInterval: recurringInterval,
            nextExecution: isRecurring ? executionTime + recurringInterval : 0
        });

        userTasks[msg.sender].push(taskId);

        emit SettlementTaskCreated(
            taskId,
            taskType,
            msg.sender,
            totalAmount,
            executionTime
        );
    }

    /**
     * @dev 执行结算任务
     */
    function executeSettlement(uint256 taskId) 
        external 
        onlyAuthorizedExecutor 
        nonReentrant 
        whenNotPaused 
    {
        SettlementTask storage task = settlementTasks[taskId];
        require(task.id != 0, "Task not found");
        require(task.status == SettlementStatus.PENDING, "Task not pending");
        require(block.timestamp >= task.executionTime, "Too early to execute");
        require(block.timestamp <= task.deadline, "Task expired");

        task.status = SettlementStatus.PROCESSING;

        uint256 gasStart = gasleft();
        bool success = true;

        // 执行分配
        for (uint256 i = 0; i < task.recipients.length; i++) {
            address recipient = task.recipients[i];
            uint256 amount = task.amounts[i];

            if (task.token == address(0)) {
                // ETH转账
                (bool sent, ) = recipient.call{value: amount}("");
                if (!sent) {
                    success = false;
                    break;
                }
            } else {
                // ERC20转账
                try IERC20(task.token).transfer(recipient, amount) returns (bool result) {
                    if (!result) {
                        success = false;
                        break;
                    }
                } catch {
                    success = false;
                    break;
                }
            }
        }

        uint256 gasUsed = gasStart - gasleft();

        if (success) {
            task.status = SettlementStatus.COMPLETED;
            
            // 处理循环任务
            if (task.isRecurring && task.nextExecution > 0) {
                _createRecurringTask(task);
            }
        } else {
            task.status = SettlementStatus.FAILED;
            // 退还资金给发起者
            _refundTask(task);
        }

        emit SettlementExecuted(taskId, task.status, task.totalAmount, gasUsed);
    }

    /**
     * @dev 创建版税分配
     */
    function createRoyaltyDistribution(
        string memory musicId,
        address[] memory stakeholders,
        uint256[] memory percentages
    ) external {
        require(stakeholders.length == percentages.length, "Array length mismatch");
        require(stakeholders.length > 0, "No stakeholders");

        // 验证百分比总和为10000（100%）
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            require(percentages[i] > 0, "Invalid percentage");
            totalPercentage = totalPercentage + percentages[i];
        }
        require(totalPercentage == 10000, "Percentages must sum to 100%");

        royaltyDistributions[musicId] = RoyaltyDistribution({
            musicId: musicId,
            stakeholders: stakeholders,
            percentages: percentages,
            totalRevenue: 0,
            distributedAmount: 0,
            lastDistribution: 0,
            isActive: true
        });
    }

    /**
     * @dev 分配版税
     */
    function distributeRoyalty(
        string memory musicId,
        uint256 revenue,
        address token
    ) external validToken(token) {
        RoyaltyDistribution storage distribution = royaltyDistributions[musicId];
        require(distribution.isActive, "Distribution not active");

        // 转移收入到合约
        if (token != address(0)) {
            IERC20(token).safeTransferFrom(msg.sender, address(this), revenue);
        }

        distribution.totalRevenue = distribution.totalRevenue + revenue;

        // 计算并分配给每个利益相关者
        address[] memory recipients = new address[](distribution.stakeholders.length);
        uint256[] memory amounts = new uint256[](distribution.stakeholders.length);

        for (uint256 i = 0; i < distribution.stakeholders.length; i++) {
            recipients[i] = distribution.stakeholders[i];
            amounts[i] = revenue * distribution.percentages[i] / 10000;
        }

        // 创建即时结算任务
        uint256 taskId = nextTaskId++;
        settlementTasks[taskId] = SettlementTask({
            id: taskId,
            taskType: SettlementType.ROYALTY_DISTRIBUTION,
            initiator: msg.sender,
            recipients: recipients,
            amounts: amounts,
            token: token,
            totalAmount: revenue,
            executionTime: block.timestamp,
            deadline: block.timestamp + 3600, // 1小时后过期
            status: SettlementStatus.PENDING,
            dataHash: keccak256(abi.encodePacked(recipients, amounts)),
            metadata: musicId,
            isRecurring: false,
            recurringInterval: 0,
            nextExecution: 0
        });

        distribution.distributedAmount = distribution.distributedAmount + revenue;
        distribution.lastDistribution = block.timestamp;

        // 立即执行
        _executeImmediateSettlement(taskId);

        emit RoyaltyDistributed(musicId, revenue, recipients.length, block.timestamp);
    }

    /**
     * @dev 创建交易结算
     */
    function createTradeSettlement(
        address buyer,
        address seller,
        address asset,
        uint256 amount,
        uint256 price,
        address paymentToken,
        bool isEscrow
    ) external payable returns (bytes32 tradeHash) {
        require(buyer != address(0) && seller != address(0), "Invalid addresses");
        require(amount > 0 && price > 0, "Invalid amounts");

        tradeHash = keccak256(abi.encodePacked(
            buyer, seller, asset, amount, price, block.timestamp
        ));

        tradeSettlements[tradeHash] = TradeSettlement({
            buyer: buyer,
            seller: seller,
            asset: asset,
            amount: amount,
            price: price,
            paymentToken: paymentToken,
            settlementTime: block.timestamp + 300, // 5分钟后结算
            isEscrow: isEscrow,
            tradeHash: tradeHash
        });

        if (isEscrow) {
            // 托管模式：买方资金锁定在合约中
            uint256 totalPayment = amount * price;
            if (paymentToken == address(0)) {
                require(msg.value >= totalPayment, "Insufficient ETH");
            } else {
                IERC20(paymentToken).safeTransferFrom(buyer, address(this), totalPayment);
            }
        }
    }

    /**
     * @dev 结算交易
     */
    function settleTrade(bytes32 tradeHash) external payable nonReentrant {
        TradeSettlement storage trade = tradeSettlements[tradeHash];
        require(trade.tradeHash != bytes32(0), "Trade not found");
        require(block.timestamp >= trade.settlementTime, "Too early to settle");

        uint256 totalPayment = trade.amount * trade.price;

        if (trade.isEscrow) {
            // 托管模式：从合约转账给卖方
            if (trade.paymentToken == address(0)) {
                (bool sent, ) = trade.seller.call{value: totalPayment}("");
                require(sent, "ETH transfer failed");
            } else {
                IERC20(trade.paymentToken).safeTransfer(trade.seller, totalPayment);
            }
        } else {
            // 直接模式：买方直接转账给卖方
            if (trade.paymentToken == address(0)) {
                require(msg.value >= totalPayment, "Insufficient ETH");
                (bool sent, ) = trade.seller.call{value: totalPayment}("");
                require(sent, "ETH transfer failed");
            } else {
                IERC20(trade.paymentToken).safeTransferFrom(
                    trade.buyer, trade.seller, totalPayment
                );
            }
        }

        emit TradeSettled(
            tradeHash,
            trade.buyer,
            trade.seller,
            trade.amount,
            trade.price
        );

        // 清理交易数据
        delete tradeSettlements[tradeHash];
    }

    /**
     * @dev 创建自动化规则
     */
    function createAutomationRule(
        SettlementType triggerType,
        bytes memory triggerCondition,
        bytes memory executionData,
        uint256 gasLimit
    ) external payable returns (uint256 ruleId) {
        require(gasLimit <= maxGasLimit, "Gas limit too high");
        require(msg.value >= executionFee, "Insufficient execution fee");

        ruleId = nextRuleId++;
        
        automationRules[ruleId] = AutomationRule({
            id: ruleId,
            creator: msg.sender,
            triggerType: triggerType,
            triggerCondition: triggerCondition,
            executionData: executionData,
            gasLimit: gasLimit,
            gasPrice: tx.gasprice,
            isActive: true,
            lastExecution: 0,
            executionCount: 0
        });

        emit AutomationRuleCreated(ruleId, msg.sender, triggerType);
    }

    /**
     * @dev 内部函数：执行即时结算
     */
    function _executeImmediateSettlement(uint256 taskId) internal {
        SettlementTask storage task = settlementTasks[taskId];
        task.status = SettlementStatus.PROCESSING;

        bool success = true;
        for (uint256 i = 0; i < task.recipients.length; i++) {
            address recipient = task.recipients[i];
            uint256 amount = task.amounts[i];

            if (task.token == address(0)) {
                (bool sent, ) = recipient.call{value: amount}("");
                if (!sent) {
                    success = false;
                    break;
                }
            } else {
                try IERC20(task.token).transfer(recipient, amount) returns (bool result) {
                    if (!result) {
                        success = false;
                        break;
                    }
                } catch {
                    success = false;
                    break;
                }
            }
        }

        task.status = success ? SettlementStatus.COMPLETED : SettlementStatus.FAILED;
        
        if (!success) {
            _refundTask(task);
        }

        emit SettlementExecuted(taskId, task.status, task.totalAmount, 0);
    }

    /**
     * @dev 内部函数：创建循环任务
     */
    function _createRecurringTask(SettlementTask memory originalTask) internal {
        uint256 newTaskId = nextTaskId++;
        
        settlementTasks[newTaskId] = SettlementTask({
            id: newTaskId,
            taskType: originalTask.taskType,
            initiator: originalTask.initiator,
            recipients: originalTask.recipients,
            amounts: originalTask.amounts,
            token: originalTask.token,
            totalAmount: originalTask.totalAmount,
            executionTime: originalTask.nextExecution,
            deadline: originalTask.nextExecution + 3600,
            status: SettlementStatus.PENDING,
            dataHash: originalTask.dataHash,
            metadata: originalTask.metadata,
            isRecurring: originalTask.isRecurring,
            recurringInterval: originalTask.recurringInterval,
            nextExecution: originalTask.nextExecution + originalTask.recurringInterval
        });

        userTasks[originalTask.initiator].push(newTaskId);
    }

    /**
     * @dev 内部函数：退还任务资金
     */
    function _refundTask(SettlementTask memory task) internal {
        if (task.token == address(0)) {
            (bool sent, ) = task.initiator.call{value: task.totalAmount}("");
            require(sent, "ETH refund failed");
        } else {
            IERC20(task.token).safeTransfer(task.initiator, task.totalAmount);
        }
    }

    /**
     * @dev 获取用户任务
     */
    function getUserTasks(address user) external view returns (uint256[] memory) {
        return userTasks[user];
    }

    /**
     * @dev 获取支持的代币列表
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    /**
     * @dev 取消任务
     */
    function cancelTask(uint256 taskId) external {
        SettlementTask storage task = settlementTasks[taskId];
        require(task.initiator == msg.sender, "Not task initiator");
        require(task.status == SettlementStatus.PENDING, "Task not pending");
        require(block.timestamp < task.executionTime, "Too late to cancel");

        task.status = SettlementStatus.CANCELLED;
        _refundTask(task);
    }

    /**
     * @dev 紧急暂停
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复运行
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 提取合约余额
     */
    function withdrawBalance(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool sent, ) = owner().call{value: amount}("");
            require(sent, "ETH withdrawal failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // 接收ETH
    receive() external payable {}
}