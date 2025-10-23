const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 部署 MRT Token 合约
  console.log("\n1. Deploying MRT Token...");
  const MRTToken = await ethers.getContractFactory("MRTToken");
  const mrtToken = await MRTToken.deploy();
  await mrtToken.waitForDeployment();
  const mrtTokenAddress = await mrtToken.getAddress();
  console.log("MRT Token deployed to:", mrtTokenAddress);

  // 部署 Treasury 合约
  console.log("\n2. Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(mrtTokenAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddress);

  // 部署 Oracle Manager 合约
  console.log("\n3. Deploying Oracle Manager...");
  const OracleManager = await ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy();
  await oracleManager.waitForDeployment();
  const oracleManagerAddress = await oracleManager.getAddress();
  console.log("Oracle Manager deployed to:", oracleManagerAddress);

  // 验证部署
  console.log("\n4. Verifying deployments...");
  
  // 验证 MRT Token
  const tokenName = await mrtToken.name();
  const tokenSymbol = await mrtToken.symbol();
  console.log(`MRT Token: ${tokenName} (${tokenSymbol})`);
  
  // 验证 Treasury
  const treasuryMrtToken = await treasury.mrtToken();
  console.log(`Treasury MRT Token address: ${treasuryMrtToken}`);
  console.log(`Treasury MRT Token matches: ${treasuryMrtToken === mrtTokenAddress}`);
  
  // 验证 Oracle Manager
  const minOracleCount = await oracleManager.minOracleCount();
  console.log(`Oracle Manager min oracle count: ${minOracleCount}`);

  // 保存部署地址到文件
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      MRTToken: mrtTokenAddress,
      Treasury: treasuryAddress,
      OracleManager: oracleManagerAddress
    },
    deploymentTime: new Date().toISOString()
  };

  const fs = require('fs');
  const path = require('path');
  
  // 确保 deployments 目录存在
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // 保存部署信息
  const networkName = (await ethers.provider.getNetwork()).name || 'unknown';
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n5. Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n✅ Deployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log("==================");
  console.log(`MRT Token:      ${mrtTokenAddress}`);
  console.log(`Treasury:       ${treasuryAddress}`);
  console.log(`Oracle Manager: ${oracleManagerAddress}`);
  
  // 如果在测试网络上，提供一些有用的信息
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 5001n || network.chainId === 5000n) { // Mantle testnet or mainnet
    console.log("\n📝 Next Steps:");
    console.log("1. Verify contracts on Mantle Explorer");
    console.log("2. Set up Oracle nodes");
    console.log("3. Configure Treasury parameters");
    console.log("4. Test token minting and revenue distribution");
  }
}

// 错误处理
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });