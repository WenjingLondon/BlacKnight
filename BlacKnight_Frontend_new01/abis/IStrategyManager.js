window.IStrategyManager = [
  {
    "inputs": [
      { "internalType": "address", "name": "_strategyFactory", "type": "address" },
      { "internalType": "address", "name": "_vipUser", "type": "address" },
      { "internalType": "uint256", "name": "_feeRate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "feeRate",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "strategyFactory",
    "outputs": [{ "internalType": "contract IStrategyFactory", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vipUser",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_strategy", "type": "address" },
      { "internalType": "uint256", "name": "_allocation", "type": "uint256" }
    ],
    "name": "assignStrategy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address[]", "name": "_strategies", "type": "address[]" },
      { "internalType": "uint256[]", "name": "_allocations", "type": "uint256[]" }
    ],
    "name": "rebalance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "strategy", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "allocation", "type": "uint256" }
    ],
    "name": "StrategyAssigned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "address[]", "name": "strategies", "type": "address[]" },
      { "indexed": false, "internalType": "uint256[]", "name": "allocations", "type": "uint256[]" }
    ],
    "name": "StrategyRebalanced",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
]
