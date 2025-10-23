# MantleMusicFi 🎵

> **去中心化音乐版权收益平台** - 基于Mantle Network的音乐版权RWA + DeFi + AI + 隐私解决方案

## 🎯 项目概述

MantleMusicFi是一个创新的去中心化音乐版权收益平台，将音乐版权的未来收益权代币化为Music Royalty Token (MRT)，在链上实现买卖、借贷、收益分配与组合投资。通过AI进行估值与风控，使用ZK/SBT技术实现合规与隐私保护，构建可组合的DeFi生态系统。

### 核心价值主张
- 🎼 **版权代币化**: 将音乐版权收益权转化为可交易的MRT代币
- 💰 **DeFi生态**: 支持借贷、流动性挖矿、收益聚合等金融服务
- 🤖 **AI驱动**: 智能估值、信用评分和动态利率引擎
- 🔒 **隐私保护**: ZK-KYC和SBT技术确保合规性和隐私
- ⚡ **Mantle优势**: 享受超低gas费用和高性能交易体验

## 🏗️ 系统架构

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

## 🚀 功能模块

### 🎨 Artist Portal（艺术家端）
- 音乐作品上链申报
- 版权收益授权管理
- MRT代币发行与管理
- 收益分配追踪

### 🪙 Tokenization Engine
- 发行MRT代币（ERC-20/ERC-3643标准）
- 可分割版权份额
- 智能合约自动化管理

### 🔗 Oracle & Settlement Layer
- 链下收益数据喂价
- 自动化结算桥接器
- Chainlink集成支持

### 💎 DeFi Layer
- **AMM/LP**: 自动化做市商和流动性池
- **Lending Pool**: 借贷协议
- **Yield Aggregator**: 收益聚合器
- **Index Fund**: 指数基金

### 🤖 AI Layer
- 收益预测模型
- 信用评分系统
- 动态利率引擎
- 风险评估算法

### 🛡️ Privacy/Compliance
- ZK-KYC身份验证
- SBT（Soulbound Token）
- 选择性信息披露

### 📊 Dashboard & Analytics
- 投资组合管理
- 收益追踪分析
- 数据可视化
- 实时市场监控

### 🏛️ DAO / Governance
- 去中心化治理
- 激励机制设计
- 二级市场政策制定

## 🎯 MVP功能特性

### ✅ 核心功能
- [x] 艺术家作品元数据上传（IPFS存证）
- [x] MRT代币申请与发行
- [x] MRT（ERC-20）购买、转让功能
- [x] 模拟Oracle收益喂价系统
- [x] Treasury收益分配机制
- [x] 前端Dashboard界面

### 📋 MVP清单
- **艺术家端**: 上传作品元数据（IPFS存证），申请MRT发行
- **代币系统**: MRT（ERC-20）发行、购买、转让
- **Oracle系统**: 手动/脚本喂入版权结算收益
- **Treasury**: 接收收益并基于snapshot分配给持有人
- **前端Dashboard**: 显示持仓、历史收益、claim按钮
- **完整文档**: 合约接口、部署流程、Demo视频

## 🛠️ 技术栈

### 区块链层
- **智能合约**: Solidity + OpenZeppelin
- **测试环境**: Hardhat + Ethers.js
- **主网部署**: Mantle Network
- **测试网**: 支持Polygon/其他Testnets

### Oracle & 数据层
- **Oracle**: Chainlink（生产环境）/ 中心化脚本（PoC）
- **存储**: IPFS / Arweave（元数据存证）

### AI & 后端
- **AI服务**: Python + FastAPI
- **机器学习**: scikit-learn / PyTorch
- **功能**: 收益预测、信用评分

### 前端
- **框架**: TypeScript + React + Next.js
- **Web3集成**: wagmi + ethers
- **UI组件**: 自定义组件库
- **状态管理**: React Context + Hooks

### 隐私技术（扩展功能）
- **ZK证明**: Circom/snarkjs
- **身份验证**: Polygon ID / Semaphore
- **功能**: ZK-KYC PoC

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/MantleMusicFi.git
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

### 环境变量配置

```env
# Mantle Network配置
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.mantle.xyz
NEXT_PUBLIC_MANTLE_CHAIN_ID=5000

# 合约地址
NEXT_PUBLIC_MRT_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_TREASURY_ADDRESS=0x...

# IPFS配置
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
IPFS_PROJECT_ID=your_infura_project_id
IPFS_PROJECT_SECRET=your_infura_project_secret

# Oracle配置
ORACLE_PRIVATE_KEY=0x...
CHAINLINK_NODE_URL=https://...
```

## 📁 项目结构

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
├── contracts/               # 智能合约（如果包含）
├── public/                  # 静态资源
├── docs/                    # 项目文档
└── tests/                   # 测试文件
```

## 🔧 开发指南

### 智能合约开发
```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到测试网
npx hardhat run scripts/deploy.js --network mantleTestnet
```

### 前端开发
```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

## 🧪 测试

### 运行测试套件
```bash
# 运行所有测试
npm run test

# 运行特定测试
npm run test -- --testNamePattern="MRT Token"

# 生成测试覆盖率报告
npm run test:coverage
```

## 📚 API文档

### 智能合约接口

#### MRT Token Contract
```solidity
// 发行MRT代币
function mintMRT(address artist, uint256 amount, string memory metadata) external

// 转让代币
function transfer(address to, uint256 amount) external returns (bool)

// 查询余额
function balanceOf(address account) external view returns (uint256)
```

#### Treasury Contract
```solidity
// 分配收益
function distributeRoyalties(uint256 totalAmount) external

// 领取收益
function claimRoyalties() external

// 查询可领取收益
function pendingRoyalties(address user) external view returns (uint256)
```

### REST API端点

```
GET    /api/artists/:id          # 获取艺术家信息
POST   /api/artists              # 创建艺术家档案
GET    /api/tokens/:id           # 获取MRT代币信息
POST   /api/oracle/feed          # Oracle数据喂价
GET    /api/analytics/portfolio  # 获取投资组合分析
```

## 🌐 部署

### Vercel部署（推荐）
1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 手动部署
```bash
# 构建项目
npm run build

# 启动生产服务器
npm run start
```

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 代码规范
- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier配置
- 编写单元测试覆盖新功能
- 更新相关文档

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- **官网**: [https://mantlemusicfi.com](https://mantlemusicfi.com)
- **文档**: [https://docs.mantlemusicfi.com](https://docs.mantlemusicfi.com)
- **Discord**: [https://discord.gg/mantlemusicfi](https://discord.gg/mantlemusicfi)
- **Twitter**: [@MantleMusicFi](https://twitter.com/MantleMusicFi)
- **Mantle Network**: [https://mantle.xyz](https://mantle.xyz)

## 📞 联系我们

- **邮箱**: contact@mantlemusicfi.com
- **Telegram**: [@MantleMusicFi](https://t.me/MantleMusicFi)
- **GitHub Issues**: [提交问题](https://github.com/your-username/MantleMusicFi/issues)

## 🙏 致谢

感谢以下项目和团队的支持：
- [Mantle Network](https://mantle.xyz) - 高性能L2解决方案
- [OpenZeppelin](https://openzeppelin.com) - 安全的智能合约库
- [Chainlink](https://chain.link) - 去中心化Oracle网络
- [IPFS](https://ipfs.io) - 分布式存储协议

---

**⚡ 基于Mantle Network构建 - 享受超低gas费用和高性能体验！**