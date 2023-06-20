// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "./PriceConvertor.sol";

error FundMe__NotOwner();

contract FundMe {
    using PriceConvertor for uint256;

    uint256 public constant minUSD = 50 * 1e18;

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    address public immutable owner;

    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) > minUSD,
            "Didnt send enough"
        ); // 1e18 = 1*10*8 = 100000000000000000
        addressToAmountFunded[msg.sender] = msg.value;
        funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        //reset the array
        funders = new address[](0);

        //Three way to withraw ether

        //transfer
        // payable(msg.sender).transfer(address(this).balance);

        //send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        //call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
    }

    modifier onlyOwner() {
        // require(msg.sender == owner, "Should be owner");

        if (msg.sender != owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }
}
