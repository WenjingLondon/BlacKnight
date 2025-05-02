const { expect } = require("chai");
const { ethers } = require("hardhat");
const { JsonRpcProvider } = require("ethers");

// Contract addresses from environment variables
const {
  AGGREGATOR_ADDRESS,
  AAVE_STRATEGY_ADDRESS,
  CURVE_STRATEGY_ADDRESS,
  STRATEGY_FACTORY_ADDRESS,
  FEE_MANAGER_ADDRESS,
  AAVE_ADDRESS,
  ALCHEMY_KEY,
  PRIVATE_KEY,
} = process.env;

const AAVE_DECIMALS = 8;

// Load contract ABIs
const aggregatorJson = require("../artifacts/contracts/core/YieldAggregatorV1.sol/YieldAggregatorV1.json");
const aggregatorAbi = aggregatorJson.abi;

const aaveStrategyJson = require("../artifacts/contracts/Strategies/AaveStrategy.sol/AaveStrategy.json");
const aaveStrategyAbi = aaveStrategyJson.abi;

const curveStrategyJson = require("../artifacts/contracts/Strategies/CurveStrategy.sol/CurveStrategy.json");
const curveStrategyAbi = curveStrategyJson.abi;

const strategyFactoryJson = require("../artifacts/contracts/Strategies/StrategyFactory.sol/StrategyFactory.json");
const strategyFactoryAbi = strategyFactoryJson.abi;

const feeManagerJson = require("../artifacts/contracts/core/FeeManager.sol/FeeManager.json");
const feeManagerAbi = feeManagerJson.abi;

// RPC URL with Alchemy key
const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;

