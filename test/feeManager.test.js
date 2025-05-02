const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FeeManager", function () {
  let feeManager;
  let owner;
  let feeReceiver;
  let user;
  let mockToken;

  beforeEach(async function () {
    // Get signers
    [owner, feeReceiver, user] = await ethers.getSigners();
    console.log("feeReceiver", feeReceiver.address);

    // Deploy mock ERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock Token", "MTK");
    await mockToken.waitForDeployment();
    console.log("mockToken", mockToken.target);

    // Deploy FeeManager
    const FeeManager = await ethers.getContractFactory("FeeManager");
    feeManager = await FeeManager.deploy(feeReceiver.address);
    await feeManager.waitForDeployment();
  });

  describe("Constructor", function () {
    it("should set the correct owner", async function () {
      expect(await feeManager.owner()).to.equal(owner.address);
    });

    it("should set the correct fee receiver", async function () {
      expect(await feeManager.feeReceiver()).to.equal(feeReceiver.address);
    });
  });

  describe("Fee Settings", function () {
    it("should allow owner to set management fee", async function () {
      await feeManager.setManagementFee(500); // 5%
      expect(await feeManager.managementFee()).to.equal(500);
    });

    it("should allow owner to set withdrawal fee", async function () {
      await feeManager.setWithdrawalFee(300); // 3%
      expect(await feeManager.withdrawalFee()).to.equal(300);
    });

    it("should revert if non-owner tries to set management fee", async function () {
      await expect(
        feeManager.connect(user).setManagementFee(500)
      ).to.be.revertedWith("Not the owner");
    });

    it("should revert if non-owner tries to set withdrawal fee", async function () {
      await expect(
        feeManager.connect(user).setWithdrawalFee(300)
      ).to.be.revertedWith("Not the owner");
    });

    it("should revert if management fee is too high", async function () {
      await expect(feeManager.setManagementFee(10001)).to.be.revertedWith(
        "Fee too high"
      );
    });

    it("should revert if withdrawal fee is too high", async function () {
      await expect(feeManager.setWithdrawalFee(10001)).to.be.revertedWith(
        "Fee too high"
      );
    });
  });

  describe("Fee Charging", function () {
    beforeEach(async function () {
      // Set fees
      await feeManager.setManagementFee(500); // 5%
      await feeManager.setWithdrawalFee(300); // 3%

      // Fix: Transfer tokens TO the FeeManager first
      await mockToken
        .connect(owner)
        .transfer(feeManager.target, ethers.parseEther("1000"));
    });

    it("should correctly charge management fee", async function () {
      const amount = ethers.parseEther("100");
      const expectedFee = (amount * BigInt(500)) / BigInt(10000); // 5%
      const initialBalance = await mockToken.balanceOf(feeReceiver.address);
      await feeManager.chargeManagementFee(mockToken.target, amount);
      const finalBalance = await mockToken.balanceOf(feeReceiver.address);

      expect(finalBalance - initialBalance).to.equal(expectedFee);
    });

    it("should correctly charge withdrawal fee", async function () {
      const amount = ethers.parseEther("100");
      const expectedFee = (amount * BigInt(300)) / BigInt(10000); // 3%

      const initialBalance = await mockToken.balanceOf(feeReceiver.address);
      await feeManager.chargeWithdrawalFee(mockToken.target, amount);
      const finalBalance = await mockToken.balanceOf(feeReceiver.address);

      expect(finalBalance - initialBalance).to.equal(expectedFee);
    });

    it("should revert when charging 0 management fee", async function () {
      await expect(
        feeManager.chargeManagementFee(mockToken.target, 0)
      ).to.be.revertedWith("No fee to charge");
    });

    it("should revert when charging 0 withdrawal fee", async function () {
      await expect(
        feeManager.chargeWithdrawalFee(mockToken.target, 0)
      ).to.be.revertedWith("No fee to charge");
    });
  });

  describe("Events", function () {
    it("should emit ManagementFeeUpdated event", async function () {
      await expect(feeManager.setManagementFee(500))
        .to.emit(feeManager, "ManagementFeeUpdated")
        .withArgs(500);
    });

    it("should emit WithdrawalFeeUpdated event", async function () {
      await expect(feeManager.setWithdrawalFee(300))
        .to.emit(feeManager, "WithdrawalFeeUpdated")
        .withArgs(300);
    });
  });
});
