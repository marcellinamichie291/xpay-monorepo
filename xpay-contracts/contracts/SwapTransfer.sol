// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
// import "@0x/contracts-zero-ex/contracts/src/features/interfaces/ITransformERC20Feature.sol";

struct Transformation {
    // The deployment nonce for the transformer.
    // The address of the transformer contract will be derived from this
    // value.
    uint32 deploymentNonce;
    // Arbitrary data to pass to the transformer.
    bytes data;
}

interface ITransformERC20Feature {
    function transformERC20(
        IERC20 inputToken,
        IERC20 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] calldata transformations
    ) external payable returns (uint256 outputTokenAmount);
}

contract SwapTransfer {
    address public swapProxy;
    address payable public outputToken;
    address payable public owner;

    event Swap(uint amount, uint when);

    constructor(address _swapProxy, address _outputToken) payable {
        swapProxy = _swapProxy;
        outputToken = payable(_outputToken);
        owner = payable(msg.sender);
    }

    function swap(
        IERC20 inputToken,
        IERC20 outputTokenFromData,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] memory transformations
    ) public returns (uint256 outputTokenAmount) {
        require(address(outputToken) == address(outputTokenFromData), "invalid output token");
        ITransformERC20Feature swap;

        // transfer inputToken from sender into this contract
        inputToken.transferFrom(msg.sender, address(this), inputTokenAmount);

        // approve swap proxy to use this contract's inputToken
        inputToken.approve(swapProxy, inputTokenAmount);

        // do the swap
        swap = ITransformERC20Feature(swapProxy);
        outputTokenAmount = swap.transformERC20(inputToken, outputTokenFromData, inputTokenAmount, minOutputTokenAmount, transformations);
        emit Swap(outputTokenAmount, block.timestamp);
        return outputTokenAmount;
    }

    function transfer(
        address recipient,
        uint256 outputTokenAmount
    ) public payable {
        // transfer outputToken to the final recipient
        // outputToken.approve(address(this), outputTokenAmount);
        // outputToken.transferFrom(address(this), recipient, outputTokenAmount);
        IERC20(outputToken).transfer(recipient, outputTokenAmount);
    }
}
