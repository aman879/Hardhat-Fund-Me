const {deployments, ethers, getNamedAccounts} = require("hardhat");
const {assert,expect} = require("chai");
const {developmentChains} = require("../../helper-hardhat.config");

!developmentChains.includes(network.name) 
    ? describe.skip 
    : describe("FundMe", async function(){
        let fundMe;
        let deployer;
        let mockV3Aggregator;
        const sendValue = ethers.utils.parseEther("1");
        beforeEach(async function() {
            deployer= (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            fundMe = await ethers.getContract("FundMe", deployer);
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
        });
        describe("constructor", async function() {
            it("sets the agrregator address correctly", async function() {
                const response = await fundMe.priceFeed();
                assert.equal(response, mockV3Aggregator.address);
            })
        });
        describe("fund", async function() {
            it("Falls if you dont send enough ETH", async function() {
                await expect(fundMe.fund()).to.be.revertedWith("Didnt send enough");
            })
            it("update the amount funded", async function() {
                await fundMe.fund({value: sendValue});
                const response = await fundMe.addressToAmountFunded(deployer);
                assert.equal(response.toString(), sendValue.toString());
            })
            it("add funders to array", async function() {
                await fundMe.fund({value: sendValue});
                const funder = await fundMe.funders(0);
                assert.equal(funder, deployer);
            })
        });
        describe("Withdraw", async function () {
            beforeEach(async function() {
                await fundMe.fund({value: sendValue});
            });

            it("withdraw ETH from a single founder", async function () {
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

                const transcationResponse = await fundMe.withdraw();
                const transcationReciept = await transcationResponse.wait(1);
                const {gasUsed, effectiveGasPrice} = transcationReciept;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const endingDeployerBalance  = await fundMe.provider.getBalance(deployer);

                assert.equal(endingFundMeBalance, 0);
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString() );
            });

            it("allows us to withdraw with multiple funders", async function() {
                const accounts = await ethers.getSigners();

                for(let i=1; i<6;i++) {
                    const fundMeConnectedAccount = await fundMe.connect(accounts[i]);

                    await fundMeConnectedAccount.fund({value: sendValue});
                }

                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

                const transcationResponse = await fundMe.withdraw();
                const transcationReciept = await transcationResponse.wait(1);
                const {gasUsed, effectiveGasPrice} = transcationReciept;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const endingDeployerBalance  = await fundMe.provider.getBalance(deployer);

                assert.equal(endingFundMeBalance, 0);
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString() );

                await expect(fundMe.funders(0)).to.be.reverted;

                for(i=1; i<6; i++) {
                    assert.equal(await fundMe.addressToAmountFunded(accounts[i].address),0);
                }
            });

            it("Only let the owner withdraw", async function() {
                const accounts = await ethers.getSigners();
                const attacker = accounts[1];
                const attackerConnectedAccount = await fundMe.connect(attacker);

                await expect(attackerConnectedAccount.withdraw()).to.be.reverted;
            });

        });  
    });