// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MappingToken } from "./MappingToken.sol";
import { ITokenFactory } from "./interfaces/ITokenFactory.sol";
import { ICrossBridge } from "./interfaces/ICrossBridge.sol";


contract TokenFactory is ITokenFactory, Ownable {

    mapping(bytes32 => TokenAttestation) public override attestedTokens;

    mapping(address => TokenAttestation) public override wrappedAttestedTokens;

    address public crossBridge;


    constructor() Ownable(msg.sender) {

    }

    function setCrossBridge(address _crossBridge) external onlyOwner {

        require(
            _crossBridge != address(0),
            "invalid cross bridge address"
        );
        crossBridge = _crossBridge;
    }


    function getWrappedToken(
        address _tokenAddress,
        uint256 _tokenChain
    ) external view returns (address wrappedToken)
    {
        bytes32 attestationID = keccak256(
            abi.encodePacked(
                _tokenAddress,
                _tokenChain
            )
        );
        return attestedTokens[attestationID].wrappedTokenAddress;
    }

    function getSourceToken(
        address _wrappedToken
    ) external view returns (address sourceToken, uint256 sourceChainID)
    {
        TokenAttestation storage attestation = wrappedAttestedTokens[_wrappedToken];
        return (attestation.tokenAddress, attestation.tokenChain);
    }

    function isTokenSupported(
        address _tokenAddress,
        uint256 _tokenChain
    ) public view returns (bool)
    {
        bytes32 attestationID = keccak256(
            abi.encodePacked(
                _tokenAddress,
                _tokenChain
            )
        );
        return attestedTokens[attestationID].wrappedTokenAddress != address(0);
    }

    function attestToken(
        TokenAttestation memory attestation
    ) external
    {
        require(
            attestation.tokenAddress != address(0) &&
            attestation.tokenChain != 0 &&
            attestation.decimals != 0 &&
            bytes(attestation.symbol).length != 0 &&
            bytes(attestation.name).length != 0,
            "invalid attestation param"
        );

        bytes32 attestationID = keccak256(
            abi.encodePacked(
                attestation.tokenAddress,
                attestation.tokenChain
            )
        );
        TokenAttestation storage sAttestation = attestedTokens[attestationID];
        require(
            sAttestation.wrappedTokenAddress == address(0),
            "the attestation already exsit"
        );

        if (attestation.wrappedTokenAddress == address(0)) {
            MappingToken wrappedToken = new MappingToken(
                attestation.name,
                attestation.symbol,
                attestation.decimals,
                crossBridge
            );
            attestation.wrappedTokenAddress = address(wrappedToken);
        }

        attestedTokens[attestationID] = attestation;
        wrappedAttestedTokens[attestation.wrappedTokenAddress] = attestation;
    }

    modifier onlyCrossBridge() {

        require(
            msg.sender == crossBridge,
            "only cross bridge can call"
        );
        _;
    }

}
