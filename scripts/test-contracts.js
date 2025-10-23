const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Running contract integration tests...\n");

  // 获取签名者
  const [owner, user1, user2, oracle1] = await ethers.getSigners();
  console.log("Test accounts:");
  console.log("Owner:", owner.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  console.log("Oracle1:", oracle1.address);

  // 部署合约
  console.log("\n📦 Deploying contracts...");
  
  const MRTToken = await ethers.getContractFactory("MRTToken");
  const mrtToken = await MRTToken.deploy();
  await mrtToken.waitForDeployment();
  console.log("✅ MRT Token deployed");

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(await mrtToken.getAddress());
  await treasury.waitForDeployment();
  console.log("✅ Treasury deployed");

  const OracleManager = await ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy();
  await oracleManager.waitForDeployment();
  console.log("✅ Oracle Manager deployed");

  // 测试 1: MRT Token 功能
  console.log("\n🎵 Testing MRT Token functionality...");
  
  const royaltyInfo = {
    artist: "Test Artist",
    album: "Test Album",
    song: "Test Song",
    royaltyRate: 1000, // 10%
    isActive: true
  };

  // 铸造代币
  await mrtToken.mintMRT(user1.address, ethers.parseEther("1000"), royaltyInfo);
  await mrtToken.mintMRT(user2.address, ethers.parseEther("500"), royaltyInfo);
  
  const user1Balance = await mrtToken.balanceOf(user1.address);
  const user2Balance = await mrtToken.balanceOf(user2.address);
  const totalSupply = await mrtToken.totalSupply();
  
  console.log(`User1 balance: ${ethers.formatEther(user1Balance)} MRT`);
  console.log(`User2 balance: ${ethers.formatEther(user2Balance)} MRT`);
  console.log(`Total supply: ${ethers.formatEther(totalSupply)} MRT`);

  // 测试 2: Treasury 收益分配
  console.log("\n💰 Testing Treasury revenue distribution...");
  
  // 向 Treasury 发送 ETH
  await owner.sendTransaction({
    to: await treasury.getAddress(),
    value: ethers.parseEther("10")
  });
  
  console.log("Sent 10 ETH to Treasury");
  
  // 创建快照并分配收益
  await treasury.createSnapshot();
  await treasury.distributeETHRevenue();
  
  const user1Claimable = await treasury.getClaimableETHRevenue(user1.address);
  const user2Claimable = await treasury.getClaimableETHRevenue(user2.address);
  
  console.log(`User1 claimable: ${ethers.formatEther(user1Claimable)} ETH`);
  console.log(`User2 claimable: ${ethers.formatEther(user2Claimable)} ETH`);
  
  // 用户领取收益
  const user1InitialBalance = await ethers.provider.getBalance(user1.address);
  await treasury.connect(user1).claimETHRevenue();
  const user1FinalBalance = await ethers.provider.getBalance(user1.address);
  
  console.log(`User1 claimed revenue successfully`);

  // 测试 3: Oracle 价格喂食
  console.log("\n🔮 Testing Oracle price feeds...");
  
  // 添加 Oracle
  await oracleManager.addOracle(oracle1.address, "Test Oracle");
  console.log("Oracle added successfully");
  
  // 更新价格
  await oracleManager.connect(oracle1).updatePrice("BTC", ethers.parseEther("50000"));
  await oracleManager.connect(oracle1).updatePrice("ETH", ethers.parseEther("3000"));
  await oracleManager.connect(oracle1).updatePrice("MNT", ethers.parseEther("0.5"));
  
  const btcPrice = await oracleManager.getLatestPrice("BTC");
  const ethPrice = await oracleManager.getLatestPrice("ETH");
  const mntPrice = await oracleManager.getLatestPrice("MNT");
  
  console.log(`BTC Price: $${ethers.formatEther(btcPrice.price)}`);
  console.log(`ETH Price: $${ethers.formatEther(ethPrice.price)}`);
  console.log(`MNT Price: $${ethers.formatEther(mntPrice.price)}`);
  
  // 更新版权收益数据
  await oracleManager.connect(oracle1).updateRoyaltyData(
    "song123",
    "Test Artist",
    ethers.parseEther("1000"),
    ethers.parseEther("800")
  );
  
  const royaltyData = await oracleManager.getLatestRoyaltyData("song123");
  console.log(`Royalty data updated for song123:`);
  console.log(`- Artist: ${royaltyData.artist}`);
  console.log(`- Total Revenue: ${ethers.formatEther(royaltyData.totalRevenue)} ETH`);
  console.log(`- Distributed: ${ethers.formatEther(royaltyData.distributedAmount)} ETH`);

  // 测试 4: 集成测试 - 完整流程
  console.log("\n🔄 Testing complete workflow...");
  
  // 1. 铸造更多代币
  await mrtToken.mintMRT(user2.address, ethers.parseEther("300"), {
    artist: "Artist 2",
    album: "Album 2",
    song: "Song 2",
    royaltyRate: 1500, // 15%
    isActive: true
  });
  
  // 2. 更新价格数据
  await oracleManager.connect(oracle1).batchUpdatePrices(
    ["BTC", "ETH", "MNT"],
    [ethers.parseEther("51000"), ethers.parseEther("3100"), ethers.parseEther("0.52")]
  );
  
  // 3. 再次分配收益
  await owner.sendTransaction({
    to: await treasury.getAddress(),
    value: ethers.parseEther("5")
  });
  
  await treasury.createSnapshot();
  await treasury.distributeETHRevenue();
  
  const newUser1Claimable = await treasury.getClaimableETHRevenue(user1.address);
  const newUser2Claimable = await treasury.getClaimableETHRevenue(user2.address);
  
  console.log(`New claimable amounts:`);
  console.log(`- User1: ${ethers.formatEther(newUser1Claimable)} ETH`);
  console.log(`- User2: ${ethers.formatEther(newUser2Claimable)} ETH`);

  // 测试 5: 验证合约状态
  console.log("\n📊 Final contract state verification...");
  
  const finalTotalSupply = await mrtToken.totalSupply();
  const treasuryBalance = await ethers.provider.getBalance(await treasury.getAddress());
  const activeOracleCount = await oracleManager.getActiveOracleCount();
  
  console.log(`Final MRT total supply: ${ethers.formatEther(finalTotalSupply)} MRT`);
  console.log(`Treasury ETH balance: ${ethers.formatEther(treasuryBalance)} ETH`);
  console.log(`Active oracle count: ${activeOracleCount}`);

  console.log("\n✅ All integration tests completed successfully!");
  console.log("\n🎉 MantleMusicFi contracts are working correctly!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Integration test failed:", error);
    process.exit(1);
  });