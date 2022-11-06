"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // const swapProxyAddress = "0xf471d32cb40837bf24529fcf17418fc1a4807626";
        const swapProxyAddress = "0xdef1c0ded9bec7f1a1670819833240f027b25eff";
        const SwapTransfer = yield hardhat_1.ethers.getContractFactory("SwapTransfer");
        const swapTransfer = yield SwapTransfer.deploy(swapProxyAddress);
        yield swapTransfer.deployed();
        console.log(`SwapTransfer deployed to ${swapTransfer.address}`);
    });
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
