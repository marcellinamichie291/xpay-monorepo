// poller monitors txns coming into our polygon deposit address.
require('dotenv').config();

const { getSignedVAA, redeemOnEth } = require('@certusone/wormhole-sdk');
const { Wallet, providers, BigNumber } = require('ethers');
const constants = require('./constants');
const swap = require('./swap');

class FixedGasPriceProvider extends providers.JsonRpcProvider {
  constructor(url, defaultGasPrice) {
    super(url)
    this.defaultGasPrice = defaultGasPrice;
  }

  async getGasPrice() {
    return BigNumber.from(this.defaultGasPrice.toString())
  }

  async getFeeData() {
    return {
      maxFeePerGas: BigNumber.from(70000000000),
      maxPriorityFeePerGas: BigNumber.from(30000000000)
    }
  }
}

const PROVIDER = new FixedGasPriceProvider(constants.QUICKNODE_ENDPOINT, 400000);
const COLLECTION = constants.FIRESTORE_DB.collection(constants.WORMHOLE_COLLECTION_NAME);

// call the polling functions
pollCreated();
pollSigned();
pollSubmitted();

// poll firebase for "CREATED" transactions
// query guardians for status
// if signed by guardians, add the VAA to db and update status to "SIGNED"
async function pollCreated() {
  const finalizedTx = await COLLECTION.where("status", "==", "CREATED").get();
  if (finalizedTx.empty) return;
  finalizedTx.forEach(async (doc) => {
    const {
      chainId,
      emitterAddress,
      sequence
    } = doc.data();

    // try fetching the VAA using this info
    let signedVaa;
    try {
      signedVaa = await getSignedVAA(constants.WH_RPC_HOST, chainId, emitterAddress, sequence);
    } catch (e) {
      console.error("could not get signed vaa");
      console.error(e);
      return
    }

    // we have the vaa. add to db and update status to "SIGNED"
    COLLECTION.doc(doc.id).update({
      vaa: Buffer.from(signedVaa.vaaBytes).toString('hex'),
      status: "SIGNED"
    })
      .then(console.log)
      .catch(console.error);
  });
}

// poll firebase for "SIGNED" transactions
// submit vaa to the wormhole contract on polygon
// add the submission tx hash to db and update status to "SUBMITTED"
async function pollSigned() {
  const signedTx = await COLLECTION.where("status", "==", "SIGNED").get();
  if (signedTx.empty) return;
  let vaas = [];

  signedTx.forEach(doc => {
    const { vaa } = doc.data();
    vaas.push({
      id: doc.id,
      vaa: vaa,
    });
  });

  // one by one we submit the tx to avoid nonce issues
  for (let i = 0; i < vaas.length; i++) {
    const { id, vaa } = vaas[i];
    const vaaUintArray = Buffer.from(vaa, 'hex');

    // use sdk to submit tx
    console.log("pre redeem eth");
    const receipt = await redeemOnEth(
      constants.TOKEN_BRIDGE_ADDRESS,
      new Wallet(process.env.RELAYER_PK, PROVIDER),
      vaaUintArray
    );

    // db update can happen asynchronously
    COLLECTION.doc(id).update({
      targetTx: receipt.transactionHash,
      status: "SUBMITTED"
    })
      .then(console.log)
      .catch(console.error);
  }
}

// poll firebase for "SUBMITTED" transactions
// lookup submission tx hash using covalent.
// if the tx is finalized, then perform 0x swap to USDC
// add swap tx hash to db and update status to "SWAPPED"
async function pollSubmitted() {
  try {
    await swap.poll_swaps_from_firebase("SUBMITTED")
  } catch (e) {
    console.error(e);
    console.error("couldn't poll submitted transactions")
  }
}

// poll firebase for "SWAPPED" transactions
// lookup swap tx hash. if finalized, then send to the recipient
// find recipient using the merchantId
// update status to "COMPLETED"
async function pollSwapped() {
  try {
    await swap.poll_swaps_from_firebase("SWAPPED")
  } catch (e) {
    console.error("couldn't poll swapped transactions");
  }
}