// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "../Interfaces/IStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockStrategy is IStrategy {
    mapping(address => uint256) public balances;

    function deposit(address token, uint256 amount) external override {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        balances[token] += amount;
    }
    
//    function deposit(address token, uint256 amount) external override {
//     // TODO: your deposit logic
// }

function getAPY(address token) external view override returns (uint256) {
    return 1; // temporary placeholder
}


    function withdraw(address token, uint256 amount) external override {
        require(balances[token] >= amount, "Not enough balance");
        balances[token] -= amount;
        IERC20(token).transfer(msg.sender, amount);
    }

    function getTotalBalance(address token) external view override returns (uint256) {
        return balances[token];
    }
}

