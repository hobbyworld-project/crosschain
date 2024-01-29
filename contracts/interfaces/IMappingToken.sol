// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;


interface IMappingToken {

    function mint(address account, uint256 value) external;

    function burn(address account, uint256 value) external;

}