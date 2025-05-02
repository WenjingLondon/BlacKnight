const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StrategyFactory", function () {
  let strategyFactory;
  let owner;
  let user;
  let mockToken;
  let aaveStrategy;
  let curveStrategy;
  let mockStrategy;
  let mockAavePoolProvider; // Mock dependency for AaveStrategy
  let mockCurvePool; // Mock dependency for CurveStrategy

  beforeEach(async function () {
    // Get signers
    [owner, user] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock Token", "MTK");
    await mockToken.waitForDeployment();

    // // --- Deploy Mock Dependencies ---
    // // Mock for Aave's IPoolAddressesProvider
    // const MockAavePoolProvider = await ethers.getContractFactory(
    //   "MockAavePoolAddressesProvider" // Replace with your actual mock if different
    // );
    // mockAavePoolProvider = await MockAavePoolProvider.deploy();
    // await mockAavePoolProvider.waitForDeployment();

    // // Mock for Curve Pool (assuming CurveStrategy needs a pool address)
    // const MockCurvePool = await ethers.getContractFactory(
    //   "MockCurvePool" // Replace with your actual mock if different
    // );
    // mockCurvePool = await MockCurvePool.deploy();
    // await mockCurvePool.waitForDeployment();
    // // --- End Mock Dependencies ---

    // Deploy strategies with mock dependencies
    // const AaveStrategy = await ethers.getContractFactory("AaveStrategy");
    // // Pass the mock provider address to AaveStrategy constructor
    // aaveStrategy = await AaveStrategy.deploy(
    //   "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
    // );
    // await aaveStrategy.waitForDeployment();

    // const CurveStrategy = await ethers.getContractFactory("CurveStrategy");
    // // Pass the mock pool address to CurveStrategy constructor (assuming this is needed)
    // curveStrategy = await CurveStrategy.deploy(
    //   "0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5"
    // );
    // await curveStrategy.waitForDeployment();

    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    mockStrategy = await MockStrategy.deploy();
    await mockStrategy.waitForDeployment();

    // Deploy StrategyFactory
    const StrategyFactory = await ethers.getContractFactory("StrategyFactory");
    strategyFactory = await StrategyFactory.deploy();
    await strategyFactory.waitForDeployment();
  });

  describe("Strategy Management", function () {
    it("should add a new strategy", async function () {
      await strategyFactory.addStrategy(mockToken.target, mockStrategy.target);
      expect(
        await strategyFactory.isValidStrategy(
          mockToken.target,
          mockStrategy.target
        )
      ).to.be.true;
    });

    it("should remove a strategy", async function () {
      await strategyFactory.addStrategy(mockToken.target, mockStrategy.target);
      await strategyFactory.removeStrategy(
        mockToken.target,
        mockStrategy.target
      );
      expect(
        await strategyFactory.isValidStrategy(
          mockToken.target,
          mockStrategy.target
        )
      ).to.be.false;
    });

    it("should revert when adding invalid strategy address", async function () {
      await expect(
        strategyFactory.addStrategy(mockToken.target, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid strategy address");
    });

    it("should revert when adding duplicate strategy", async function () {
      await strategyFactory.addStrategy(mockToken.target, mockStrategy.target);
      await expect(
        strategyFactory.addStrategy(mockToken.target, mockStrategy.target)
      ).to.be.revertedWith("Strategy already exists");
    });
  });

  describe("Best Strategy Selection", function () {
    beforeEach(async function () {
      // Add multiple strategies
      await strategyFactory.addStrategy(mockToken.target, mockStrategy.target);
      // await strategyFactory.addStrategy(mockToken.target, curveStrategy.target);

      // --- Mock APY returns for testing ---
      // You'll need to add functions to your Mock Strategies or real strategies
      // to control the APY they return for this test.
      // Example:
      // await aaveStrategy.setMockAPY(ethers.parseUnits("10", 16)); // Mock 10% APY (adjust units)
      // await curveStrategy.setMockAPY(ethers.parseUnits("5", 16));  // Mock 5% APY (adjust units)
      // --- End Mock APY ---
    });

    it("should return best strategy based on APY", async function () {
      // IMPORTANT: This test assumes you have mocked the getAPY function
      // in your strategies or mock strategies to control the return value.
      // By default, it might return 0 or a fixed value.
      // We'll assume AaveStrategy is mocked to return a higher APY here.
      const bestStrategy = await strategyFactory.getBestStrategy(
        mockToken.target
      );
      // Update this expectation based on your mocked APY values
      expect(bestStrategy).to.equal(mockStrategy.target); // Or curveStrategy.target if it has higher mock APY
    });

    it("should return zero address when no strategies exist for a token", async function () {
      // Deploy a different mock token that has no strategies registered
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const otherToken = await MockERC20.deploy("Other Token", "OTK");
      await otherToken.waitForDeployment();

      expect(await strategyFactory.getBestStrategy(otherToken.target)).to.equal(
        ethers.ZeroAddress
      );
    });
    // Add a test case for when APYs are equal? (Optional, depends on desired behavior)
  });

  describe("Events", function () {
    it("should emit StrategyAdded event", async function () {
      await expect(
        strategyFactory.addStrategy(mockToken.target, mockStrategy.target)
      )
        .to.emit(strategyFactory, "StrategyAdded")
        .withArgs(mockToken.target, mockStrategy.target);
    });

    it("should emit StrategyRemoved event", async function () {
      await strategyFactory.addStrategy(mockToken.target, mockStrategy.target);
      await expect(
        strategyFactory.removeStrategy(mockToken.target, mockStrategy.target)
      )
        .to.emit(strategyFactory, "StrategyRemoved")
        .withArgs(mockToken.target, mockStrategy.target);
    });
  });

  describe("Strategy Validation", function () {
    it("should correctly validate existing strategy", async function () {
      await strategyFactory.addStrategy(mockToken.target, mockStrategy.target);
      expect(
        await strategyFactory.isValidStrategy(
          mockToken.target,
          mockStrategy.target
        )
      ).to.be.true;
    });

    it("should correctly identify non-existing strategy", async function () {
      // Use a strategy address that hasn't been added
      expect(
        await strategyFactory.isValidStrategy(
          mockToken.target,
          mockStrategy.target
        )
      ).to.be.false;
    });
    it("should return false for zero address validation", async function () {
      expect(
        await strategyFactory.isValidStrategy(
          mockToken.target,
          ethers.ZeroAddress
        )
      ).to.be.false;
    });
  });
});
