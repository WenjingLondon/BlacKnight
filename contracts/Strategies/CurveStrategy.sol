// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "../Interfaces/IStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICurveLendingPool {
    function add_liquidity(uint256[1] memory amounts, uint256 min_mint_amount) external;
    function get_virtual_price() external view returns (uint256);
    function calc_withdraw_one_coin(uint256 _amount, int128 _index) external view returns (uint256);
    function remove_liquidity_one_coin(uint256 _amount, int128 _index, uint256 _minAmount) external;
}

contract CurveStrategy is IStrategy {
    address public owner;

    // 映射：Token => Curve 池
    mapping(address => address) public tokenToCurvePool;
    mapping(address => address) public tokenToCurveLPToken;
    mapping(address => int128) public tokenToAssetIndex;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // ✅ 添加支持的 Curve 池（可动态扩展）
    function addSupportedPool(address token, address curvePool, address curveLPToken, int128 index) external onlyOwner {
        require(curvePool != address(0), "Invalid pool");
        tokenToCurvePool[token] = curvePool;
        tokenToCurveLPToken[token] = curveLPToken;
        tokenToAssetIndex[token] = index;
    }

    // ✅ 存款（将 Token 存入对应的 Curve 池）
    function invest(address token, uint256 amount) external override {
        require(amount > 0, "Amount must be greater than zero");
        address curvePool = tokenToCurvePool[token];
        require(curvePool != address(0), "No Curve pool for this token");

        IERC20(token).approve(curvePool, amount);
        uint256[1] memory amounts;
        amounts[0] = amount;

        ICurveLendingPool(curvePool).add_liquidity(amounts, 0);
    }

    function deposit(address token, uint256 amount) external override {
    }
    
    // ✅ 取款（从 Curve 池提取 Token）
    function withdraw(address token, uint256 amount) external override {
        address curvePool = tokenToCurvePool[token];
        address lpToken = tokenToCurveLPToken[token];
        int128 index = tokenToAssetIndex[token];

        require(curvePool != address(0) && lpToken != address(0), "Invalid Curve pool");
        uint256 lpBalance = IERC20(lpToken).balanceOf(address(this));
        require(lpBalance >= amount, "Insufficient LP balance");

        ICurveLendingPool(curvePool).remove_liquidity_one_coin(amount, index, 0);
        IERC20(token).transfer(msg.sender, amount);
    }

    // ✅ 计算 APY（自动计算不同 Curve 池的收益率）
    function getAPY(address token) public view override returns (uint256) {
        address curvePool = tokenToCurvePool[token];
        require(curvePool != address(0), "No Curve pool for this token");

        uint256 virtualPrice = ICurveLendingPool(curvePool).get_virtual_price();
        uint256 assetPrice = ICurveLendingPool(curvePool).calc_withdraw_one_coin(1e18, tokenToAssetIndex[token]);

        if (assetPrice == 0) {
            return 0;
        }
        uint256 apr = ((virtualPrice * 1e18) / assetPrice) - 1e18;
        uint256 apy = apr * 365 / 1e18;
        return apy;
    }

    // ✅ 获取某个 Token 在策略合约中的余额
    function getTotalBalance(address token) external view override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}


