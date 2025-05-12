window.interaction = window.interaction || {};

window.interaction.getCurrentUser = async function () {
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accounts[0].toLowerCase();  // 强制小写
};

window.interaction.isVIPUser = async function () {
  const user = await window.interaction.getCurrentUser(); // 不重复请求
  return VIP_USERS.map(addr => addr.toLowerCase()).includes(user); // 全部转小写后比较
};

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];

// 从 config.js 中解构出配置项
const {
  DEFAULT_AGGREGATOR_ADDRESS,
  VIP_USERS,
  VIP_STRATEGY_MANAGER_ADDRESS,
  STRATEGY_ADDRESSES
} = window.config;

// 你现在可以在 interaction.js 中使用这些值
console.log(DEFAULT_AGGREGATOR_ADDRESS);
console.log(VIP_USERS);
console.log(VIP_STRATEGY_MANAGER_ADDRESS);
console.log(STRATEGY_ADDRESSES);

// 获取 signer 函数
async function getSigner() {
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []); // 请求用户钱包账户
    const signer = provider.getSigner();  // 获取 signer
    return signer;
  } else {
    throw new Error("Ethereum provider not found. Please install MetaMask.");
  }
}

// 实例化合约函数
async function getAggregatorInstance() {
  const signer = await getSigner();  // 获取 signer
  return new ethers.Contract(DEFAULT_AGGREGATOR_ADDRESS, YieldAggregatorV1ABI, signer);
}

async function getStrategyManagerInstance(address) {
  const signer = await getSigner();  // 获取 signer
  return new ethers.Contract(address, IStrategyManager, signer);
}

async function getStrategyInstance(address) {
  const signer = await getSigner();  // 获取 signer
  return new ethers.Contract(address, IStrategy, signer);
}

// ✅ 普通用户功能（YieldAggregatorV1）

window.interaction.approveToken = async function (tokenAddress, spenderAddress, amount) {
  const signer = await getSigner();
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  return await tokenContract.approve(spenderAddress, amount);
};

window.interaction.depositToken = async function (tokenAddress, amount) {
  const aggregator = await getAggregatorInstance();  // 获取合约实例
  return await aggregator.deposit(tokenAddress, amount);
};

window.interaction.withdrawToken = async function (tokenAddress, amount) {
  const aggregator = await getAggregatorInstance();  // 获取合约实例
  return await aggregator.withdraw(tokenAddress, amount);
};

window.interaction.getUserBalance = async function (tokenAddress) {
  const user = await window.interaction.getCurrentUser();
  const aggregator = await getAggregatorInstance();  // 获取合约实例
  return await aggregator.balances(user, tokenAddress);
};

// ✅ VIP 用户功能（StrategyManager）
window.interaction.assignStrategy = async function (token, strategy, allocation) {
  const user = await window.interaction.getCurrentUser();
  if (!VIP_USERS.includes(user)) throw new Error("Not a VIP user");

  const strategyManager = await getStrategyManagerInstance(VIP_STRATEGY_MANAGER_ADDRESS);  // 获取合约实例
  return await strategyManager.assignStrategy(token, strategy, allocation);
};

window.interaction.rebalanceStrategies = async function (token, strategies, allocations) {
  const user = await window.interaction.getCurrentUser();
  if (!VIP_USERS.includes(user)) throw new Error("Not a VIP user");

  const strategyManager = await getStrategyManagerInstance(VIP_STRATEGY_MANAGER_ADDRESS);  // 获取合约实例
  return await strategyManager.rebalance(token, strategies, allocations);
};

window.interaction.getAPY = async function (strategyAddress, tokenAddress) {
  const strategy = await getStrategyInstance(strategyAddress);  // 获取合约实例
  return await strategy.getAPY(tokenAddress);
};
