// async function deplotFunc() {
//   console.log("hii");
// }
// module.exports.default = deplotFunc;

const { network } = require("hardhat");

module.exports = async ({ getNameAccounts, deployements }) => {
  const { deploy, log } = deployements;
  const { deployer } = await getNameAccounts();
  const chainId = network.config.chainId;
};
