// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IYieldAggregatorV1 {
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event StrategyUpdated(address indexed token, address indexed strategy);

    function initialize(address _timelock, address _strategyFactory, address _feeManager) external;

    function deposit(address token, uint256 amount) external;

    function withdraw(address token, uint256 amount) external;

    function balances(address user, address token) external view returns (uint256);
}

