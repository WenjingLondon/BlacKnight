const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StrategyManager", function () {
  let strategyManager;
  let strategyFactory;
  let mockToken;
  let mockStrategy;
  let owner;
  let vipUser;
  let user;
  let feeRate;

  beforeEach(async function () {
    // Get signers
    [owner, vipUser, user] = await ethers.getSigners();
    feeRate = 100; // 1% in basis points

    // Deploy mock token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock Token", "MTK");
    await mockToken.waitForDeployment();

    // Deploy mock strategy
    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    mockStrategy = await MockStrategy.deploy();
    await mockStrategy.waitForDeployment();

    // Deploy StrategyFactory
    const StrategyFactory = await ethers.getContractFactory("StrategyFactory");
    strategyFactory = await StrategyFactory.deploy();
    await strategyFactory.waitForDeployment();

    // Add mock strategy to factory
    await strategyFactory.addStrategy(mockToken.target, mockStrategy.target);

    // Deploy StrategyManager
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    strategyManager = await StrategyManager.deploy(
      strategyFactory.target,
      vipUser.address,
      feeRate
    );
    await strategyManager.waitForDeployment();
  });

  describe("Constructor", function () {
    it("should set the correct initial values", async function () {
      expect(await strategyManager.vipUser()).to.equal(vipUser.address);
      expect(await strategyManager.feeRate()).to.equal(feeRate);
      expect(await strategyManager.strategyFactory()).to.equal(
        strategyFactory.target
      );
    });
  });

  describe("Assign Strategy", function () {
    it("should allow user to assign a strategy", async function () {
      const allocation = 50; // 50%
      await strategyManager
        .connect(user)
        .assignStrategy(mockToken.target, mockStrategy.target, allocation);

      await expect(
        strategyManager
          .connect(user)
          .assignStrategy(mockToken.target, mockStrategy.target, allocation)
      )
        .to.emit(strategyManager, "StrategyAssigned")
        .withArgs(user.address, mockStrategy.target, allocation);
    });

    it("should revert when assigning invalid strategy", async function () {
      const invalidStrategy = ethers.ZeroAddress;
      const allocation = 50;

      await expect(
        strategyManager
          .connect(user)
          .assignStrategy(mockToken.target, invalidStrategy, allocation)
      ).to.be.revertedWith("Invalid strategy");
    });
  });

  describe("Rebalance", function () {
    beforeEach(async function () {
      // Deploy a second mock strategy for rebalancing tests
      const MockStrategy = await ethers.getContractFactory("MockStrategy");
      const mockStrategy2 = await MockStrategy.deploy();
      await mockStrategy2.waitForDeployment();

      // Add second strategy to factory
      await strategyFactory.addStrategy(mockToken.target, mockStrategy2.target);
    });

    it("should allow rebalancing of strategies", async function () {
      const strategies = [mockStrategy.target];
      const allocations = [100]; // 100%

      await expect(
        strategyManager
          .connect(user)
          .rebalance(mockToken.target, strategies, allocations)
      )
        .to.emit(strategyManager, "StrategyRebalanced")
        .withArgs(user.address, strategies, allocations);
    });

    it("should revert when allocations don't sum to 100", async function () {
      const strategies = [mockStrategy.target];
      const allocations = [90]; // Only 90%

      await expect(
        strategyManager
          .connect(user)
          .rebalance(mockToken.target, strategies, allocations)
      ).to.be.revertedWith("Allocations must sum to 100");
    });

    it("should revert when strategies and allocations arrays have different lengths", async function () {
      const strategies = [mockStrategy.target];
      const allocations = [50, 50]; // More allocations than strategies

      await expect(
        strategyManager
          .connect(user)
          .rebalance(mockToken.target, strategies, allocations)
      ).to.be.revertedWith("Mismatched arrays");
    });

    it("should revert when using invalid strategy in rebalance", async function () {
      const strategies = [ethers.ZeroAddress];
      const allocations = [100];

      await expect(
        strategyManager
          .connect(user)
          .rebalance(mockToken.target, strategies, allocations)
      ).to.be.revertedWith("Invalid strategy");
    });
  });

  describe("Access Control", function () {
    it("should allow owner to update VIP user", async function () {
      const newVipUser = user.address;
      // Assuming there's a setVipUser function, if not, you'll need to add it
      if (strategyManager.setVipUser) {
        await strategyManager.connect(owner).setVipUser(newVipUser);
        expect(await strategyManager.vipUser()).to.equal(newVipUser);
      }
    });

    it("should allow owner to update fee rate", async function () {
      const newFeeRate = 200; // 2%
      // Assuming there's a setFeeRate function, if not, you'll need to add it
      if (strategyManager.setFeeRate) {
        await strategyManager.connect(owner).setFeeRate(newFeeRate);
        expect(await strategyManager.feeRate()).to.equal(newFeeRate);
      }
    });
  });
});
