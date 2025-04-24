// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IStrategyManager {
    event StrategyAssigned(address indexed user, address strategy, uint256 allocation);
    event StrategyRebalanced(address indexed user, address[] strategies, uint256[] allocations);

    function assignStrategy(address _token, address _strategy, uint256 _allocation) external;
    function rebalance(address _token, address[] calldata _strategies, uint256[] calldata _allocations) external;
}

