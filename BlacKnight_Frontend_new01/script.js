// 当页面滚动时逐个显示屏幕块
window.addEventListener("scroll", () => {
  const screens = document.querySelector(".screens");
  const screen1 = document.getElementById("screen1");
  const screen2 = document.getElementById("screen2");
  const screen3 = document.getElementById("screen3");

  if (screens && screen1 && screen2 && screen3) {
    if (window.scrollY > 200) {
      screens.classList.add("active");
      screen1.classList.add("active");
    }
    if (window.scrollY > 400) {
      screen2.classList.add("active");
    }
    if (window.scrollY > 600) {
      screen3.classList.add("active");
    }
  }
});

// 检查钱包连接状态
document.addEventListener("DOMContentLoaded", () => {
  // 如果已经连接过钱包，尝试恢复状态
  if (window.ethereum && window.ethereum.selectedAddress) {
    const walletAddress = window.ethereum.selectedAddress;
    if (document.getElementById("walletAddress")) {
      document.getElementById("walletAddress").textContent =
        "Connected Wallet: " + walletAddress;
    }
    if (document.getElementById("connectWallet")) {
      document.getElementById("connectWallet").textContent = "Wallet Connected";
      document.getElementById("connectWallet").disabled = true;
    }
    if (document.getElementById("statusMessage")) {
      document.getElementById("statusMessage").textContent =
        "✅ Wallet connected. You can now start investing!";
    }
  }
});
