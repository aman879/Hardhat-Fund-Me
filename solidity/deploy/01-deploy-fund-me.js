// async function deplotFunc() {
//   console.log("hii");
// }
// module.exports.default = deplotFunc;

const { network } = require("hardhat");
const {networkConfig, developmentChains} = require("../helper-hardhat.config");
const {verify} = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // const ethUsdPriceFeed = networkConfig[chainId]["ethUsdPriceFeed"];
  let ethUsdPriceFeed;
  if(developmentChains.includes(network.name)) {
    const ethUsd = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeed = ethUsd.address;
  } else {
    ethUsdPriceFeed = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  // console.log(ethUsdPriceFeed);

  const args = [ethUsdPriceFeed];

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args,
    log: true,
    //waitConfirmations: network.config.blockConfirmations || 6, //uncomment this while running on test net or main net
  });

  if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY ) {
    await verify(fundMe.address,args);
  }
};

module.exports.tags = ["all", "fundme"];
