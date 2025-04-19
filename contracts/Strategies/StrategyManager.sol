// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "../Interfaces/IStrategy.sol";
import "../Interfaces/IStrategyFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StrategyManager is Ownable {
    address public vipUser;
    uint256 public feeRate;

    struct UserPortfolio {
        address[] strategies; // 用户选择的策略
        mapping(address => uint256) allocations;  // 每个策略的分配比例
    }

    mapping(address => UserPortfolio) private userPortfolios;  // 记录每个用户的策略组合
    IStrategyFactory public strategyFactory;  // 关联的策略工厂

    event StrategyAssigned(address indexed user, address strategy, uint256 allocation);
    event StrategyRebalanced(address indexed user, address[] strategies, uint256[] allocations);

    constructor(address _strategyFactory, address _vipUser, uint256 _feeRate) Ownable(msg.sender) {
        strategyFactory = IStrategyFactory(_strategyFactory);
        vipUser = _vipUser;
        feeRate = _feeRate;
    }

    // 用户绑定策略和资金分配
    function assignStrategy(address _strategy, uint256 _allocation) external {
        require(strategyFactory.isValidStrategy(_strategy), "Invalid strategy");
        UserPortfolio storage portfolio = userPortfolios[msg.sender];
        portfolio.strategies.push(_strategy);
        portfolio.allocations[_strategy] = _allocation;
        emit StrategyAssigned(msg.sender, _strategy, _allocation);
    }

    // 调整策略组合（再平衡）
    function rebalance(address[] calldata _strategies, uint256[] calldata _allocations) external {
    require(_strategies.length == _allocations.length, "Mismatched arrays");

    uint256 totalAllocation = 0;
    for (uint256 i = 0; i < _allocations.length; i++) {
        totalAllocation += _allocations[i];
    }
    require(totalAllocation == 100, "Allocations must sum to 100");

    UserPortfolio storage portfolio = userPortfolios[msg.sender];

    // 先清空之前的策略
    delete portfolio.strategies;

    // 重新分配策略
    for (uint256 i = 0; i < _strategies.length; i++) {
        require(strategyFactory.isValidStrategy(_strategies[i]), "Invalid strategy");
        portfolio.strategies.push(_strategies[i]);
        portfolio.allocations[_strategies[i]] = _allocations[i];
    }

    emit StrategyRebalanced(msg.sender, _strategies, _allocations);
}

}

