//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "../Interfaces/IStrategy.sol";

contract StrategyFactory {

    // Add events at the top of the contract
    event StrategyAdded(address indexed token, address indexed strategy);
    event StrategyRemoved(address indexed token, address indexed strategy);

    mapping(address => StrategyInfo[]) public tokenStrategies;
    struct StrategyInfo {
        address strategy;
        bool isActive;
    }

    mapping(address => bool) public isSupportedToken;

    function addStrategy(address _token, address _strategy) external {
        require(_strategy != address(0), "Invalid strategy address");

        // Check if strategy already exists for this token
        for (uint256 i = 0; i < tokenStrategies[_token].length; i++) {
            if (tokenStrategies[_token][i].strategy == _strategy) {
                revert("Strategy already exists");
            }
        }

        tokenStrategies[_token].push(StrategyInfo(_strategy, true));
        emit StrategyAdded(_token, _strategy); // Emit event when strategy is added
    }

    function isValidStrategy(address _token, address _strategy) external view returns (bool) {
    for (uint256 i = 0; i < tokenStrategies[_token].length; i++) {
        if (tokenStrategies[_token][i].strategy == _strategy && tokenStrategies[_token][i].isActive) {
            return true;
        }
    }
    return false;
}



    function removeStrategy(address _token, address _strategy) external {
    for (uint256 i = 0; i < tokenStrategies[_token].length; i++) {
        if (tokenStrategies[_token][i].strategy == _strategy) {
            tokenStrategies[_token][i].isActive = false;
            emit StrategyRemoved(_token, _strategy); // Emit event when strategy is removed
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


