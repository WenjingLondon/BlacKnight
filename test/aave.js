const { expect } = require("chai");
const { ethers } = require("hardhat");
const { JsonRpcProvider } = require("ethers");

const AAVE_DECIMALS = 18;

const { AAVE_STRATEGY_ADDRESS, AAVE_ADDRESS, ALCHEMY_KEY, PRIVATE_KEY } =
  process.env;

const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`;

const aaveStrategyJson = require("../artifacts/contracts/Strategies/AaveStrategy.sol/AaveStrategy.json");
const aaveStrategyAbi = aaveStrategyJson.abi;

describe("AaveStrategy - Sepolia", function () {
  this.timeout(180000); // 3 minutes

  let provider, wallet, token, aaveStrategy;

  before(async () => {
    provider = new JsonRpcProvider(rpcUrl);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    token = await ethers.getContractAt("IERC20", AAVE_ADDRESS, wallet);
    console.log("Token:", token.target);
    aaveStrategy = new ethers.Contract(
      AAVE_STRATEGY_ADDRESS,
      aaveStrategyAbi,
      wallet
    );

    const poolAddress = await aaveStrategy.aavePool();
    console.log("Pool Address in Contract:", poolAddress);

    const balance = await token.balanceOf(wallet.address);
    console.log(
      "User AAVE Balance:",
      ethers.formatUnits(balance, AAVE_DECIMALS)
    );

    const allowance = await token.allowance(
      wallet.address,
      AAVE_STRATEGY_ADDRESS
    );
    console.log("Allowance:", ethers.formatUnits(allowance, AAVE_DECIMALS));
    if (allowance < ethers.parseUnits("1", AAVE_DECIMALS)) {
      const tx = await token.approve(
        AAVE_STRATEGY_ADDRESS,
        ethers.parseUnits("100", AAVE_DECIMALS)
      );
      await tx.wait();
      console.log("AAVE approved to strategy");
    }
  });

  it("should deposit and withdraw via AaveStrategy", async () => {
    const depositAmount = ethers.parseUnits("1", AAVE_DECIMALS);

    const beforeBalance = await token.balanceOf(wallet.address);
    console.log(
      "Before Deposit:",
      ethers.formatUnits(beforeBalance, AAVE_DECIMALS)
    );

    const depositTx = await aaveStrategy.deposit(AAVE_ADDRESS, depositAmount);
    await depositTx.wait();
    console.log("Deposit successful");

    const strategyBalance = await aaveStrategy.getTotalBalance(AAVE_ADDRESS);
    console.log(
      "Strategy aToken Balance:",
      ethers.formatUnits(strategyBalance, AAVE_DECIMALS)
    );

    const poolAddress = await aaveStrategy.aavePool();
    console.log("Strategy aavePool address:", poolAddress);

    const strategyATokenBalance = await aaveStrategy.getTotalBalance(
      AAVE_ADDRESS
    );
    console.log(
      "Strategy aToken balance before withdraw:",
      ethers.formatUnits(strategyATokenBalance, AAVE_DECIMALS)
    );

    const aTokenAddress = await aaveStrategy.aTokens(AAVE_ADDRESS);
    console.log("aToken Address before withdraw:", aTokenAddress);

    const aToken = await ethers.getContractAt("IERC20", aTokenAddress, wallet);
    const aTokenBalance = await aToken.balanceOf(wallet.address);
    console.log(
      "aToken Balance before withdraw:",
      ethers.formatUnits(aTokenBalance, AAVE_DECIMALS)
    );

    const approveTx = await aToken.approve(
      AAVE_STRATEGY_ADDRESS,
      ethers.parseUnits("1", AAVE_DECIMALS)
    );
    await approveTx.wait();
    console.log("aToken approved to strategy");

    const withdrawTx = await aaveStrategy.withdraw(
      AAVE_ADDRESS,
      ethers.parseUnits("0.5", AAVE_DECIMALS)
    );
    await withdrawTx.wait();
    console.log("Withdrawal successful");

    const afterBalance = await token.balanceOf(wallet.address);
    console.log(
      "After Withdrawal:",
      ethers.formatUnits(afterBalance, AAVE_DECIMALS)
    );

    expect(afterBalance).to.be.closeTo(
      beforeBalance,
      ethers.parseUnits("0.5", AAVE_DECIMALS)
    );
  });
});
