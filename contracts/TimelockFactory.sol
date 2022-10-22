//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";


contract TimelockFactory{

    address public token;
    uint256 public counter=0;

    mapping(address => address[]) public positionByBeneficiary;
    mapping(address => uint256)   public countByBeneficiary;

    address [] public positions;

    event PositionCreated(address,address,uint256);

    constructor(address _token){
        token = _token;
    }

    function createNew(
        address _beneficiary, 
        uint256 _releaseTime) 
    public {
        TokenTimelock t = new TokenTimelock(
            IERC20(token), 
            _beneficiary, 
            _releaseTime
        );

        positions.push(address(t));
        counter ++;
        positionByBeneficiary[_beneficiary].push(address(t));
        countByBeneficiary[_beneficiary]++;
        emit PositionCreated(address(t), _beneficiary, _releaseTime);
    }
    
}