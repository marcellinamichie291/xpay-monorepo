import { ethers } from "hardhat";

async function main() {
  // const swapProxyAddress = "0xf471d32cb40837bf24529fcf17418fc1a4807626";
  const swapProxyAddress = "0xdef1c0ded9bec7f1a1670819833240f027b25eff";

  const SwapTransfer = await ethers.getContractFactory("SwapTransfer");
  const swapTransfer = await SwapTransfer.deploy(swapProxyAddress);

  await swapTransfer.deployed();

  console.log(`SwapTransfer deployed to ${swapTransfer.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
