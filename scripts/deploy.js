// scripts/deploy.js

const { ethers } = require("hardhat");
const { parseEther } = require("ethers");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 部署 SimpleStrategy
  const SimpleStrategy = await ethers.getContractFactory("SimpleStrategy");
  const strategy = await SimpleStrategy.deploy();
  await strategy.waitForDeployment();
  const strategyAddress = await strategy.getAddress();
  console.log("SimpleStrategy deployed to:", strategyAddress);

  // 部署 StrategyFactory
  const StrategyFactory = await ethers.getContractFactory("StrategyFactory");
  const strategyFactory = await StrategyFactory.deploy();
  await strategyFactory.waitForDeployment();
  const strategyFactoryAddress = await strategyFactory.getAddress();
  console.log("StrategyFactory deployed to:", strategyFactoryAddress);

  // 将策略加入工厂
  await strategyFactory.addStrategy(ethers.ZeroAddress, strategyAddress); // 示例中用 ZeroAddress 作为 token

  // 部署 FeeManager，构造函数需要传递 feeReceiver 地址
  const FeeManager = await ethers.getContractFactory("FeeManager");
  const feeReceiverAddress = deployer.address;  // 假设 feeReceiver 为部署者地址
  const feeManager = await FeeManager.deploy(feeReceiverAddress);
  await feeManager.waitForDeployment();
  const feeManagerAddress = await feeManager.getAddress();
  console.log("FeeManager deployed to:", feeManagerAddress);

  // 部署 StrategyManager，构造函数需要传递 strategyFactory 地址、vipUser 地址、feeRate
  const StrategyManager = await ethers.getContractFactory("StrategyManager");
  const vipUserAddress = deployer.address;  // 假设 vipUser 为部署者地址
  const feeRate = 100;  // 假设 feeRate 为 100（即 1%）
  const strategyManager = await StrategyManager.deploy(strategyFactoryAddress, vipUserAddress, feeRate);
  await strategyManager.waitForDeployment();
  const strategyManagerAddress = await strategyManager.getAddress();
  console.log("StrategyManager deployed to:", strategyManagerAddress);

  // 部署 StrategyManagerFactory，构造函数不需要参数
  const StrategyManagerFactory = await ethers.getContractFactory("StrategyManagerFactory");
  const strategyManagerFactory = await StrategyManagerFactory.deploy();
  await strategyManagerFactory.waitForDeployment();
  const strategyManagerFactoryAddress = await strategyManagerFactory.getAddress();
  console.log("StrategyManagerFactory deployed to:", strategyManagerFactoryAddress);

  // 部署 YieldAggregator，构造函数需要传递 timelock 地址、strategyFactory 地址 和 feeManager 地址
  const YieldAggregatorV1 = await ethers.getContractFactory("YieldAggregatorV1");
  const aggregator = await YieldAggregatorV1.deploy(
    deployer.address,  // timelock 地址
    strategyFactoryAddress,  // strategyFactory 地址
    feeManagerAddress  // feeManager 地址
  );
  await aggregator.waitForDeployment();
  const aggregatorAddress = await aggregator.getAddress();
  console.log("YieldAggregator deployed to:", aggregatorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

