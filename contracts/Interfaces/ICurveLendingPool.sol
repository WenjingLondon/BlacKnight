
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

interface ICurveLendingPool {
    function add_liquidity(uint256[1] memory amounts, uint256 min_mint_amount) external;
    function get_virtual_price() external view returns (uint256);
    function calc_withdraw_one_coin(uint256 _amount, int128 _index) external view returns (uint256);
    function remove_liquidity_one_coin(uint256 _amount, int128 _index, uint256 _minAmount) external;
}

