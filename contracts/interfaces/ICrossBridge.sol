// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./ITokenFactory.sol";


interface ICrossBridge {

    enum TokenType { 
        Fungible,
        NonFungible
    }

    struct TokenTransferBase {
        uint256 timestamp;
        uint256 srcChain;
        address srcAddress;
        uint256 dstChain;
        address dstAddress;
        address tokenAddress;
    }

    struct TokenTransfer {
        TokenTransferBase tokenTransfer;
        uint256 amount;
    }


    function bridgeTokens(
        address _token,
        uint256 _amount,
        uint256 _dstChain,
        address _dstAddress
    ) external payable;

    event TokensBridged(
        bytes32 indexed transferID,
        TokenType indexed tokenType
    );


    function bridgeTokensBack(
        uint256 _amount,
        address _to,
        bytes32 _attestationID,
        bool _convertToNative
    ) external;


    event TokensBridgedBack(
        uint256 indexed amount,
        address indexed to,
        bytes32 indexed attestationID,
        bool convertToNative
    );


    function releaseWrappedTokens(
        uint256 _amount,
        address _to,
        bytes32 _attestationID
    ) external;

    event WrappedTokensReleased(
        uint256 indexed amount,
        address indexed to,
        bytes32 indexed attestationID
    );

    function releaseTokens(
        uint256 _amount,
        address _to,
        address _token,
        bool _convertToNative
    ) external;

    event TokensReleased(
        uint256 indexed amount,
        address indexed to,
        address indexed token,
        bool convertToNative
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
        ITokenFactory.TokenAttestation memory attestation
    ) external;


}