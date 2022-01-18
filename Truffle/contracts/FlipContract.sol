// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FlipContract is Ownable {
    using SafeERC20 for IERC20;
    uint ContractBalance;
    IERC20 public token;

    constructor(address erc20token) {
        token = IERC20(erc20token);
    }

    event bet(address indexed user, uint indexed bet, bool indexed win, uint8 side);
    event funded(address owner, uint funding);
    event withdrawed(address owner, uint funding);

    function getBalance() public view returns(uint) {
        return ContractBalance;
    }

    function flip(uint8 side, uint value) public returns(bool win) {
        require(token.balanceOf(address(this)) >= value, "The contract hasn't enought funds");
        require(side == 0 || side == 1, "Incorrect side, needs to be 0 or 1");
        ContractBalance += value;
        token.transferFrom(msg.sender, address(this), value);
        assert(token.balanceOf(address(this)) == ContractBalance);

        if(block.timestamp % 2 == side) {
            ContractBalance -= value * 2;
            token.transfer(msg.sender, value * 2);
            win = true;
        } else {
            win = false;
        }

        emit bet(msg.sender, value, win, side);
    }

    function withdrawAll() public onlyOwner returns(uint) {
        require(token.balanceOf(address(this)) > 0, "Nothing to withdraw!");
        uint amount = token.balanceOf(address(this));
        ContractBalance = 0;
        token.transfer(msg.sender, amount);
        assert(token.balanceOf(address(this)) == 0);
        emit withdrawed(msg.sender, amount);
        return token.balanceOf(address(this));
    }

    function fundContract(uint value) public onlyOwner {
        require(value != 0, "Value is 0");
        ContractBalance += value;
        token.transferFrom(msg.sender, address(this), value);
        assert(ContractBalance == token.balanceOf(address(this)));
        emit funded(msg.sender, value);
    }
}