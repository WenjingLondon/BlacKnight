// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Interfaces/IStrategy.sol";
import "../Strategies/StrategyFactory.sol";
import "./FeeManager.sol";

contract YieldAggregatorV1 {
    address public owner;
    address public timelock;
    StrategyFactory public strategyFactory;
    FeeManager public feeManager;

    mapping(address => mapping(address => uint256)) public balances;
    mapping(address => bool) public isSupportedToken;

    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event StrategyUpdated(address indexed token, address indexed strategy);

    modifier onlyTimelock() {
        require(msg.sender == timelock, "Only timelock can call this");
        _;
    }

    constructor(address _timelock, address _strategyFactory, address _feeManager) {
        owner = msg.sender;
        timelock = _timelock;
        strategyFactory = StrategyFactory(_strategyFactory);
        feeManager = FeeManager(_feeManager);
    }

    function deposit(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        balances[msg.sender][token] += amount;

        address bestStrategy = strategyFactory.getBestStrategy(token);
        require(bestStrategy != address(0), "No strategy available");

        IERC20(token).approve(bestStrategy, amount);
        IStrategy(bestStrategy).deposit(token, amount);

        emit Deposited(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external {
        require(balances[msg.sender][token] >= amount, "Insufficient balance");

        address strategy = strategyFactory.getBestStrategy(token);
        require(strategy != address(0), "No strategy available");

        IStrategy(strategy).withdraw(token, amount);
        IERC20(token).transfer(msg.sender, amount);
        balances[msg.sender][token] -= amount;

        emit Withdrawn(msg.sender, token, amount);
    }
}

