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

interface ISwapTransfer {
    function swapThenTransfer(
        IERC20 inputToken,
        IERC20 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] memory transformations,
        address recipient
    ) external payable;
}

contract SwapTransfer {
    address public swapProxy;
    address payable public owner;

    event Swap(uint amount, uint when);

    constructor(address _swapProxy) payable {
        swapProxy = _swapProxy;
        owner = payable(msg.sender);
    }

    function swapThenTransfer(
        IERC20 inputToken,
        IERC20 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] memory transformations,
        address recipient
    ) public {
        uint256 outputTokenAmount;
        ITransformERC20Feature swap;

        // transfer inputToken from sender into this contract
        inputToken.transferFrom(msg.sender, address(this), inputTokenAmount);

        // approve swap proxy to use this contract's inputToken
        inputToken.approve(swapProxy, inputTokenAmount);

        // do the swap
        swap = ITransformERC20Feature(swapProxy);
        outputTokenAmount = swap.transformERC20(inputToken, outputToken, inputTokenAmount, minOutputTokenAmount, transformations);
        emit Swap(outputTokenAmount, block.timestamp);

        // transfer outputToken to the final recipient
        outputToken.transfer(recipient, outputTokenAmount);
    }
}
