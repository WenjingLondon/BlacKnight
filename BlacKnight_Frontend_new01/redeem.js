async function redeem() {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    const token = document.getElementById("tokenAddress").value;
    const amount = document.getElementById("amount").value;

    if (!token || !amount) {
      document.getElementById("status").innerText =
        "Please enter both token address and amount";
      return;
    }

    // 使用 interaction.js 中的方法
    if (window.interaction && window.interaction.withdrawToken) {
      await window.interaction.withdrawToken(token, amount);
      document.getElementById("status").innerText = "Redemption successful!";
      return;
    }

    // 备用方法，如果 interaction.js 不可用
    const aggregatorAddress = window.config
      ? window.config.DEFAULT_AGGREGATOR_ADDRESS
      : "0xYourYieldAggregatorContractAddress";
    const abi = ["function withdraw(address token, uint256 amount) public"];
    const contract = new ethers.Contract(aggregatorAddress, abi, signer);

    const tx = await contract.withdraw(
      token,
      ethers.utils.parseUnits(amount, 18)
    );
    document.getElementById("status").innerText = "Redeem sent...";
    await tx.wait();
    document.getElementById("status").innerText = "Redeem successful!";
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "Error: " + err.message;
  }
}
