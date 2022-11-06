import { ethers } from "hardhat";

async function main() {
  // mumbai
  // const swapProxyAddress = "0xf471d32cb40837bf24529fcf17418fc1a4807626";
  // const usdcAddress = "e11a86849d99f524cac3e7a0ec1241828e332c62";
  // polygon mainnet
  const swapProxyAddress = "0xdef1c0ded9bec7f1a1670819833240f027b25eff";
  const usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

  const SwapTransfer = await ethers.getContractFactory("SwapTransfer");
  const swapTransfer = await SwapTransfer.deploy(swapProxyAddress, usdcAddress);

  await swapTransfer.deployed();

  console.log(`SwapTransfer deployed to ${swapTransfer.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
