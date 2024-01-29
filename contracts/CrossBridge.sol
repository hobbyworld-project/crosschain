// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ICrossBridge, ITokenFactory } from "./interfaces/ICrossBridge.sol";
import { IMappingToken } from "./interfaces/IMappingToken.sol";
import { IWrapped } from "./interfaces/IWrapped.sol";


contract CrossBridge is ICrossBridge, Ownable {

    address public relayer;

    ITokenFactory public immutable tokenFactory;

    mapping(bytes32 => TokenTransfer) public tokenTransfers;

    uint256 public testState;


    constructor(address _relayer, address _factory) Ownable(msg.sender) {

        require(
            _relayer != address(0),
            "invalid relayer address"
        );
        require(
            _factory != address(0),
            "invalid factory address"
        );
        relayer = _relayer;
        tokenFactory = ITokenFactory(_factory);
    }

    function setTestState(uint256 _testState) public {

        testState = _testState;
    }

    function bridgeTokens(
        address _token,
        uint256 _amount,
        uint256 _dstChain,
        address _dstAddress
    ) external payable
    {
        require(
            _token != address(0),
            "invalid token address"
        );
        require(
            _amount != 0,
            "amount can not be zero"
        );
        require(
            _dstAddress != address(0),
            "invalid dst address"
        );


        if (msg.value != 0) {
            require(
                msg.value == _amount,
                "transfer eth value is incorrect"
            );
            IWrapped(_token).deposit{ value: msg.value }();
        } else {
            IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        }

        bytes32 _transferID = keccak256(
            abi.encodePacked(
                block.timestamp,
                block.chainid,
                msg.sender,
                _dstChain,
                _dstAddress,
                _token,
                _amount
            )
        );
        tokenTransfers[_transferID] = TokenTransfer({
            tokenTransfer: TokenTransferBase({
                timestamp: block.timestamp,
                srcChain: block.chainid,
                srcAddress: msg.sender,
                dstChain: _dstChain,
                dstAddress: _dstAddress,
                tokenAddress: _token
            }),
            amount: _amount
        });

        emit TokensBridged(_transferID, TokenType.Fungible);
    }

    function bridgeTokensBack(
        uint256 _amount,
        address _to,
        bytes32 _attestationID,
        bool _convertToNative
    ) external
    {
        require(
            _amount != 0,
            "amount can not be zero"
        );
        require(
            _to != address(0),
            "invalid to address"
        );

        (, , , , , , address wrappedToken) = tokenFactory.attestedTokens(_attestationID);
        require(
            wrappedToken != address(0),
            "invalid attestationID"
        );
        IMappingToken(wrappedToken).burn(msg.sender, _amount);

        emit TokensBridgedBack(_amount, _to, _attestationID, _convertToNative);
    }


    function releaseWrappedTokens(
        uint256 _amount,
        address _to,
        bytes32 _attestationID
    ) external onlyRelayer
    {
        require(
            _amount != 0,
            "amount can not be zero"
        );
        require(
            _to != address(0),
            "invalid to address"
        );

        (, , , , , , address wrappedToken) = tokenFactory.attestedTokens(_attestationID);
        require(
            wrappedToken != address(0),
            "invalid attestationID"
        );
        IMappingToken(wrappedToken).mint(_to, _amount);

        emit WrappedTokensReleased(_amount, _to, _attestationID);
    }

    function releaseTokens(
        uint256 _amount,
        address _to,
        address _token,
        bool _convertToNative
    ) external onlyRelayer
    {
        require(
            _amount != 0,
            "amount can not be zero"
        );
        require(
            _to != address(0),
            "invalid to address"
        );
        require(
            _token != address(0),
            "invalid token address"
        );

        if (_convertToNative == true) {
            IWrapped(_token).withdraw(_amount);
            payable(_to).transfer(_amount);
        } else {
            IERC20(_token).transfer(_to, _amount);
        }

        emit TokensReleased(_amount, _to, _token, _convertToNative);
    }


    function getWrappedToken(
        address _tokenAddress,
        uint256 _tokenChain
    ) external view returns (address wrappedToken)
    {
        return tokenFactory.getWrappedToken(_tokenAddress, _tokenChain);
    }

    function getSourceToken(
        address _wrappedToken
    ) external view returns (address sourceToken, uint256 sourceChainID)
    {
        return tokenFactory.getSourceToken(_wrappedToken);
    }

    function isTokenSupported(
        address _tokenAddress,
        uint256 _tokenChain
    ) external view returns (bool)
    {
        return tokenFactory.isTokenSupported(_tokenAddress, _tokenChain);
    }

    function attestToken(
        ITokenFactory.TokenAttestation memory attestation
    ) external onlyRelayer
    {
        tokenFactory.attestToken(attestation);
    }


    function changeRelayer(address _relayer) external onlyOwner {

        require(
            _relayer != address(0),
            "invalid relayer address"
        );
        relayer = _relayer;
    }

    modifier onlyRelayer() {

        require(
            msg.sender == relayer,
            "only relayer can call"
        );
        _;
    }
}