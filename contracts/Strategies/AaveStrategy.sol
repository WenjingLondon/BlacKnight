// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Interfaces/IStrategy.sol";

import "../Interfaces/IPoolAddressesProvider.sol";
import "../Interfaces/IPool.sol";
import "../Interfaces/IAToken.sol";
/**
 * @title AaveStrategy
 * @dev 简洁优化版，支持 Aave V3 交互，符合你的项目架构与逻辑
 */
contract AaveStrategy is IStrategy {
    IPoolAddressesProvider public immutable addressesProvider;
    IPool public immutable aavePool;

    mapping(address => address) public aTokens; // token => aToken

    constructor(address _addressesProvider) {
        require(_addressesProvider != address(0), "Invalid provider");
        addressesProvider = IPoolAddressesProvider(_addressesProvider);
        address poolAddress = addressesProvider.getPool();
        aavePool = IPool(poolAddress);
    }

    /**
     * @dev 存入资产到 Aave（由 aggregator 或 manager 合约调用）
     */
    function deposit(address token, uint256 amount) external override {
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(aavePool), amount);

        aavePool.supply(token, amount, address(this), 0);

        if (aTokens[token] == address(0)) {
            aTokens[token] = aavePool.getReserveData(token).aTokenAddress;
        }
    }

    // function deposit(address token, uint256 amount) external override {
    
    // }

    /**
     * @dev 从 Aave 取回资产
     */
    function withdraw(address token, uint256 amount) external override {
        require(token != address(0), "Invalid token");
        require(getTotalBalance(token) >= amount, "Insufficient balance");

        aavePool.withdraw(token, amount, msg.sender);
    }

    /**
     * @dev 获取当前策略中 token 的存入余额（通过 aToken 查询）
     */
    function getTotalBalance(address token) public view override returns (uint256) {
        address aToken = aTokens[token];
        if (aToken == address(0)) return 0;

        return IERC20(aToken).balanceOf(address(this));
    }

    /**
     * @dev 返回当前 token 的年化收益率估算值（基于 Aave 提供的 liquidityRate）
     * 注意：这是 APR 的线性近似，未复利
     */
    function getAPY(address token) public view returns (uint256) {
        // liquidityRate 是 Ray（1e27）
        DataTypes.ReserveData memory reserve = aavePool.getReserveData(token);
        uint256 liquidityRate = reserve.currentLiquidityRate;
        return liquidityRate / 1e9; // 转换为近似年利率，单位为 1e18
    }
}

