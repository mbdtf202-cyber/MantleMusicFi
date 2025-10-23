const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Treasury", function () {
  let Treasury;
  let treasury;
  let MRTToken;
  let mrtToken;
  let MockERC20;
  let mockToken;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;

  beforeEach(async function () {
    // 获取合约工厂和签名者
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // 部署 MRT 代币合约
    MRTToken = await ethers.getContractFactory("MRTToken");
    mrtToken = await MRTToken.deploy();
    await mrtToken.waitForDeployment();

    // 部署 Treasury 合约
    Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(await mrtToken.getAddress());
    await treasury.waitForDeployment();

    // 部署模拟 ERC20 代币用于测试
    MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock Token", "MOCK", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // 铸造一些 MRT 代币给测试地址
    const royaltyInfo = {
      artist: "Test Artist",
      album: "Test Album",
      song: "Test Song",
      royaltyRate: 1000,
      isActive: true
    };
    
    await mrtToken.mintMRT(addr1.address, ethers.parseEther("1000"), royaltyInfo);
    await mrtToken.mintMRT(addr2.address, ethers.parseEther("500"), royaltyInfo);
    await mrtToken.mintMRT(addr3.address, ethers.parseEther("300"), royaltyInfo);
  });

  describe("Deployment", function () {
    it("Should set the correct MRT token address", async function () {
      expect(await treasury.mrtToken()).to.equal(await mrtToken.getAddress());
    });

    it("Should set the right owner", async function () {
      expect(await treasury.hasRole(await treasury.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should have default fee rate of 5%", async function () {
      expect(await treasury.feeRate()).to.equal(500); // 5% = 500 basis points
    });
  });

  describe("ETH Revenue Distribution", function () {
    beforeEach(async function () {
      // 向 Treasury 发送一些 ETH
      await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: ethers.parseEther("10")
      });
    });

    it("Should receive ETH revenue", async function () {
      const balance = await ethers.provider.getBalance(await treasury.getAddress());
      expect(balance).to.equal(ethers.parseEther("10"));
    });

    it("Should distribute ETH revenue correctly", async function () {
      // 创建快照
      await treasury.createSnapshot();
      
      // 分配收益
      await treasury.distributeETHRevenue();

      // 检查分配是否正确（按持有比例）
      const totalSupply = await mrtToken.totalSupply();
      const addr1Balance = await mrtToken.balanceOf(addr1.address);
      const expectedRevenue = (ethers.parseEther("10") * BigInt(9500) / BigInt(10000)) * addr1Balance / totalSupply; // 扣除5%手续费
      
      const claimableRevenue = await treasury.getClaimableETHRevenue(addr1.address);
      expect(claimableRevenue).to.be.closeTo(expectedRevenue, ethers.parseEther("0.01"));
    });

    it("Should allow users to claim ETH revenue", async function () {
      await treasury.createSnapshot();
      await treasury.distributeETHRevenue();

      const initialBalance = await ethers.provider.getBalance(addr1.address);
      const claimableRevenue = await treasury.getClaimableETHRevenue(addr1.address);
      
      const tx = await treasury.connect(addr1).claimETHRevenue();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance).to.be.closeTo(initialBalance + claimableRevenue - gasUsed, ethers.parseEther("0.01"));
    });
  });

  describe("ERC20 Token Revenue Distribution", function () {
    beforeEach(async function () {
      // 向 Treasury 发送一些 ERC20 代币
      await mockToken.transfer(await treasury.getAddress(), ethers.parseEther("1000"));
    });

    it("Should distribute ERC20 revenue correctly", async function () {
      await treasury.createSnapshot();
      await treasury.distributeTokenRevenue(await mockToken.getAddress());

      const totalSupply = await mrtToken.totalSupply();
      const addr1Balance = await mrtToken.balanceOf(addr1.address);
      const expectedRevenue = (ethers.parseEther("1000") * BigInt(9500) / BigInt(10000)) * addr1Balance / totalSupply;
      
      const claimableRevenue = await treasury.getClaimableTokenRevenue(addr1.address, await mockToken.getAddress());
      expect(claimableRevenue).to.be.closeTo(expectedRevenue, ethers.parseEther("0.01"));
    });

    it("Should allow users to claim ERC20 revenue", async function () {
      await treasury.createSnapshot();
      await treasury.distributeTokenRevenue(await mockToken.getAddress());

      const initialBalance = await mockToken.balanceOf(addr1.address);
      const claimableRevenue = await treasury.getClaimableTokenRevenue(addr1.address, await mockToken.getAddress());
      
      await treasury.connect(addr1).claimTokenRevenue(await mockToken.getAddress());
      
      const finalBalance = await mockToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance + claimableRevenue);
    });
  });

  describe("Batch Distribution", function () {
    it("Should allow batch distribution to multiple addresses", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.parseEther("1"), ethers.parseEther("0.5")];

      await treasury.batchDistributeETH(recipients, amounts, { value: ethers.parseEther("1.5") });

      expect(await treasury.getClaimableETHRevenue(addr1.address)).to.equal(amounts[0]);
      expect(await treasury.getClaimableETHRevenue(addr2.address)).to.equal(amounts[1]);
    });
  });

  describe("Fee Management", function () {
    it("Should allow admin to set fee rate", async function () {
      await treasury.setFeeRate(1000); // 10%
      expect(await treasury.feeRate()).to.equal(1000);
    });

    it("Should not allow setting fee rate above 20%", async function () {
      await expect(treasury.setFeeRate(2001)).to.be.revertedWith("Fee rate too high");
    });

    it("Should allow admin to withdraw accumulated fees", async function () {
      // 发送 ETH 并分配
      await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: ethers.parseEther("10")
      });
      
      await treasury.createSnapshot();
      await treasury.distributeETHRevenue();

      const initialBalance = await ethers.provider.getBalance(owner.address);
      const accumulatedFees = await treasury.accumulatedETHFees();
      
      const tx = await treasury.withdrawAccumulatedETHFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.closeTo(initialBalance + accumulatedFees - gasUsed, ethers.parseEther("0.01"));
    });
  });

  describe("Pausable", function () {
    it("Should allow admin to pause and unpause", async function () {
      await treasury.pause();
      expect(await treasury.paused()).to.equal(true);

      await treasury.unpause();
      expect(await treasury.paused()).to.equal(false);
    });

    it("Should prevent distribution when paused", async function () {
      await treasury.pause();
      
      await expect(treasury.distributeETHRevenue()).to.be.reverted;
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow emergency ETH withdrawal", async function () {
      await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: ethers.parseEther("5")
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await treasury.getAddress());
      
      const tx = await treasury.emergencyWithdrawETH();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.closeTo(initialBalance + contractBalance - gasUsed, ethers.parseEther("0.01"));
    });

    it("Should allow emergency token withdrawal", async function () {
      await mockToken.transfer(await treasury.getAddress(), ethers.parseEther("100"));
      
      const initialBalance = await mockToken.balanceOf(owner.address);
      const contractBalance = await mockToken.balanceOf(await treasury.getAddress());
      
      await treasury.emergencyWithdrawToken(await mockToken.getAddress());
      
      const finalBalance = await mockToken.balanceOf(owner.address);
      expect(finalBalance).to.equal(initialBalance + contractBalance);
    });
  });

  describe("Events", function () {
    it("Should emit RevenueDistributed event", async function () {
      await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: ethers.parseEther("10")
      });
      
      await treasury.createSnapshot();
      
      await expect(treasury.distributeETHRevenue())
        .to.emit(treasury, "RevenueDistributed")
        .withArgs(ethers.ZeroAddress, ethers.parseEther("9.5")); // 扣除5%手续费后的金额
    });

    it("Should emit RevenueClaimed event", async function () {
      await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: ethers.parseEther("10")
      });
      
      await treasury.createSnapshot();
      await treasury.distributeETHRevenue();
      
      const claimableRevenue = await treasury.getClaimableETHRevenue(addr1.address);
      
      await expect(treasury.connect(addr1).claimETHRevenue())
        .to.emit(treasury, "RevenueClaimed")
        .withArgs(addr1.address, ethers.ZeroAddress, claimableRevenue);
    });
  });
});