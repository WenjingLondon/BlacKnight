
async function redeem() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();

  const token = document.getElementById("tokenAddress").value;
  const amount = document.getElementById("amount").value;
  const aggregatorAddress = "0xYourYieldAggregatorContractAddress"; // Replace with your contract address
  const abi = [
    "function redeem(address token, uint256 amount) public"
  ];
  const contract = new ethers.Contract(aggregatorAddress, abi, signer);

  try {
    const tx = await contract.redeem(token, ethers.utils.parseUnits(amount, 18));
    document.getElementById("status").innerText = "Redeem sent...";
    await tx.wait();
    document.getElementById("status").innerText = "Redeem successful!";
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "Error: " + err.message;
  }
}
