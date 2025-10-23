# MantleMusicFi 🎵

**[English](#english) | [中文](#中文)**

---

## English

> **Decentralized Music Royalty Revenue Platform** - Music Copyright RWA + DeFi + AI + Privacy Solutions on Mantle Network

### 🎯 Project Overview

MantleMusicFi is an innovative decentralized music royalty revenue platform that tokenizes future music copyright revenues into Music Royalty Tokens (MRT), enabling on-chain trading, lending, revenue distribution, and portfolio investment. Through AI-powered valuation and risk management, combined with ZK/SBT technology for compliance and privacy protection, we build a composable DeFi ecosystem.

### Core Value Propositions
- 🎼 **Copyright Tokenization**: Transform music copyright revenues into tradeable MRT tokens
- 💰 **DeFi Ecosystem**: Support lending, liquidity mining, yield aggregation and other financial services
- 🤖 **AI-Driven**: Intelligent valuation, credit scoring and dynamic interest rate engine
- 🔒 **Privacy Protection**: ZK-KYC and SBT technology ensuring compliance and privacy
- ⚡ **Mantle Advantage**: Enjoy ultra-low gas fees and high-performance trading experience

### 🏗️ System Architecture

```
[Artist / Rights Holder]            [Investor / LP / Buyer]
         |                                    |
(1) Upload metadata/CID -----> Frontend (React+TS) <---- (2) Swap / buy / stake
         |                                    |
[Custodian / SPV / Legal Ops]------(3) Off-chain settlement & sign------> [Oracle Layer]
         |                                                                    |
         |                            Mantle SDK / RPC (ethers+w/ asL2Provider) |
         |                                                                    |
(4) Treasury Contract <---- Smart Contracts on Mantle L2 ----> (5) DeFi Modules
         |              [MRT token, Treasury, OracleManager, LendingPool, AMM]|
         |                                                                    |
(6) Chainlink Functions / Automation  <-- fallback: custom signed oracle -->|
         |
(7) AI Service (off-chain) -> writes creditScore/predictions -> oracle writes score on-chain
         |
(8) Privacy Layer: ZK-KYC / SBT verification (on-chain flags)
```

### 🚀 Features

#### 🎨 Artist Portal
- Music work on-chain declaration
- Copyright revenue authorization management
- MRT token issuance and management
- Revenue distribution tracking

#### 🪙 Tokenization Engine
- Issue MRT tokens (ERC-20/ERC-3643 standard)
- Divisible copyright shares
- Smart contract automation management

#### 🔗 Oracle & Settlement Layer
- Off-chain revenue data feeding
- Automated settlement bridge
- Chainlink integration support

#### 💎 DeFi Layer
- **AMM/LP**: Automated Market Maker and Liquidity Pools
- **Lending Pool**: Lending Protocol
- **Yield Aggregator**: Yield Aggregation
- **Index Fund**: Index Funds

#### 🤖 AI Layer
- Revenue prediction models
- Credit scoring system
- Dynamic interest rate engine
- Risk assessment algorithms

#### 🛡️ Privacy/Compliance
- ZK-KYC identity verification
- SBT (Soulbound Token)
- Selective information disclosure

#### 📊 Dashboard & Analytics
- Portfolio management
- Revenue tracking analysis
- Data visualization
- Real-time market monitoring

#### 🏛️ DAO / Governance
- Decentralized governance
- Incentive mechanism design
- Secondary market policy making

### 🛠️ Tech Stack

#### Blockchain Layer
- **Smart Contracts**: Solidity + OpenZeppelin
- **Testing Environment**: Hardhat + Ethers.js
- **Mainnet Deployment**: Mantle Network
- **Testnet**: Support Polygon/Other Testnets

#### Oracle & Data Layer
- **Oracle**: Chainlink (Production) / Centralized Script (PoC)
- **Storage**: IPFS / Arweave (Metadata Storage)

#### AI & Backend
- **AI Service**: Python + FastAPI
- **Machine Learning**: scikit-learn / PyTorch
- **Features**: Revenue prediction, credit scoring

#### Frontend
- **Framework**: TypeScript + React + Next.js
- **Web3 Integration**: wagmi + ethers
- **UI Components**: Custom component library
- **State Management**: React Context + Hooks

#### Privacy Technology (Extended Features)
- **ZK Proofs**: Circom/snarkjs
- **Identity Verification**: Polygon ID / Semaphore
- **Features**: ZK-KYC PoC

### 🚀 Quick Start

#### Prerequisites
- Node.js 18+
- npm or yarn
- Git

#### Installation Steps

1. **Clone the project**
```bash
git clone https://github.com/mbdtf202-cyber/MantleMusicFi.git
cd MantleMusicFi
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment configuration**
```bash
cp .env.example .env.local
# Edit .env.local file, add necessary environment variables
```

4. **Start development server**
```bash
npm run dev
```

5. **Access the application**
Open browser and visit `http://localhost:3000`

### 📁 Project Structure

```
MantleMusicFi/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── artist/            # Artist portal
│   │   ├── dashboard/         # User dashboard
│   │   ├── defi/             # DeFi features
│   │   ├── governance/       # Governance module
│   │   └── analytics/        # Data analytics
│   ├── components/           # React components
│   │   ├── ui/              # Basic UI components
│   │   ├── charts/          # Chart components
│   │   ├── layout/          # Layout components
│   │   └── wallet/          # Wallet connection
│   ├── hooks/               # Custom Hooks
│   ├── lib/                 # Utility libraries
│   ├── store/               # State management
│   ├── styles/              # Style files
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── backend/                 # Backend API service
├── ai-service/             # AI recommendation service
├── contracts/              # Smart contracts
├── tests/                  # Test suites
└── docs/                   # Project documentation
```

### 🧪 Testing

```bash
# Run all tests
cd tests && npm run test:all

# Run specific test suites
npm run test:integration    # Integration tests
npm run test:e2e           # End-to-end tests
```

### 🌐 Deployment

#### Docker Deployment
```bash
# Build and start all services
docker-compose up -d
```

#### Manual Deployment
```bash
# Build frontend
npm run build

# Deploy smart contracts
cd contracts && npx hardhat deploy --network mantle

# Start production servers
npm run start:prod
```

### 🤝 Contributing

We welcome community contributions! Please follow these steps:

1. Fork the project repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🔗 Links

- **Website**: [https://mantlemusicfi.com](https://mantlemusicfi.com)
- **Documentation**: [https://docs.mantlemusicfi.com](https://docs.mantlemusicfi.com)
- **Discord**: [https://discord.gg/mantlemusicfi](https://discord.gg/mantlemusicfi)
- **Twitter**: [@MantleMusicFi](https://twitter.com/MantleMusicFi)
- **Mantle Network**: [https://mantle.xyz](https://mantle.xyz)

---

## 中文

> **去中心化音乐版权收益平台** - 基于Mantle Network的音乐版权RWA + DeFi + AI + 隐私解决方案

### 🎯 项目概述

MantleMusicFi是一个创新的去中心化音乐版权收益平台，将音乐版权的未来收益权代币化为Music Royalty Token (MRT)，在链上实现买卖、借贷、收益分配与组合投资。通过AI进行估值与风控，使用ZK/SBT技术实现合规与隐私保护，构建可组合的DeFi生态系统。

### 核心价值主张
- 🎼 **版权代币化**: 将音乐版权收益权转化为可交易的MRT代币
- 💰 **DeFi生态**: 支持借贷、流动性挖矿、收益聚合等金融服务
- 🤖 **AI驱动**: 智能估值、信用评分和动态利率引擎
- 🔒 **隐私保护**: ZK-KYC和SBT技术确保合规性和隐私
- ⚡ **Mantle优势**: 享受超低gas费用和高性能交易体验

### 🏗️ 系统架构

```
[Artist / Rights Holder]            [Investor / LP / Buyer]
         |                                    |
(1) Upload metadata/CID -----> Frontend (React+TS) <---- (2) Swap / buy / stake
         |                                    |
[Custodian / SPV / Legal Ops]------(3) Off-chain settlement & sign------> [Oracle Layer]
         |                                                                    |
         |                            Mantle SDK / RPC (ethers+w/ asL2Provider) |
         |                                                                    |
(4) Treasury Contract <---- Smart Contracts on Mantle L2 ----> (5) DeFi Modules
         |              [MRT token, Treasury, OracleManager, LendingPool, AMM]|
         |                                                                    |
(6) Chainlink Functions / Automation  <-- fallback: custom signed oracle -->|
         |
(7) AI Service (off-chain) -> writes creditScore/predictions -> oracle writes score on-chain
         |
(8) Privacy Layer: ZK-KYC / SBT verification (on-chain flags)
```

### 🚀 功能模块

#### 🎨 Artist Portal（艺术家端）
- 音乐作品上链申报
- 版权收益授权管理
- MRT代币发行与管理
- 收益分配追踪

#### 🪙 Tokenization Engine
- 发行MRT代币（ERC-20/ERC-3643标准）
- 可分割版权份额
- 智能合约自动化管理

#### 🔗 Oracle & Settlement Layer
- 链下收益数据喂价
- 自动化结算桥接器
- Chainlink集成支持

#### 💎 DeFi Layer
- **AMM/LP**: 自动化做市商和流动性池
- **Lending Pool**: 借贷协议
- **Yield Aggregator**: 收益聚合器
- **Index Fund**: 指数基金

#### 🤖 AI Layer
- 收益预测模型
- 信用评分系统
- 动态利率引擎
- 风险评估算法

#### 🛡️ Privacy/Compliance
- ZK-KYC身份验证
- SBT（Soulbound Token）
- 选择性信息披露

#### 📊 Dashboard & Analytics
- 投资组合管理
- 收益追踪分析
- 数据可视化
- 实时市场监控

#### 🏛️ DAO / Governance
- 去中心化治理
- 激励机制设计
- 二级市场政策制定

### 🛠️ 技术栈

#### 区块链层
- **智能合约**: Solidity + OpenZeppelin
- **测试环境**: Hardhat + Ethers.js
- **主网部署**: Mantle Network
- **测试网**: 支持Polygon/其他Testnets

#### Oracle & 数据层
- **Oracle**: Chainlink（生产环境）/ 中心化脚本（PoC）
- **存储**: IPFS / Arweave（元数据存证）

#### AI & 后端
- **AI服务**: Python + FastAPI
- **机器学习**: scikit-learn / PyTorch
- **功能**: 收益预测、信用评分

#### 前端
- **框架**: TypeScript + React + Next.js
- **Web3集成**: wagmi + ethers
- **UI组件**: 自定义组件库
- **状态管理**: React Context + Hooks

#### 隐私技术（扩展功能）
- **ZK证明**: Circom/snarkjs
- **身份验证**: Polygon ID / Semaphore
- **功能**: ZK-KYC PoC

### 🚀 快速开始

#### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

#### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/mbdtf202-cyber/MantleMusicFi.git
cd MantleMusicFi
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
cp .env.example .env.local
# 编辑 .env.local 文件，添加必要的环境变量
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 `http://localhost:3000`

### 📁 项目结构

```
MantleMusicFi/
├── src/
│   ├── app/                    # Next.js App Router页面
│   │   ├── artist/            # 艺术家门户
│   │   ├── dashboard/         # 用户仪表板
│   │   ├── defi/             # DeFi功能
│   │   ├── governance/       # 治理模块
│   │   └── analytics/        # 数据分析
│   ├── components/           # React组件
│   │   ├── ui/              # 基础UI组件
│   │   ├── charts/          # 图表组件
│   │   ├── layout/          # 布局组件
│   │   └── wallet/          # 钱包连接
│   ├── hooks/               # 自定义Hooks
│   ├── lib/                 # 工具库
│   ├── store/               # 状态管理
│   ├── styles/              # 样式文件
│   ├── types/               # TypeScript类型定义
│   └── utils/               # 工具函数
├── backend/                 # 后端API服务
├── ai-service/             # AI推荐服务
├── contracts/              # 智能合约
├── tests/                  # 测试套件
└── docs/                   # 项目文档
```

### 🧪 测试

```bash
# 运行所有测试
cd tests && npm run test:all

# 运行特定测试套件
npm run test:integration    # 集成测试
npm run test:e2e           # 端到端测试
```

### 🌐 部署

#### Docker部署
```bash
# 构建并启动所有服务
docker-compose up -d
```

#### 手动部署
```bash
# 构建前端
npm run build

# 部署智能合约
cd contracts && npx hardhat deploy --network mantle

# 启动生产服务器
npm run start:prod
```

### 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

### 🔗 相关链接

- **官网**: [https://mantlemusicfi.com](https://mantlemusicfi.com)
- **文档**: [https://docs.mantlemusicfi.com](https://docs.mantlemusicfi.com)
- **Discord**: [https://discord.gg/mantlemusicfi](https://discord.gg/mantlemusicfi)
- **Twitter**: [@MantleMusicFi](https://twitter.com/MantleMusicFi)
- **Mantle Network**: [https://mantle.xyz](https://mantle.xyz)

### 📞 联系我们

- **邮箱**: contact@mantlemusicfi.com
- **Telegram**: [@MantleMusicFi](https://t.me/MantleMusicFi)
- **GitHub Issues**: [提交问题](https://github.com/mbdtf202-cyber/MantleMusicFi/issues)

### 🙏 致谢

感谢以下项目和团队的支持：
- [Mantle Network](https://mantle.xyz) - 高性能L2解决方案
- [OpenZeppelin](https://openzeppelin.com) - 安全的智能合约库
- [Chainlink](https://chain.link) - 去中心化Oracle网络
- [IPFS](https://ipfs.io) - 分布式存储协议

---

**⚡ Built on Mantle Network - Enjoy ultra-low gas fees and high-performance experience!**