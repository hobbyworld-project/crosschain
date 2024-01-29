// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MappingToken is ERC20 {

    uint8 private _decimals;
    address private _operator;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address operator_
    ) ERC20(name_, symbol_)
    {
        _decimals = decimals_;

        require(
            operator_ != address(0),
            "invalid operator address"
        );
        _operator = operator_;
    }

    function decimals() public view override returns (uint8) {

        return _decimals;
    }

    function mint(address account, uint256 value) public onlyOperator {

        _mint(account, value);
    }

    function burn(address account, uint256 value) public onlyOperator {

        _burn(account, value);
    }

    modifier onlyOperator() {

        require(
            msg.sender == _operator,
            "only operator can call"
        );
        _;
    }
}