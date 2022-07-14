//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract VestedToken is IERC20, IERC20Metadata {
    address public token;
    address public beneficiary;
    address public emitter;
    uint256 public cliffEndTime;
    uint256 public vestingEndTime;

    event EarlyUnlock(address indexed _emitter, address indexed _beneficiary, uint256 _value);

    constructor(address _token, 
                address _beneficiary, 
                address _emitter,
                uint256 _cliffEndTime,
                uint256 _vestingEndTime) {
        token = _token;
        beneficiary = _beneficiary;
        emitter = _emitter;
        cliffEndTime = _cliffEndTime;
        vestingEndTime = _vestingEndTime;

    }


    /**
     * @dev Returns the name of the token.
     */
    function name() external virtual override view returns (string memory){
        return string(bytes.concat(bytes(IERC20Metadata(token).name()),"_locked"));
    }

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external virtual override view returns (string memory){
        return  string(bytes.concat(bytes(IERC20Metadata(token).symbol()),"lk"));
    }

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external virtual override view returns (uint8){
        return IERC20Metadata(token).decimals();
    }

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external virtual override view returns (uint256){
        return IERC20(token).balanceOf(address(this));
    }

   /**
     * @dev Returns the amount of tokens owned by `account`.
     * this function returns the tokens locked in this contract if account is
     * the beneficiary, otherwise zero.
     * 
     */
    function balanceOf(address account) external virtual override view returns (uint256){
        if(account == beneficiary)
            return IERC20(token).balanceOf(address(this));
        else return (0);
    }

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external virtual override returns (bool){
        require(msg.sender == beneficiary);
        require(block.timestamp > vestingEndTime, "Lock still in place");
        emit Transfer(beneficiary, to, amount);
        bool retval = IERC20(token).transfer(to, amount);
        if(retval==false) revert();
        return retval;
    }

    /**
     * @dev approve and allowances are disabled for this contract
     */
    function allowance(address owner, address spender) external virtual override view returns (uint256){
        return 0;
    }

    /**
     * @dev approve( ) is disabled for this contract
     */
    function approve(address spender, uint256 amount) external virtual override returns (bool){
        return false;
    }

    /**
     * @dev transferFrom is disabled for this contract
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external virtual override returns (bool){
        return false;
    }

   /**
     * @dev earlyUnlock can unlock the vesting before deadline, it 
     * can be called by the emitter only
     */
    function earlyUnlock()external returns (bool){
        require(msg.sender == emitter);
        uint256 amount = IERC20(token).balanceOf(address(this));
        require(amount>0);
        emit EarlyUnlock(emitter, beneficiary, amount);
        return IERC20(token).transfer(beneficiary, amount);
    }

   /**
     * @dev pullBack can send the funds back to the emitter, it 
     * can be called by the emitter only and only before the cliff period is expired
    */
    function pullBack() external returns (bool){
        require(msg.sender == emitter);
        require(block.timestamp < cliffEndTime);
        uint256 amount = IERC20(token).balanceOf(address(this));
        require(amount>0);
        return IERC20(token).transfer(emitter, amount);
    }



}
