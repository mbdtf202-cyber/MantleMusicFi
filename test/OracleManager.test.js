const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OracleManager", function () {
  let OracleManager;
  let oracleManager;
  let owner;
  let oracle1;
  let oracle2;
  let oracle3;
  let user1;
  let addrs;

  beforeEach(async function () {
    [owner, oracle1, oracle2, oracle3, user1, ...addrs] = await ethers.getSigners();

    OracleManager = await ethers.getContractFactory("OracleManager");
    oracleManager = await OracleManager.deploy();
    await oracleManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await oracleManager.hasRole(await oracleManager.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should have correct initial values", async function () {
      expect(await oracleManager.minOracleCount()).to.equal(1);
      expect(await oracleManager.maxPriceDeviation()).to.equal(1000); // 10%
      expect(await oracleManager.priceValidityPeriod()).to.equal(3600); // 1 hour
    });
  });

  describe("Oracle Management", function () {
    it("Should allow admin to add oracle", async function () {
      await oracleManager.addOracle(oracle1.address, "Oracle 1");
      
      const oracleData = await oracleManager.oracles(oracle1.address);
      expect(oracleData.isActive).to.equal(true);
      expect(oracleData.name).to.equal("Oracle 1");
      expect(await oracleManager.getActiveOracleCount()).to.equal(1);
    });

    it("Should not allow non-admin to add oracle", async function () {
      await expect(
        oracleManager.connect(user1).addOracle(oracle1.address, "Oracle 1")
      ).to.be.reverted;
    });

    it("Should allow admin to remove oracle", async function () {
      await oracleManager.addOracle(oracle1.address, "Oracle 1");
      await oracleManager.removeOracle(oracle1.address);
      
      const oracleData = await oracleManager.oracles(oracle1.address);
      expect(oracleData.isActive).to.equal(false);
      expect(await oracleManager.getActiveOracleCount()).to.equal(0);
    });

    it("Should not allow adding duplicate oracle", async function () {
      await oracleManager.addOracle(oracle1.address, "Oracle 1");
      
      await expect(
        oracleManager.addOracle(oracle1.address, "Oracle 1 Duplicate")
      ).to.be.revertedWith("Oracle already exists");
    });
  });

  describe("Price Feed", function () {
    beforeEach(async function () {
      await oracleManager.addOracle(oracle1.address, "Oracle 1");
      await oracleManager.addOracle(oracle2.address, "Oracle 2");
      await oracleManager.addOracle(oracle3.address, "Oracle 3");
    });

    it("Should allow oracle to update price", async function () {
      const price = ethers.parseEther("100");
      
      await oracleManager.connect(oracle1).updatePrice("BTC", price);
      
      const priceData = await oracleManager.getLatestPrice("BTC");
      expect(priceData.price).to.equal(price);
      expect(priceData.isValid).to.equal(true);
    });

    it("Should not allow non-oracle to update price", async function () {
      const price = ethers.parseEther("100");
      
      await expect(
        oracleManager.connect(user1).updatePrice("BTC", price)
      ).to.be.revertedWith("Not an active oracle");
    });

    it("Should aggregate prices from multiple oracles", async function () {
      const prices = [
        ethers.parseEther("100"),
        ethers.parseEther("102"),
        ethers.parseEther("98")
      ];

      await oracleManager.connect(oracle1).updatePrice("BTC", prices[0]);
      await oracleManager.connect(oracle2).updatePrice("BTC", prices[1]);
      await oracleManager.connect(oracle3).updatePrice("BTC", prices[2]);

      const aggregatedPrice = await oracleManager.getLatestPrice("BTC");
      // 应该是中位数 100
      expect(aggregatedPrice.price).to.equal(ethers.parseEther("100"));
    });

    it("Should handle price deviation validation", async function () {
      // 设置较小的偏差阈值
      await oracleManager.setMaxPriceDeviation(500); // 5%

      await oracleManager.connect(oracle1).updatePrice("BTC", ethers.parseEther("100"));
      
      // 尝试提交偏差过大的价格
      await expect(
        oracleManager.connect(oracle2).updatePrice("BTC", ethers.parseEther("120"))
      ).to.be.revertedWith("Price deviation too high");
    });

    it("Should allow batch price updates", async function () {
      const symbols = ["BTC", "ETH", "MNT"];
      const prices = [
        ethers.parseEther("100"),
        ethers.parseEther("4"),
        ethers.parseEther("0.5")
      ];

      await oracleManager.connect(oracle1).batchUpdatePrices(symbols, prices);

      for (let i = 0; i < symbols.length; i++) {
        const priceData = await oracleManager.getLatestPrice(symbols[i]);
        expect(priceData.price).to.equal(prices[i]);
      }
    });
  });

  describe("Royalty Data", function () {
    beforeEach(async function () {
      await oracleManager.addOracle(oracle1.address, "Oracle 1");
    });

    it("Should allow oracle to update royalty data", async function () {
      const royaltyData = {
        artist: "Test Artist",
        totalRevenue: ethers.parseEther("1000"),
        distributedAmount: ethers.parseEther("800"),
        timestamp: Math.floor(Date.now() / 1000)
      };

      await oracleManager.connect(oracle1).updateRoyaltyData(
        "song123",
        royaltyData.artist,
        royaltyData.totalRevenue,
        royaltyData.distributedAmount
      );

      const storedData = await oracleManager.getLatestRoyaltyData("song123");
      expect(storedData.artist).to.equal(royaltyData.artist);
      expect(storedData.totalRevenue).to.equal(royaltyData.totalRevenue);
      expect(storedData.distributedAmount).to.equal(royaltyData.distributedAmount);
    });

    it("Should validate royalty data", async function () {
      const isValid = await oracleManager.validateRoyaltyData(
        "song123",
        ethers.parseEther("1000"),
        ethers.parseEther("800")
      );
      expect(isValid).to.equal(true);

      // 测试无效数据（分配金额大于总收益）
      const isInvalid = await oracleManager.validateRoyaltyData(
        "song123",
        ethers.parseEther("800"),
        ethers.parseEther("1000")
      );
      expect(isInvalid).to.equal(false);
    });
  });

  describe("Historical Data", function () {
    beforeEach(async function () {
      await oracleManager.addOracle(oracle1.address, "Oracle 1");
    });

    it("Should store and retrieve historical price data", async function () {
      const prices = [
        ethers.parseEther("100"),
        ethers.parseEther("105"),
        ethers.parseEther("110")
      ];

      for (const price of prices) {
        await oracleManager.connect(oracle1).updatePrice("BTC", price);
        // 等待一秒以确保时间戳不同
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const historicalData = await oracleManager.getHistoricalPrices("BTC", 0, 10);
      expect(historicalData.length).to.equal(3);
      expect(historicalData[2].price).to.equal(prices[2]); // 最新的价格
    });

    it("Should store and retrieve historical royalty data", async function () {
      const royaltyUpdates = [
        { revenue: ethers.parseEther("1000"), distributed: ethers.parseEther("800") },
        { revenue: ethers.parseEther("1200"), distributed: ethers.parseEther("1000") },
        { revenue: ethers.parseEther("1500"), distributed: ethers.parseEther("1300") }
      ];

      for (const update of royaltyUpdates) {
        await oracleManager.connect(oracle1).updateRoyaltyData(
          "song123",
          "Test Artist",
          update.revenue,
          update.distributed
        );
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const historicalData = await oracleManager.getHistoricalRoyaltyData("song123", 0, 10);
      expect(historicalData.length).to.equal(3);
      expect(historicalData[2].totalRevenue).to.equal(royaltyUpdates[2].revenue);
    });
  });

  describe("Configuration", function () {
    it("Should allow admin to set minimum oracle count", async function () {
      await oracleManager.setMinOracleCount(3);
      expect(await oracleManager.minOracleCount()).to.equal(3);
    });

    it("Should allow admin to set max price deviation", async function () {
      await oracleManager.setMaxPriceDeviation(2000); // 20%
      expect(await oracleManager.maxPriceDeviation()).to.equal(2000);
    });

    it("Should allow admin to set price validity period", async function () {
      await oracleManager.setPriceValidityPeriod(7200); // 2 hours
      expect(await oracleManager.priceValidityPeriod()).to.equal(7200);
    });

    it("Should not allow setting invalid configurations", async function () {
      await expect(oracleManager.setMinOracleCount(0)).to.be.revertedWith("Invalid oracle count");
      await expect(oracleManager.setMaxPriceDeviation(10001)).to.be.revertedWith("Invalid deviation");
      await expect(oracleManager.setPriceValidityPeriod(0)).to.be.revertedWith("Invalid period");
    });
  });

  describe("Events", function () {
    beforeEach(async function () {
      await oracleManager.addOracle(oracle1.address, "Oracle 1");
    });

    it("Should emit OracleAdded event", async function () {
      await expect(oracleManager.addOracle(oracle2.address, "Oracle 2"))
        .to.emit(oracleManager, "OracleAdded")
        .withArgs(oracle2.address, "Oracle 2");
    });

    it("Should emit PriceUpdated event", async function () {
      const price = ethers.parseEther("100");
      
      await expect(oracleManager.connect(oracle1).updatePrice("BTC", price))
        .to.emit(oracleManager, "PriceUpdated")
        .withArgs("BTC", price, oracle1.address);
    });

    it("Should emit RoyaltyDataUpdated event", async function () {
      const revenue = ethers.parseEther("1000");
      const distributed = ethers.parseEther("800");
      
      await expect(
        oracleManager.connect(oracle1).updateRoyaltyData("song123", "Test Artist", revenue, distributed)
      ).to.emit(oracleManager, "RoyaltyDataUpdated")
        .withArgs("song123", "Test Artist", revenue, distributed, oracle1.address);
    });
  });

  describe("Access Control", function () {
    it("Should have correct role assignments", async function () {
      const adminRole = await oracleManager.DEFAULT_ADMIN_ROLE();
      const oracleRole = await oracleManager.ORACLE_ROLE();
      
      expect(await oracleManager.hasRole(adminRole, owner.address)).to.equal(true);
      
      await oracleManager.addOracle(oracle1.address, "Oracle 1");
      expect(await oracleManager.hasRole(oracleRole, oracle1.address)).to.equal(true);
    });

    it("Should allow role management", async function () {
      const oracleRole = await oracleManager.ORACLE_ROLE();
      
      await oracleManager.grantRole(oracleRole, user1.address);
      expect(await oracleManager.hasRole(oracleRole, user1.address)).to.equal(true);
      
      await oracleManager.revokeRole(oracleRole, user1.address);
      expect(await oracleManager.hasRole(oracleRole, user1.address)).to.equal(false);
    });
  });
});