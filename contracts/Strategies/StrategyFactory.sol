//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "../Interfaces/IStrategy.sol";

contract StrategyFactory {

    mapping(address => StrategyInfo[]) public tokenStrategies;
    struct StrategyInfo {
        address strategy;
        bool isActive;
    }

    mapping(address => bool) public isSupportedToken;

    function addStrategy(address _token, address _strategy) external {
        tokenStrategies[_token].push(StrategyInfo(_strategy, true));
        //tokenStrategies[token] = IStrategy(strategy);
    }

    function isValidStrategy(address _strategy) external view returns (bool) {
    // 遍历所有 token 的策略，检查是否存在这个 _strategy 并且是有效的
    for (uint256 i = 0; i < tokenStrategies[_strategy].length; i++) {
        if (tokenStrategies[_strategy][i].strategy == _strategy && tokenStrategies[_strategy][i].isActive) {
            return true;
        }
    }
    return false;
}

    function removeStrategy(address _token, address _strategy) external {
    for (uint256 i = 0; i < tokenStrategies[_token].length; i++) {
        if (tokenStrategies[_token][i].strategy == _strategy) {
            tokenStrategies[_token][i].isActive = false;
            break;
        }
    }
    }

    function getBestStrategy(address _token) public view returns (address) {
        uint256 bestAPY = 0;
        address bestStrategy;

        for (uint256 i = 0; i < tokenStrategies[_token].length; i++) {
            StrategyInfo storage strategyInfo = tokenStrategies[_token][i];
            if (strategyInfo.isActive) {
                uint256 apy = IStrategy(strategyInfo.strategy).getAPY(_token);
                if (apy > bestAPY) {
                    bestAPY = apy;
                    bestStrategy = strategyInfo.strategy;
                }
            }
        }
        return bestStrategy;
    }
    
}


