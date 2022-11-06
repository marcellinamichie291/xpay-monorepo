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
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("SwapTransfer", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    function deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            // Contracts are deployed using the first signer/account by default
            const [owner, swapProxy] = yield hardhat_1.ethers.getSigners();
            const SwapTransfer = yield hardhat_1.ethers.getContractFactory("SwapTransfer");
            const swapTransfer = yield SwapTransfer.deploy(swapProxy.address);
            return { swapTransfer, owner, swapProxy };
        });
    }
    describe("Deployment", function () {
        it("Should set the right swap proxy", function () {
            return __awaiter(this, void 0, void 0, function* () {
                const { swapTransfer, swapProxy } = yield (0, hardhat_network_helpers_1.loadFixture)(deploy);
                (0, chai_1.expect)(yield swapTransfer.swapProxy()).to.equal(swapProxy.address);
            });
        });
        it("Should set the right owner", function () {
            return __awaiter(this, void 0, void 0, function* () {
                const { swapTransfer, owner } = yield (0, hardhat_network_helpers_1.loadFixture)(deploy);
                (0, chai_1.expect)(yield swapTransfer.owner()).to.equal(owner.address);
            });
        });
    });
    /*describe("Withdrawals", function () {
      describe("Validations", function () {
        it("Should revert with the right error if called too soon", async function () {
          const { lock } = await loadFixture(deploy);
  
          await expect(lock.withdraw()).to.be.revertedWith(
            "You can't withdraw yet"
          );
        });
  
        it("Should revert with the right error if called from another account", async function () {
          const { lock, unlockTime, otherAccount } = await loadFixture(
            deploy
          );
  
          // We can increase the time in Hardhat Network
          await time.increaseTo(unlockTime);
  
          // We use lock.connect() to send a transaction from another account
          await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
            "You aren't the owner"
          );
        });
  
        it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
          const { lock, unlockTime } = await loadFixture(
            deploy
          );
  
          // Transactions are sent using the first signer by default
          await time.increaseTo(unlockTime);
  
          await expect(lock.withdraw()).not.to.be.reverted;
        });
      });
  
      describe("Events", function () {
        it("Should emit an event on withdrawals", async function () {
          const { lock, unlockTime, lockedAmount } = await loadFixture(
            deploy
          );
  
          await time.increaseTo(unlockTime);
  
          await expect(lock.withdraw())
            .to.emit(lock, "Withdrawal")
            .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
        });
      });
  
      describe("Transfers", function () {
        it("Should transfer the funds to the owner", async function () {
          const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
            deploy
          );
  
          await time.increaseTo(unlockTime);
  
          await expect(lock.withdraw()).to.changeEtherBalances(
            [owner, lock],
            [lockedAmount, -lockedAmount]
          );
        });
      });
    });
    */
});
