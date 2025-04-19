// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IFeeManager {
    function setManagementFee(uint256 _fee) external;
    function setWithdrawalFee(uint256 _fee) external;
    function chargeManagementFee(address token, uint256 amount) external;
    function chargeWithdrawalFee(address token, uint256 amount) external;
    function managementFee() external view returns (uint256);
    function withdrawalFee() external view returns (uint256);
    function feeReceiver() external view returns (address);
}

