const { ethers } = require("hardhat");

async function main() {
  console.log("Starting step-by-step deployment...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MNT");

  // 检查余额是否足够
  const minBalance = ethers.parseEther("0.01"); // 至少需要 0.01 MNT
  if (balance < minBalance) {
    console.log("❌ Insufficient balance. Please get more test tokens from faucet.");
    console.log("Required: at least 0.01 MNT");
    console.log("Current:", ethers.formatEther(balance), "MNT");
    return;
  }

  try {
    // 步骤 1: 部署 MRT Token 合约
    console.log("\n🚀 Step 1: Deploying MRT Token...");
    const MRTToken = await ethers.getContractFactory("MRTToken");
    
    // 估算 gas
    const deployTx = await MRTToken.getDeployTransaction(deployer.address);
    const gasEstimate = await ethers.provider.estimateGas(deployTx);
    const gasPrice = await ethers.provider.getFeeData();
    const estimatedCost = gasEstimate * gasPrice.gasPrice;
    
    console.log("Estimated gas:", gasEstimate.toString());
    console.log("Estimated cost:", ethers.formatEther(estimatedCost), "MNT");
    
    if (balance < estimatedCost) {
      console.log("❌ Insufficient balance for MRT Token deployment");
      return;
    }
    
    const mrtToken = await MRTToken.deploy(deployer.address);
    await mrtToken.waitForDeployment();
    const mrtTokenAddress = await mrtToken.getAddress();
    console.log("✅ MRT Token deployed to:", mrtTokenAddress);

    // 更新余额
    const newBalance = await ethers.provider.getBalance(deployer.address);
    console.log("Remaining balance:", ethers.formatEther(newBalance), "MNT");

    // 保存部署信息
    const deploymentInfo = {
      network: "mantleTestnet",
      deployer: deployer.address,
      contracts: {
        MRTToken: mrtTokenAddress
      },
      timestamp: new Date().toISOString()
    };

    console.log("\n📄 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Suggestion: Get more test tokens from:");
      console.log("- https://faucet.sepolia.mantle.xyz/");
      console.log("- https://faucets.chain.link/mantle-sepolia");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });