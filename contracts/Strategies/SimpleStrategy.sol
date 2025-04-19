// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "../Interfaces/IStrategy.sol";

contract SimpleStrategy is IStrategy {
    mapping(address => uint256) private balances;
    uint256 private apy = 5;  // 固定5%收益

    function deposit(address _token, uint256 _amount) external override {
        // 模拟存款逻辑：增加用户资金记录
        balances[_token] += _amount;
    }

    function withdraw(address _token, uint256 _amount) external override {
        require(balances[_token] >= _amount, "Insufficient balance");
        balances[_token] -= _amount;
    }

    function getAPY(address _token) external view override returns (uint256) {
        return apy;
    }

    function getTotalBalance(address _token) external view override returns (uint256) {
        return balances[_token];
    }

    function invest(address _token, uint256 _amount) external override {
        // 简化处理：视为立即投资（模拟逻辑）
        balances[_token] += _amount;
    }
}

