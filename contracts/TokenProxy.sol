//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./TimelockFactory.sol";

contract TokenProxy{

    address public factory;
    address public token;
    string public name;
    string public symbol;
    uint16 public decimals;



    constructor(address _factory){
        factory = _factory;
        token =  TimelockFactory(factory).token();
        name = string.concat(IERC20Metadata(token).name(),"_locked");
        symbol = string.concat(IERC20Metadata(token).symbol(),"_lk");
        decimals = IERC20Metadata(token).decimals();
    }


    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256){
        uint256 supply = 0;
        for(uint k=0;k<TimelockFactory(factory).counter();k++){
            uint256 b = IERC20(token).balanceOf(TimelockFactory(factory).positions(k));
            supply += b;
        }
        return supply;
    }

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256){
        uint256 balance = 0;
        for(uint k=0;k<TimelockFactory(factory).countByBeneficiary(account);k++){
            uint256 b = IERC20(token).balanceOf(TimelockFactory(factory).positionByBeneficiary(account,k));
            balance += b;
        }
        return balance;
    }

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool){
        revert();
    }

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256){
        revert();
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool){
        revert();
    }

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool){
        revert();
    }    
}