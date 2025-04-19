//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FeeManager {
    address public owner;
    address public feeReceiver;
    uint256 public managementFee;
    uint256 public withdrawalFee;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    event ManagementFeeUpdated(uint256 newFee);
    event WithdrawalFeeUpdated(uint256 newFee);

    constructor(address _feeReceiver) {
        owner = msg.sender;
        feeReceiver = _feeReceiver;
    }
      
    // Set management fee (e.g., annual fee based on the total value)
    function setManagementFee(uint256 _fee) external onlyOwner {
        require(_fee <= 10000, "Fee too high");  // Fee is in basis points (1% = 100 basis points)
        managementFee = _fee;
        emit ManagementFeeUpdated(_fee);
    }

    // Set withdrawal fee (e.g., fee on withdrawals)
    function setWithdrawalFee(uint256 _fee) external onlyOwner {
        require(_fee <= 10000, "Fee too high");
        withdrawalFee = _fee;
        emit WithdrawalFeeUpdated(_fee);
    }

    // Charge management fee (could be based on account balance)
    function chargeManagementFee(address token, uint256 amount) external {
        uint256 feeAmount = (amount * managementFee) / 10000;
        require(feeAmount > 0, "No fee to charge");
        IERC20(token).transfer(feeReceiver, feeAmount);
    }

    // Charge withdrawal fee
    function chargeWithdrawalFee(address token, uint256 amount) external {
        uint256 feeAmount = (amount * withdrawalFee) / 10000;
        require(feeAmount > 0, "No fee to charge");
        IERC20(token).transfer(feeReceiver, feeAmount);
    }
}

