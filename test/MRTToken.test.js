const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MRTToken", function () {
  let MRTToken;
  let mrtToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // 获取合约工厂和签名者
    MRTToken = await ethers.getContractFactory("MRTToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // 部署合约
    mrtToken = await MRTToken.deploy();
    await mrtToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await mrtToken.hasRole(await mrtToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should have correct name and symbol", async function () {
      expect(await mrtToken.name()).to.equal("Music Royalty Token");
      expect(await mrtToken.symbol()).to.equal("MRT");
    });

    it("Should have 18 decimals", async function () {
      expect(await mrtToken.decimals()).to.equal(18);
    });

    it("Should have zero initial supply", async function () {
      expect(await mrtToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow admin to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      const royaltyInfo = {
        artist: "Test Artist",
        album: "Test Album",
        song: "Test Song",
        royaltyRate: 1000, // 10%
        isActive: true
      };

      await mrtToken.mintMRT(addr1.address, amount, royaltyInfo);
      
      expect(await mrtToken.balanceOf(addr1.address)).to.equal(amount);
      expect(await mrtToken.totalSupply()).to.equal(amount);
    });

    it("Should not allow non-admin to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      const royaltyInfo = {
        artist: "Test Artist",
        album: "Test Album",
        song: "Test Song",
        royaltyRate: 1000,
        isActive: true
      };

      await expect(
        mrtToken.connect(addr1).mintMRT(addr2.address, amount, royaltyInfo)
      ).to.be.reverted;
    });

    it("Should allow batch minting", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.parseEther("500"), ethers.parseEther("300")];
      const royaltyInfos = [
        {
          artist: "Artist 1",
          album: "Album 1",
          song: "Song 1",
          royaltyRate: 1000,
          isActive: true
        },
        {
          artist: "Artist 2",
          album: "Album 2",
          song: "Song 2",
          royaltyRate: 1500,
          isActive: true
        }
      ];

      await mrtToken.batchMintMRT(recipients, amounts, royaltyInfos);

      expect(await mrtToken.balanceOf(addr1.address)).to.equal(amounts[0]);
      expect(await mrtToken.balanceOf(addr2.address)).to.equal(amounts[1]);
    });
  });

  describe("Royalty Management", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      const royaltyInfo = {
        artist: "Test Artist",
        album: "Test Album",
        song: "Test Song",
        royaltyRate: 1000,
        isActive: true
      };
      await mrtToken.mintMRT(addr1.address, amount, royaltyInfo);
    });

    it("Should allow updating royalty info", async function () {
      const newRoyaltyInfo = {
        artist: "Updated Artist",
        album: "Updated Album",
        song: "Updated Song",
        royaltyRate: 1500,
        isActive: true
      };

      await mrtToken.updateRoyaltyInfo(addr1.address, newRoyaltyInfo);
      
      const updatedInfo = await mrtToken.getRoyaltyInfo(addr1.address);
      expect(updatedInfo.artist).to.equal("Updated Artist");
      expect(updatedInfo.royaltyRate).to.equal(1500);
    });

    it("Should allow setting token active status", async function () {
      await mrtToken.setTokenActive(addr1.address, false);
      
      const royaltyInfo = await mrtToken.getRoyaltyInfo(addr1.address);
      expect(royaltyInfo.isActive).to.equal(false);
    });
  });

  describe("Pausable", function () {
    it("Should allow admin to pause and unpause", async function () {
      await mrtToken.pause();
      expect(await mrtToken.paused()).to.equal(true);

      await mrtToken.unpause();
      expect(await mrtToken.paused()).to.equal(false);
    });

    it("Should prevent transfers when paused", async function () {
      const amount = ethers.parseEther("1000");
      const royaltyInfo = {
        artist: "Test Artist",
        album: "Test Album",
        song: "Test Song",
        royaltyRate: 1000,
        isActive: true
      };
      await mrtToken.mintMRT(addr1.address, amount, royaltyInfo);

      await mrtToken.pause();
      
      await expect(
        mrtToken.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      const royaltyInfo = {
        artist: "Test Artist",
        album: "Test Album",
        song: "Test Song",
        royaltyRate: 1000,
        isActive: true
      };
      await mrtToken.mintMRT(addr1.address, amount, royaltyInfo);
    });

    it("Should allow token holders to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      const initialBalance = await mrtToken.balanceOf(addr1.address);
      
      await mrtToken.connect(addr1).burn(burnAmount);
      
      expect(await mrtToken.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should allow admin to burn from any account", async function () {
      const burnAmount = ethers.parseEther("100");
      const initialBalance = await mrtToken.balanceOf(addr1.address);
      
      await mrtToken.burnFrom(addr1.address, burnAmount);
      
      expect(await mrtToken.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
    });
  });

  describe("Events", function () {
    it("Should emit RoyaltyInfoUpdated event", async function () {
      const amount = ethers.parseEther("1000");
      const royaltyInfo = {
        artist: "Test Artist",
        album: "Test Album",
        song: "Test Song",
        royaltyRate: 1000,
        isActive: true
      };

      await expect(mrtToken.mintMRT(addr1.address, amount, royaltyInfo))
        .to.emit(mrtToken, "RoyaltyInfoUpdated")
        .withArgs(addr1.address, "Test Artist", "Test Album", "Test Song", 1000);
    });

    it("Should emit TokenActiveStatusChanged event", async function () {
      const amount = ethers.parseEther("1000");
      const royaltyInfo = {
        artist: "Test Artist",
        album: "Test Album",
        song: "Test Song",
        royaltyRate: 1000,
        isActive: true
      };
      await mrtToken.mintMRT(addr1.address, amount, royaltyInfo);

      await expect(mrtToken.setTokenActive(addr1.address, false))
        .to.emit(mrtToken, "TokenActiveStatusChanged")
        .withArgs(addr1.address, false);
    });
  });
});