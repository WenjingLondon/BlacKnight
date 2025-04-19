// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract MockStrategyFactory {

  address public strategy;

    constructor(address _strategy) {
        strategy = _strategy;
    }

    function getBestStrategy(address) external view returns (address) {
        return strategy;
    }    

}
