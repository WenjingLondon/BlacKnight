// config.js

window.config = {
  // Default Aggregator address for General users
  DEFAULT_AGGREGATOR_ADDRESS: "0xe188336f79C1F0bBA624b651C44a845064F68C2a",

  // 默认策略管理合约（普通用户通常不会用到，但保留也可以）
  DEFAULT_STRATEGY_MANAGER_ADDRESS: "0x79bd2C426C6461F30Ea840141678B161Cb6A7CAa",

  // VIP 策略管理合约地址
  VIP_STRATEGY_MANAGER_ADDRESS: "0x2C73E311eBA03ffAB5EE64e615cF21DbdDbeA7d7",

  // VIP wallet list（务必小写）可添加更多 VIP 地址
  VIP_USERS: [
  "0x5454518c95cf922b139b77c0888167be429d3fc5",
  "0x33f6885246020ecf1aa341008e1948eed0f4567a"
],

  // 测试 Token 地址：WBTC
  WBTC_ADDRESS: "0x29f2D40B0605204364af54EC677bD022dA425d03",

  // 可用策略合约地址
  STRATEGY_ADDRESSES: {
    aave: "0x53c1ADE13B4AA894130d1D751368da37B92a9abe",
    mock: "0xCf97fa543B5bee44DD63965925Af709174caE91A"
  }
};

console.log("window.config: ", window.config);  // 输出 window.config 内容
