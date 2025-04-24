const { expect } = require("chai");
const { ethers, parseEther } = require("hardhat");
const hre = require("hardhat");

describe("YieldAggregatorV1 MVP", function () {
  let owner, user, timelock;
  let token; // Represents USDT instance
  let aaveStrategy;
  let curveStrategy;
  let strategyFactory;
  let feeManager;
  let aggregator;

  beforeEach(async function () {
    this.timeout(180000);

    [owner, user, timelock] = await ethers.getSigners();
    console.log("--- Test Setup ---");
    console.log("Owner Address:", owner.address);
    console.log("User Address:", user.address);

    token = await ethers.getContractAt("IERC20", process.env.USDT_ADDRESS);
    console.log(`Attached to Sepolia USDT at: ${token.target}`);

    console.log(`Impersonating USDT whale: ${process.env.USDT_WHALE_ADDRESS}`);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [process.env.USDT_WHALE_ADDRESS],
    });
    const usdtWhaleSigner = await ethers.getSigner(
      process.env.USDT_WHALE_ADDRESS
    );

    const ethToSend = ethers.parseEther("1.0");
    console.log(
      `Setting ETH balance for whale ${process.env.USDT_WHALE_ADDRESS} on the fork...`
    );
    await hre.network.provider.send("hardhat_setBalance", [
      process.env.USDT_WHALE_ADDRESS,
      `0x${ethToSend.toString(16)}`,
    ]);

    const userTransferAmount = ethers.parseUnits(
      "1000",
      process.env.USDT_DECIMALS
    );
    console.log(
      `Transferring ${ethers.formatUnits(
        userTransferAmount,
        process.env.USDT_DECIMALS
      )} USDT from whale to user ${user.address}...`
    );
    const whaleBalance = await token.balanceOf(usdtWhaleSigner.address);
    if (whaleBalance < userTransferAmount) {
      console.warn(
        `Whale ${process.env.USDT_WHALE_ADDRESS} balance (${ethers.formatUnits(
          whaleBalance,
          process.env.USDT_DECIMALS
        )}) might be too low.`
      );
    }
    await token
      .connect(usdtWhaleSigner)
      .transfer(user.address, userTransferAmount);

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [process.env.USDT_WHALE_ADDRESS],
    });
    const userBalanceAfter = await token.balanceOf(user.address);
    console.log(
      `User USDT balance after transfer: ${ethers.formatUnits(
        userBalanceAfter,
        process.env.USDT_DECIMALS
      )}`
    );
    expect(userBalanceAfter, "User did not receive USDT").to.be.gte(
      userTransferAmount
    );

    const AaveStrategyFactory = await ethers.getContractFactory("AaveStrategy");
    aaveStrategy = await AaveStrategyFactory.deploy(
      process.env.AAVE_V3_ADDRESS
    );
    await aaveStrategy.waitForDeployment();
    console.log(`AaveStrategy deployed at: ${aaveStrategy.target}`);

    const CurveStrategyFactory = await ethers.getContractFactory(
      "CurveStrategy"
    );
    curveStrategy = await CurveStrategyFactory.deploy();
    await curveStrategy.waitForDeployment();
    console.log(`CurveStrategy deployed at: ${curveStrategy.target}`);

    const StrategyFactoryFactory = await ethers.getContractFactory(
      "StrategyFactory"
    );
    strategyFactory = await StrategyFactoryFactory.deploy();
    await strategyFactory.waitForDeployment();
    console.log(`StrategyFactory deployed at: ${strategyFactory.target}`);

    await strategyFactory.addStrategy(token.target, aaveStrategy.target);
    await strategyFactory.addStrategy(token.target, curveStrategy.target);

    const FeeManagerFactory = await ethers.getContractFactory("FeeManager");
    feeManager = await FeeManagerFactory.deploy(owner.address);
    await feeManager.waitForDeployment();
    console.log(`FeeManager deployed at: ${feeManager.target}`);

    const YieldAggregatorV1Factory = await ethers.getContractFactory(
      "YieldAggregatorV1"
    );
    aggregator = await YieldAggregatorV1Factory.deploy(
      timelock.address,
      strategyFactory.target,
      feeManager.target
    );
    await aggregator.waitForDeployment();
    console.log(`YieldAggregatorV1 deployed at: ${aggregator.target}`);

    const approveAmount = ethers.parseUnits("10000", process.env.USDT_DECIMALS);
    console.log(
      `User approving Aggregator (${
        aggregator.target
      }) to spend ${ethers.formatUnits(
        approveAmount,
        process.env.USDT_DECIMALS
      )} USDT...`
    );
    await token.connect(user).approve(aggregator.target, approveAmount);
    const allowance = await token.allowance(user.address, aggregator.target);
    expect(allowance, "Aggregator allowance is incorrect").to.equal(
      approveAmount
    );
    console.log("Approval successful.");
    console.log("--- Test Setup Complete ---");
  });

  it("user can deposit and withdraw via strategy", async () => {
    const decimals = process.env.USDT_DECIMALS;
    const initialBalance = await token.balanceOf(user.address);
    console.log(
      `Initial User Balance for test: ${ethers.formatUnits(
        initialBalance,
        decimals
      )}`
    );

    expect(
      initialBalance,
      "Initial balance should be a BigNumber/BigInt"
    ).to.be.a("bigint");

    const depositAmount = ethers.parseUnits("100", decimals);
    const withdrawAmount = ethers.parseUnits("50", decimals);

    const expectedFinalUserAmount =
      initialBalance - depositAmount + withdrawAmount;

    const expectedStrategyAmount = depositAmount - withdrawAmount;

    if (initialBalance < depositAmount) {
      expect.fail(
        `Insufficient initial USDT balance. User: ${ethers.formatUnits(
          initialBalance,
          decimals
        )}, Needs: ${ethers.formatUnits(depositAmount, decimals)}`
      );
    }

    await aggregator.connect(user).deposit(token.target, depositAmount);
    await aggregator.connect(user).withdraw(token.target, withdrawAmount);

    const finalUserBalance = await token.balanceOf(user.address);
    expect(finalUserBalance).to.equal(expectedFinalUserAmount);

    const aggregatorUserBalance = await aggregator.balances(
      user.address,
      token.target
    );
    expect(aggregatorUserBalance).to.equal(expectedStrategyAmount);
  });
});