describe("YieldAggregatorV1 Sepolia Test", function () {
  // Increase timeout for Sepolia network
  this.timeout(180000); // 3 minutes

  let wallet,
    token,
    curveToken,
    strategyFactory,
    feeManager,
    aggregator,
    aaveStrategy,
    curveStrategy;
  let provider;

  before(async () => {
    provider = new JsonRpcProvider(rpcUrl);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    token = await ethers.getContractAt("IERC20", AAVE_ADDRESS, wallet);
    console.log("Token:", token.target);

    aggregator = new ethers.Contract(AGGREGATOR_ADDRESS, aggregatorAbi, wallet);
    console.log("Aggregator:", aggregator.target);

    aaveStrategy = new ethers.Contract(
      AAVE_STRATEGY_ADDRESS,
      aaveStrategyAbi,
      wallet
    );
    console.log("Aave Strategy:", aaveStrategy.target);

    // curveStrategy = new ethers.Contract(
    //   CURVE_STRATEGY_ADDRESS,
    //   curveStrategyAbi,
    //   wallet
    // );
    // console.log("Curve Strategy:", curveStrategy.target);

    strategyFactory = new ethers.Contract(
      STRATEGY_FACTORY_ADDRESS,
      strategyFactoryAbi,
      wallet
    );
    console.log("Strategy Factory:", strategyFactory.target);

    feeManager = new ethers.Contract(
      FEE_MANAGER_ADDRESS,
      feeManagerAbi,
      wallet
    );
    console.log("Fee Manager:", feeManager.target);

    const balance = await token.balanceOf(wallet.address);
    console.log(
      "User AAVE Balance:",
      ethers.formatUnits(balance, AAVE_DECIMALS)
    );

    const allowance = await token.allowance(wallet.address, AGGREGATOR_ADDRESS);
    console.log("Allowance:", ethers.formatUnits(allowance, AAVE_DECIMALS));

    if (allowance < ethers.parseUnits("1", AAVE_DECIMALS)) {
      const tx = await token.approve(
        AGGREGATOR_ADDRESS,
        ethers.parseUnits("1", AAVE_DECIMALS)
      );
      await tx.wait();
      console.log("AAVE approved to aggregator");
    }

    //Add Aave Strategy
    try {
      await strategyFactory.addStrategy(token.target, aaveStrategy.target);
      console.log("Aave strategy added");
    } catch (error) {
      console.log("Failed to add Aave strategy:", error.message);
    }

    //Add USDT Strategy
    // try {
    //   await strategyFactory.addStrategy(
    //     "0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0",
    //     aaveStrategy.target
    //   );
    //   console.log("USDT strategy added");
    // } catch (error) {
    //   console.log("Failed to add USDT strategy:", error.message);
    // }

    //Check if Aave strategy is valid
    const isAaveValid = await strategyFactory.isValidStrategy(
      token.target,
      aaveStrategy.target
    );
    console.log("Is Aave strategy valid:", isAaveValid);

    const isUSDTValid = await strategyFactory.isValidStrategy(
      "0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0",
      aaveStrategy.target
    );
    console.log("Is USDT strategy valid:", isUSDTValid);
  });

  it("should check strategy APYs", async () => {
    try {
      // Check Aave APY
      const aaveAPY = await aaveStrategy.getAPY(AAVE_ADDRESS);
      console.log(`Aave APY: ${aaveAPY}`);

      // Get best strategy
      const bestStrategy = await strategyFactory.getBestStrategy(AAVE_ADDRESS);
      console.log(`Best strategy: ${bestStrategy}`);
    } catch (error) {
      console.error("APY check failed:", error);
    }
  });

  it("should deposit and withdraw via AaveStrategy", async () => {
    const depositAmount = ethers.parseUnits("0.01", AAVE_DECIMALS);

    const beforeBalance = await token.balanceOf(wallet.address);
    console.log(
      "Before Deposit:",
      ethers.formatUnits(beforeBalance, AAVE_DECIMALS)
    );

    const depositTx = await aggregator.deposit(AAVE_ADDRESS, depositAmount);
    await depositTx.wait();
    console.log("Deposit successful");

    const afterBalance = await token.balanceOf(wallet.address);
    console.log(
      "After Deposit:",
      ethers.formatUnits(afterBalance, AAVE_DECIMALS)
    );

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

    const aTokenBalanceAggregator = await aToken.balanceOf(aggregator.target);
    console.log(
      "aToken Balance in aggregator:",
      ethers.formatUnits(aTokenBalanceAggregator, AAVE_DECIMALS)
    );

    const approveTx = await aToken.approve(
      AAVE_STRATEGY_ADDRESS,
      ethers.parseUnits("0.01", AAVE_DECIMALS)
    );
    await approveTx.wait();
    console.log("aToken approved to strategy");

    const withdrawTx = await aaveStrategy.withdraw(
      AAVE_ADDRESS,
      ethers.parseUnits("0.005", AAVE_DECIMALS)
    );
    await withdrawTx.wait();
    console.log("Withdrawal successful");

    const afterWithdrawalBalance = await token.balanceOf(wallet.address);
    console.log(
      "After Withdrawal:",
      ethers.formatUnits(afterWithdrawalBalance, AAVE_DECIMALS)
    );
  });
  // before(async () => {
  //   // Setup provider and wallet
  //   provider = new JsonRpcProvider(rpcUrl);
  //   owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  //   console.log("Owner address:", owner.address);

  //   // Get USDT token contract
  //   token = await ethers.getContractAt("IERC20", AAVE_ADDRESS, wallet);
  //   console.log("Token:", token.target);

  //   // Get contract instances
  //   aggregator = new ethers.Contract(AGGREGATOR_ADDRESS, aggregatorAbi, owner);
  //   console.log("Aggregator address:", aggregator.target);

  //   aaveStrategy = new ethers.Contract(
  //     AAVE_STRATEGY_ADDRESS,
  //     aaveStrategyAbi,
  //     owner
  //   );
  //   console.log("Aave Strategy address:", aaveStrategy.target);

  //   strategyFactory = new ethers.Contract(
  //     STRATEGY_FACTORY_ADDRESS,
  //     strategyFactoryAbi,
  //     owner
  //   );
  //   console.log("Strategy Factory address:", strategyFactory.target);

  //   feeManager = new ethers.Contract(FEE_MANAGER_ADDRESS, feeManagerAbi, owner);
  //   console.log("Fee Manager address:", feeManager.target);

  //   // Check token balance
  //   const balance = await token.balanceOf(owner.address);
  //   console.log(
  //     `Token balance: ${ethers.formatUnits(balance, AAVE_DECIMALS)} AAVE`
  //   );

  //   // Remove strategies first
  //   console.log("Removing strategies...");

  //   try {
  //     // Remove Aave strategy if it exists
  //     // try {
  //     //   await strategyFactory.removeStrategy(
  //     //     token.target,
  //     //     aaveStrategy.target,
  //     //     {
  //     //       gasLimit: 200000,
  //     //     }
  //     //   );
  //     //   console.log("Aave strategy removed");
  //     // } catch (error) {
  //     //   console.log(error);
  //     //   console.log("Failed to remove Aave strategy or it doesn't exist");
  //     // }

  //     // Add strategies back
  //     console.log("Adding strategies...");

  //     // Add Aave strategy
  //     try {
  //       await strategyFactory.addStrategy(token.target, aaveStrategy.target);
  //       console.log("Aave strategy added");
  //     } catch (error) {
  //       console.log("Failed to add Aave strategy:", error.message);
  //     }

  //     // Check if strategies are valid
  //     const isAaveValid = await strategyFactory.isValidStrategy(
  //       token.target,
  //       aaveStrategy.target
  //     );

  //     console.log("Is Aave strategy valid:", isAaveValid);

  //     // // Check best strategy
  //     const bestStrategy = await strategyFactory.getBestStrategy(token.target);
  //     console.log("Best strategy:", bestStrategy);

  //     // Check token allowance and approve if needed
  //     const currentAllowance = await token.allowance(
  //       owner.address,
  //       aggregator.target
  //     );
  //     console.log(
  //       `Current allowance: ${ethers.formatUnits(
  //         currentAllowance,
  //         tokenDecimals
  //       )} USDT`
  //     );

  //     if (currentAllowance < ethers.parseUnits("0", AAVE_DECIMALS)) {
  //       console.log("Approving tokens to aggregator...");

  //       const tx = await token.approve(
  //         aggregator.target,
  //         ethers.parseUnits("1", AAVE_DECIMALS)
  //       );

  //       await tx.wait();
  //       console.log("Token approval completed");

  //       const newAllowance = await token.allowance(
  //         owner.address,
  //         aggregator.target
  //       );
  //       console.log(
  //         `New allowance: ${ethers.formatUnits(
  //           newAllowance,
  //           tokenDecimals
  //         )} USDT`
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error in before hook:", error);
  //   }
  // });

  // it("should check strategy balances", async () => {
  //   try {
  //     // Check Aave strategy balance
  //     const aaveBalance = await aaveStrategy.getTotalBalance(token.target);
  //     console.log(
  //       `Aave strategy balance: ${ethers.formatUnits(
  //         aaveBalance,
  //         tokenDecimals
  //       )} USDT`
  //     );
  //     // Check user balance in aggregator
  //     const userBalance = await aggregator.balances(
  //       owner.address,
  //       token.target
  //     );
  //     console.log(
  //       `User balance in aggregator: ${ethers.formatUnits(
  //         userBalance,
  //         tokenDecimals
  //       )} USDT`
  //     );
  //   } catch (error) {
  //     console.error("Balance check failed:", error);
  //   }
  // });

  // it("should check strategy APYs", async () => {
  //   try {
  //     // Check Aave APY
  //     const aaveAPY = await aaveStrategy.getAPY(token.target);
  //     console.log(`Aave APY: ${aaveAPY}`);

  //     // Get best strategy
  //     const bestStrategy = await strategyFactory.getBestStrategy(token.target);
  //     console.log(`Best strategy: ${bestStrategy}`);
  //   } catch (error) {
  //     console.error("APY check failed:", error);
  //   }
  // });

  // it("user can withdraw via strategy", async () => {
  //   try {
  //     // Check if token is supported
  //     // const isSupported = await aggregator.isSupportedToken(token.target);

  //     // if (!isSupported) {
  //     //   console.log("Token is not supported in aggregator. Skipping test.");
  //     //   return;
  //     // }

  //     // Check initial balances
  //     const initialTokenBalance = await token.balanceOf(owner.address);
  //     const initialAggregatorBalance = await aggregator.balances(
  //       owner.address,
  //       token.target
  //     );

  //     console.log(
  //       `Initial token balance: ${ethers.formatUnits(
  //         initialTokenBalance,
  //         tokenDecimals
  //       )} USDT`
  //     );
  //     console.log(
  //       `Initial aggregator balance: ${ethers.formatUnits(
  //         initialAggregatorBalance,
  //         tokenDecimals
  //       )} USDT`
  //     );

  //     // If user has balance in aggregator, try to withdraw
  //     if (initialAggregatorBalance > 0n) {
  //       console.log("User has balance in aggregator. Attempting withdrawal...");

  //       // Withdraw half of the balance
  //       const withdrawAmount = initialAggregatorBalance / 2n;
  //       console.log(
  //         `Withdrawing ${ethers.formatUnits(
  //           withdrawAmount,
  //           tokenDecimals
  //         )} USDT`
  //       );

  //       const tx = await aggregator.withdraw(token.target, withdrawAmount, {
  //         gasLimit: 500000,
  //       });

  //       console.log("Withdrawal transaction sent:", tx.hash);
  //       const receipt = await tx.wait();
  //       console.log("Withdrawal confirmed in block:", receipt.blockNumber);

  //       // Check updated balances
  //       const newTokenBalance = await token.balanceOf(owner.address);
  //       const newAggregatorBalance = await aggregator.balances(
  //         owner.address,
  //         token.target
  //       );

  //       console.log(
  //         `New token balance: ${ethers.formatUnits(
  //           newTokenBalance,
  //           tokenDecimals
  //         )} USDT`
  //       );
  //       console.log(
  //         `New aggregator balance: ${ethers.formatUnits(
  //           newAggregatorBalance,
  //           tokenDecimals
  //         )} USDT`
  //       );

  //       // Verify balances changed correctly
  //       expect(newTokenBalance).to.be.greaterThan(initialTokenBalance);
  //       expect(newAggregatorBalance).to.be.lessThan(initialAggregatorBalance);
  //     } else {
  //       console.log(
  //         "User has no balance in aggregator. Attempting deposit first..."
  //       );

  //       // Deposit a small amount
  //       const depositAmount = ethers.parseUnits("10", tokenDecimals);
  //       console.log(
  //         `Depositing ${ethers.formatUnits(depositAmount, tokenDecimals)} USDT`
  //       );

  //       try {
  //         const depositTx = await aggregator.deposit(
  //           token.target,
  //           depositAmount,
  //           {
  //             gasLimit: 500000,
  //           }
  //         );

  //         console.log("Deposit transaction sent:", depositTx.hash);
  //         const depositReceipt = await depositTx.wait();
  //         console.log(
  //           "Deposit confirmed in block:",
  //           depositReceipt.blockNumber
  //         );

  //         // Check updated balance after deposit
  //         const depositedBalance = await aggregator.balances(
  //           owner.address,
  //           token.target
  //         );
  //         console.log(
  //           `Deposited balance: ${ethers.formatUnits(
  //             depositedBalance,
  //             tokenDecimals
  //           )} USDT`
  //         );

  //         // Now withdraw half
  //         const withdrawAmount = depositedBalance / 2n;
  //         console.log(
  //           `Withdrawing ${ethers.formatUnits(
  //             withdrawAmount,
  //             tokenDecimals
  //           )} USDT`
  //         );

  //         const withdrawTx = await aggregator.withdraw(
  //           token.target,
  //           withdrawAmount,
  //           {
  //             gasLimit: 500000,
  //           }
  //         );

  //         console.log("Withdrawal transaction sent:", withdrawTx.hash);
  //         const withdrawReceipt = await withdrawTx.wait();
  //         console.log(
  //           "Withdrawal confirmed in block:",
  //           withdrawReceipt.blockNumber
  //         );

  //         // Check final balances
  //         const finalTokenBalance = await token.balanceOf(owner.address);
  //         const finalAggregatorBalance = await aggregator.balances(
  //           owner.address,
  //           token.target
  //         );

  //         console.log(
  //           `Final token balance: ${ethers.formatUnits(
  //             finalTokenBalance,
  //             tokenDecimals
  //           )} USDT`
  //         );
  //         console.log(
  //           `Final aggregator balance: ${ethers.formatUnits(
  //             finalAggregatorBalance,
  //             tokenDecimals
  //           )} USDT`
  //         );

  //         // Verify strategy balance
  //         const strategyBalance = await aaveStrategy.getTotalBalance(
  //           token.target
  //         );
  //         console.log(
  //           `Strategy balance: ${ethers.formatUnits(
  //             strategyBalance,
  //             tokenDecimals
  //           )} USDT`
  //         );
  //       } catch (error) {
  //         console.log("Deposit failed:", error.message);
  //         console.log(
  //           "This might be due to the token not being properly supported or the strategy not being configured correctly."
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Withdrawal test failed:", error);
  //   }
  // });

  // it("should debug contract state", async () => {
  //   try {
  //     // Check if token is supported
  //     // const isSupported = await aggregator.isSupportedToken(token.target);
  //     // console.log("Is token supported in aggregator:", isSupported);

  //     // Check if strategies are valid
  //     const isAaveValid = await strategyFactory.isValidStrategy(
  //       token.target,
  //       aaveStrategy.target
  //     );

  //     console.log("Is Aave strategy valid:", isAaveValid);

  //     // Get best strategy
  //     const bestStrategy = await strategyFactory.getBestStrategy(token.target);
  //     console.log("Best strategy:", bestStrategy);

  //     // Check if best strategy is zero address
  //     if (bestStrategy === ethers.ZeroAddress) {
  //       console.log(
  //         "WARNING: Best strategy is zero address. This will cause deposit to fail."
  //       );

  //       // Try to get APYs to understand why
  //       try {
  //         const aaveAPY = await aaveStrategy.getAPY(token.target);
  //         console.log(`Aave APY: ${aaveAPY}`);
  //       } catch (error) {
  //         console.log("Failed to get Aave APY:", error.message);
  //       }
  //     }

  //     // Check aggregator owner and timelock
  //     const aggregatorOwner = await aggregator.owner();
  //     const timelock = await aggregator.timelock();

  //     console.log("Aggregator owner:", aggregatorOwner);
  //     console.log("Timelock address:", timelock);

  //     // Check if current user is owner
  //     console.log(
  //       "Is current user the owner:",
  //       aggregatorOwner === owner.address
  //     );
  //     console.log("Is current user the timelock:", timelock === owner.address);
  //   } catch (error) {
  //     console.error("Debug failed:", error);
  //   }
  // });
});
