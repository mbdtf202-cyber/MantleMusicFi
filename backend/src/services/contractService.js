const { ethers } = require('ethers');

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.initialized = false;
  }

  // 初始化区块链连接
  async initialize() {
    try {
      // 连接到区块链网络
      this.provider = new ethers.providers.JsonRpcProvider(
        process.env.RPC_URL || 'http://localhost:8545'
      );

      // 创建签名者
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }

      // 测试连接
      await this.provider.getNetwork();
      
      this.initialized = true;
      console.log('区块链连接初始化成功');
    } catch (error) {
      console.error('区块链连接初始化失败:', error.message);
      // 不抛出错误，允许应用在没有区块链连接的情况下运行
    }
  }

  // 获取合约实例
  getContract(contractName, address, abi) {
    if (!this.initialized) {
      throw new Error('区块链服务未初始化');
    }

    const key = `${contractName}_${address}`;
    
    if (!this.contracts[key]) {
      this.contracts[key] = new ethers.Contract(
        address,
        abi,
        this.signer || this.provider
      );
    }

    return this.contracts[key];
  }

  // 铸造代币
  async mintToken(contractAddress, to, amount, metadata) {
    try {
      if (!this.initialized) {
        throw new Error('区块链服务未初始化');
      }

      // 这里需要实际的合约ABI
      const abi = [
        'function mint(address to, uint256 amount, string metadata) external returns (uint256)',
      ];

      const contract = this.getContract('MRTToken', contractAddress, abi);
      const tx = await contract.mint(to, amount, metadata);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('铸造代币失败:', error);
      throw new Error(`铸造代币失败: ${error.message}`);
    }
  }

  // 获取代币余额
  async getTokenBalance(contractAddress, userAddress) {
    try {
      if (!this.initialized) {
        return '0';
      }

      const abi = [
        'function balanceOf(address owner) view returns (uint256)',
      ];

      const contract = this.getContract('MRTToken', contractAddress, abi);
      const balance = await contract.balanceOf(userAddress);

      return balance.toString();
    } catch (error) {
      console.error('获取代币余额失败:', error);
      return '0';
    }
  }

  // 转移代币
  async transferToken(contractAddress, to, amount) {
    try {
      if (!this.initialized) {
        throw new Error('区块链服务未初始化');
      }

      const abi = [
        'function transfer(address to, uint256 amount) external returns (bool)',
      ];

      const contract = this.getContract('MRTToken', contractAddress, abi);
      const tx = await contract.transfer(to, amount);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('转移代币失败:', error);
      throw new Error(`转移代币失败: ${error.message}`);
    }
  }

  // 分配收益
  async distributeRevenue(contractAddress, recipients, amounts) {
    try {
      if (!this.initialized) {
        throw new Error('区块链服务未初始化');
      }

      const abi = [
        'function distributeRevenue(address[] recipients, uint256[] amounts) external',
      ];

      const contract = this.getContract('Treasury', contractAddress, abi);
      const tx = await contract.distributeRevenue(recipients, amounts);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('分配收益失败:', error);
      throw new Error(`分配收益失败: ${error.message}`);
    }
  }

  // 获取网络信息
  async getNetworkInfo() {
    try {
      if (!this.initialized) {
        return null;
      }

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
      };
    } catch (error) {
      console.error('获取网络信息失败:', error);
      return null;
    }
  }

  // 检查连接状态
  isConnected() {
    return this.initialized;
  }
}

// 创建单例实例
const contractService = new ContractService();

module.exports = contractService;