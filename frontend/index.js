import { ethers } from "./ethers-6.esm.min.js";
import { abi, contractAddress } from "./constants.js";

console.log(ethers);

const connectButton = document.getElementById("connect");
const fundButton = document.getElementById("fund");
const balanceButton = document.getElementById("balanceButton");
const balanceChange = document.getElementById("balanceChange");
const withdrawButton = document.getElementById("withdraw");
connectButton.onclick = connect;
fundButton.onclick = fund;
withdrawButton.onclick = withdraw;
balanceButton.onclick = balance;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    connectButton.textContent = "connected";
    console.log("connected");
  } else {
    console.log("I dont see a Metamask");
  }
}

async function fund() {
  const ethAmount = document.getElementById("ethAmount").value;
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });
      await listenForTransactionMining(transactionResponse, provider);
      console.log("Done");
    } catch (error) {
      console.log(error);
    }
  }
}

async function withdraw() {
  if (typeof window.ethereum !== "undefined") {
    console.log("withdrawing..");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.withdraw();
      await listenForTransactionMining(transactionResponse, provider);
    } catch (error) {
      console.log(error);
    }
  }
}

async function balance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);

    balanceChange.innerHTML = `${ethers.utils.formatEther(balance)}`;
  }
}

function listenForTransactionMining(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}`);
  return new Promise((resolve, reject) => {
    provider.once(transactionResponse.hash, (transactionReciept) => {
      console.log(
        `Completed with ${transactionReciept.confirmations} confirmations`
      );
      resolve();
    });
  });
}
