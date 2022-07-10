// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract TimelockedToken is ERC20, Ownable {

    IERC20 public token;
    uint256 public timelock;

    constructor(string memory _name, 
                string memory _symbol, 
                address _token, 
                uint256 _timelock) ERC20(_name, _symbol) {
        token = IERC20(_token);
        timelock = _timelock;
    }

    function deposit(uint256 amount) public onlyOwner {
        token.transferFrom(_msgSender(), address(this), amount);
        _mint(_msgSender(), amount);
    }

    function redeem(uint256 amount)public {
        require(block.timestamp > timelock, "Timelock still in place");
        _burn( _msgSender(),  amount);
    }


}