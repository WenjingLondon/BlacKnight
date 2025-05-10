function selectToken(address) {
  document.getElementById("tokenAddress").value = address;
  document.getElementById("redeemTokenAddress").value = address;
}

function invest() {
  // 替换成你的 ethers 交互逻辑
  const amount = document.getElementById("amount").value;
  const address = document.getElementById("tokenAddress").value;

  if (!amount || !address) {
    document.getElementById("status").innerText =
      "Please enter both token address and amount";
    return;
  }

  document.getElementById(
    "status"
  ).innerText = `Investing ${amount} to ${address}`;

  // 实际投资逻辑应该调用 interaction.js 中的方法
  try {
    window.interaction
      .depositToken(address, amount)
      .then(() => {
        document.getElementById("status").innerText = "Investment successful!";
      })
      .catch((err) => {
        document.getElementById("status").innerText =
          "Investment failed: " + err.message;
      });
  } catch (err) {
    document.getElementById("status").innerText = "Error: " + err.message;
  }
}

function redeem() {
  const amount = document.getElementById("redeemAmount").value;
  const address = document.getElementById("redeemTokenAddress").value;

  if (!amount || !address) {
    document.getElementById("status").innerText =
      "Please enter both token address and amount";
    return;
  }

  document.getElementById(
    "status"
  ).innerText = `Redeeming ${amount} from ${address}`;

  // 实际赎回逻辑应该调用 interaction.js 中的方法
  try {
    window.interaction
      .withdrawToken(address, amount)
      .then(() => {
        document.getElementById("status").innerText = "Redemption successful!";
      })
      .catch((err) => {
        document.getElementById("status").innerText =
          "Redemption failed: " + err.message;
      });
  } catch (err) {
    document.getElementById("status").innerText = "Error: " + err.message;
  }
}
