// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./StrategyManager.sol";

contract StrategyManagerFactory {
    address public owner;
    mapping(address => address) public vipStrategyManager; // VIP 用户地址 => 他们的 StrategyManager

    event StrategyManagerDeployed(address indexed vip, address strategyManager);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    constructor() {
        owner = msg.sender;
    }

    function deployStrategyManager(
    address _strategyFactory,  // 新增这个参数
    address _vipUser,
    uint256 _feeRate
) external onlyOwner returns (address) {
    require(vipStrategyManager[_vipUser] == address(0), "Already deployed");

    // 现在构造函数参数匹配了
    StrategyManager strategyManager = new StrategyManager(_strategyFactory, _vipUser, _feeRate);
    
    vipStrategyManager[_vipUser] = address(strategyManager);

    emit StrategyManagerDeployed(_vipUser, address(strategyManager));
    return address(strategyManager);
}

    function getVIPStrategyManager(address _vipUser) external view returns (address) {
        return vipStrategyManager[_vipUser];
    }
}

