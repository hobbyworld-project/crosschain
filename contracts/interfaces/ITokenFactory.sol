// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { ICrossBridge } from "./ICrossBridge.sol";


interface ITokenFactory {

    function attestedTokens(
        bytes32 attestationID
    ) external view returns (
        address tokenAddress,
        uint256 tokenChain,
        ICrossBridge.TokenType tokenType,
        uint8 decimals,
        string memory symbol,
        string memory name,
        address wrappedTokenAddress
    );


    function wrappedAttestedTokens(
        address wrappedToken
    ) external view returns (
        address tokenAddress,
        uint256 tokenChain,
        ICrossBridge.TokenType tokenType,
        uint8 decimals,
        string memory symbol,
        string memory name,
        address wrappedTokenAddress
    );


    function getWrappedToken(
        address _tokenAddress,
        uint256 _tokenChain
    ) external view returns (address wrappedToken);


    function getSourceToken(
        address _wrappedToken
    ) external view returns (address sourceToken, uint256 sourceChainID);


    function isTokenSupported(
        address _tokenAddress,
        uint256 _tokenChain
    ) external view returns (bool);


    function attestToken(
        TokenAttestation memory attestation
    ) external;


    struct TokenAttestation {
        address tokenAddress;
        uint256 tokenChain;
        ICrossBridge.TokenType tokenType;
        uint8 decimals;
        string symbol;
        string name;
        address wrappedTokenAddress;
    }



}