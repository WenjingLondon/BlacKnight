function selectToken(address) {
  document.getElementById("tokenAddress").value = address;
  document.getElementById("redeemTokenAddress").value = address;
}

function invest() {
  // 替换成你的 ethers 交互逻辑
  const amount = document.getElementById("amount").value;
  const address = document.getElementById("tokenAddress").value;
  document.getElementById("status").innerText = `Investing ${amount} to ${address}`;
}

function redeem() {
  const amount = document.getElementById("redeemAmount").value;
  const address = document.getElementById("redeemTokenAddress").value;
  document.getElementById("status").innerText = `Redeeming ${amount} from ${address}`;
}
