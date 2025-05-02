// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Interfaces/IStrategy.sol";
import "../Interfaces/IPoolAddressesProvider.sol";
import "../Interfaces/IPool.sol";
import "../Interfaces/IAToken.sol";

contract AaveStrategy is IStrategy {
    IPoolAddressesProvider public immutable addressesProvider;
    IPool public immutable aavePool;

    // Mapping of token to aToken (aTokens are held by the strategy contract)
    mapping(address => address) public aTokens;

    event Deposited(address indexed user, address token, uint256 amount);
    event Withdrawn(address indexed user, address token, uint256 amount);

    constructor(address _addressesProvider) {
        require(_addressesProvider != address(0), "Invalid provider");
        addressesProvider = IPoolAddressesProvider(_addressesProvider);
        aavePool = IPool(addressesProvider.getPool());
    }

    // Deposit function
    function deposit(address token, uint256 amount) external override {
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token");

        // Transfer tokens from user to strategy contract
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "TransferFrom failed");

        // Approve Aave pool if needed
        uint256 allowance = IERC20(token).allowance(address(this), address(aavePool));
        if (allowance < amount) {
            if (allowance > 0) {
                IERC20(token).approve(address(aavePool), 0);
            }
            IERC20(token).approve(address(aavePool), type(uint256).max);
        }

        // Get the aToken address if not already mapped
        if (aTokens[token] == address(0)) {
            aTokens[token] = aavePool.getReserveData(token).aTokenAddress;
        }

        // Supply tokens to Aave pool
        aavePool.supply(token, amount, address(this), 0);

        address aToken = aTokens[token];

        // Transfer the aTokens to the user immediately after the deposit
        uint256 aTokenAmount = amount;  // Typically 1 token = 1 aToken at deposit
        bool successAToken = IERC20(aToken).transfer(msg.sender, aTokenAmount);
        require(successAToken, "aToken transfer failed");

        emit Deposited(msg.sender, token, amount);
    }

    // Withdraw function
    function withdraw(address token, uint256 amount) external override {
        require(token != address(0), "Invalid token");

        address aToken = aTokens[token];
        require(aToken != address(0), "Invalid aToken address");

        // Transfer the aTokens from the user to the strategy contract
        bool successAToken = IERC20(aToken).transferFrom(msg.sender, address(this), amount);
        require(successAToken, "aToken transfer failed");

        // Check if the strategy contract holds enough aTokens
        uint256 aTokenBalance = getTotalBalance(token);
        require(aTokenBalance >= amount, "Insufficient aToken balance");

        // Proceed with withdrawal from Aave, burning the aTokens
        aavePool.withdraw(token, amount, address(this));
        bool successToken = IERC20(token).transfer(msg.sender, amount);
        require(successToken, "Token transfer failed");
        emit Withdrawn(msg.sender, token, amount);
    }

    // Function to get the total aToken balance held by the strategy contract
    function getTotalBalance(address token) public view override returns (uint256) {
        address aToken = aTokens[token];
        if (aToken == address(0)) return 0;
        return IERC20(aToken).balanceOf(address(this));
    }

    // Function to get the current APY for a token
    function getAPY(address token) public view returns (uint256) {
        DataTypes.ReserveData memory reserve = aavePool.getReserveData(token);
        return reserve.currentLiquidityRate / 1e9; // Return APY in percentage
    }

    function getATokenAddress(address token) public view returns (address) {
        return aTokens[token];
    }
}
