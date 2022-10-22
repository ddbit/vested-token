//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;


import "./TimelockFactory.sol";
import "./TokenProxy.sol";
import "./TestToken.sol";

contract Orchestrate{
    constructor(){
        TestToken token = new TestToken(1000);
        TimelockFactory factory = new TimelockFactory(address(token));
        TokenProxy proxy = new TokenProxy(address(factory));
    }
}