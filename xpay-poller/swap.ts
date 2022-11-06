// import fetch from 'node-fetch';
import axios from 'axios';
import qs from 'qs'
import bigDecimal from 'js-big-decimal';
import {ALCHEMY_API_KEY, CONTRACT_USDC, CONTRACT_WMATIC,TOKEN_LIST, MERCHANT_COLLECTION_NAME, POLYGON_CHAIN_ID, POLYGON_NETWORK, WORMHOLE_COLLECTION_NAME, ZERO_EX_ADDRESS, OUR_SWAPPER_CONTRACT, USE_OUR_CONTRACT} from './constants'
import {createAlchemyWeb3} from "@alch/alchemy-web3"

import { ERC20_ABI } from './abi';
import {covalentGetTransaction} from './covalent'
import { FIRESTORE_DB, QUICKNODE_ENDPOINT } from "./constants";
import { Firestore } from "@google-cloud/firestore";
import Web3 from 'web3';

require('dotenv').config()

let web3 = new Web3(new Web3.providers.HttpProvider(QUICKNODE_ENDPOINT));
let swapperAccount = web3.eth.accounts.privateKeyToAccount(process.env.SWAPPER_PK as string)
let testAccount = web3.eth.accounts.privateKeyToAccount(process.env.TEST_PK as string)
web3.eth.accounts.wallet.add(swapperAccount)
web3.eth.accounts.wallet.add(testAccount)
web3.eth.defaultAccount = swapperAccount.address
console.log('our swapper address is ', swapperAccount.address)

async function sleep(ms: number) {
    await new Promise(f => setTimeout(f, ms));
}

// Get quote in USDC for amount of input token
async function get0xQuoteFor(network: string, sell_contract: string, buy_contract: string, amount: string): Promise<any> {
    if (network == "mainnet") {
        network = "polygon";
    }
    const params = {
        sellToken: sell_contract,
        // native polygon usdc
        buyToken: buy_contract,
        sellAmount: amount,
        // takerAddress: '0x3ad57b83b2e3dc5648f32e98e386935a9b10bb9f' //web3.eth.defaultAccount,
    }
    try {
        let url = `https://${network}.api.0x.org/swap/v1/quote?${qs.stringify(params)}`;
        console.log(url);
        const response = await axios.get(url);
        return response;

    } catch(e:any) {
        console.log("error querying axios")
        let err = Error("unsupported token")
        throw err
    }
}

// input token amount in satoshi
// returns usdc amount in dollars, not satoshi.
async function get0xUSDCQuoteFor(network: string, contract: string, amount: string): Promise<string> {

    let usdc_token = CONTRACT_USDC;
    let res = await get0xQuoteFor(network, contract, usdc_token, amount)
    let factor = 10 ** 6;
    if (network == 'mumbai') {
        factor = 10 ** 18;
    }
    let usdc_real = (new bigDecimal(res.data.buyAmount)).divide(new bigDecimal(factor), 6)
    return usdc_real.getValue();
}

// amount_usdc in dollars, not satoshi.
// returns amount of token in satoshi.
async function get0xTokenQuoteForUSDC(network: string, contract: string, amount_usdc: string): Promise<string> {

    let usdc_token = CONTRACT_USDC;
    let factor = 10 ** 6;
    if (network == 'mumbai') {
        factor = 10 ** 18;
    }

    let usdc_satoshi = (new bigDecimal(amount_usdc)).multiply(new bigDecimal(factor))
    let res = await get0xQuoteFor(network, usdc_token, contract, usdc_satoshi.getValue())

    return res.data.buyAmount
}

// swap amount of given token for USDC.  contract may be "MATIC" to swap native matic.
async function execute_usdc_swap_for(network: string, contract: string, amount_token: bigDecimal, use_our_contract: boolean, merchant_addr_maybe: string): Promise<any> {
    let to_buy = CONTRACT_USDC
    let to_sell = contract

    // Set up a DAI allowance on the 0x contract if needed.
    if (to_sell != "MATIC") {
        const wmatic = new web3.eth.Contract(ERC20_ABI as any, to_sell);
        wmatic.options.gas = 300000;
        wmatic.options.gasPrice = "100000000000";
        wmatic.options
        let contract_to_give_allowance_for = ZERO_EX_ADDRESS;
        if (use_our_contract) {
            contract_to_give_allowance_for = OUR_SWAPPER_CONTRACT;
        }

        const currentAllowance = new bigDecimal(
            await wmatic.methods.allowance(web3.eth.defaultAccount, contract_to_give_allowance_for).call()
        );
        console.log("current allowance", currentAllowance);

        if (currentAllowance.compareTo(amount_token) <= 0) {
            console.log('not enough allowance, sending more..')
            await wmatic
                .methods.approve(contract_to_give_allowance_for, (new bigDecimal(10)).multiply(amount_token).getValue())
                .send({ from: web3.eth.defaultAccount });
        }
    }

    let res = await get0xQuoteFor(network, to_sell, to_buy, amount_token.getValue())
    console.log("0x quote", res);
    res.data['gas'] = 750000;
    if (use_our_contract) {
        console.log('we need to modify',res.data)
        // send to our contract instead
        res.data['to'] = OUR_SWAPPER_CONTRACT
        // update our new function sig
        res.data.data = res.data.data.replace("0x415565b0", "0xa4b6e171")
        // res.data.data = res.data.data.replace("0x415565b0", "")
        // res.data.data = res.data.data.replace("0x415565b0", "0xd9f8c552")
        // tag on our merchant destination
        let merchant_addr = merchant_addr_maybe.replace("0x", '')
        if (merchant_addr.length != 40) {
            throw "wrong length for merchant addr"
        }
        res.data.data = res.data.data + "000000000000000000000000" +  merchant_addr
        console.log('our modification',res.data)

        let tx = await web3.eth.sendTransaction(res.data);
        return tx

    } else {

        let tx = await web3.eth.sendTransaction(res.data);
        return tx
    }
}

async function main_test_quote() {
    for (var token of TOKEN_LIST) {
        console.log("getting quote for " + token.asset, token.network)
        let quote_usdc = await get0xUSDCQuoteFor(token.network, token.contract, (new bigDecimal(10 ** 18)).getValue())
        console.log(`for 1 ${token.asset} we will get $${quote_usdc}`)
    }
}

async function main_test_swap() {
    console.log('main_test_swap')

    let wmatic_to_swap = (new bigDecimal(0.02)).multiply(new bigDecimal(10 ** 18))
    await execute_usdc_swap_for(POLYGON_NETWORK, "MATIC", wmatic_to_swap, false, "")

    let amount_matic_satoshi = await get0xTokenQuoteForUSDC(POLYGON_NETWORK, "MATIC", "20")

    let matic = (new bigDecimal(amount_matic_satoshi)).multiply(new bigDecimal("1.05")).divide(new bigDecimal(10 ** 18),4).getValue()
    console.log(`we need to pay ${matic} for a $20 solokey`)
}

interface WormholeEntry {
    chainId: number,
    sequence: string,
    orderId: number,
    merchantId: string,
    targetTx: string,
    swapTx: string,
    usdcTx: string,
    emitterAddress: string,
    status: string,
    vaa: string,
    documentId: string | undefined,
}

interface MerchantEntry {
    merchantId: string,
    merchantAddress: string,
}

async function get_latest_wormhole_entries(firestore: Firestore, status: string): Promise<WormholeEntry[]>{
    let collection = firestore.collection(WORMHOLE_COLLECTION_NAME).where("status", "==", status);
    let q = await collection.get()
    let entries: WormholeEntry[] = [];
    for(var doc of q.docs) {
        let data = doc.data();
        data.documentId = doc.id;
        entries.push(data as WormholeEntry)
    }
    return entries
}

async function get_mechant_entry(firestore: Firestore, merchantId: string): Promise<MerchantEntry>{
    let collection = firestore.collection(MERCHANT_COLLECTION_NAME);
    let q = await collection.where("merchantId", "==", merchantId).get()
    if (q.docs.length < 1) {
        throw Error("merchant id not found")
    }
    // q.
    let entry = q.docs[0].data() as MerchantEntry
    return entry;
    // return {} as MerchantEntry
}

export async function poll_swaps_from_firebase(status: string) {
    let entries = await get_latest_wormhole_entries(FIRESTORE_DB, status);
    console.log(entries)
    for(var entry of entries) {
        let merchantEntry;
        try {
            merchantEntry = await get_mechant_entry(FIRESTORE_DB, entry.merchantId)
            // console.log(merchantEntry)
        } catch(e) {
            if (entry.merchantId != '0') {
                console.log('could not find ', entry.merchantId, 'for', entry.targetTx)
            }
            let collection = FIRESTORE_DB.collection(WORMHOLE_COLLECTION_NAME);
            await collection.doc(entry.documentId as string).update({
                status: "ERROR",
            })
            continue
        }
        let tx_info;
        try {
            console.log(entry.documentId);
            tx_info = await covalentGetTransaction(POLYGON_CHAIN_ID, entry.targetTx, swapperAccount.address);
        } catch (e) {
            throw e;
        }
        if (tx_info.to_address.toLowerCase() != swapperAccount.address.toLowerCase()) {
            console.log('warning: skipping tx to wrong swapper address: ', tx_info.to_address)
            continue
        }
        if (tx_info.to_address.toLowerCase() == swapperAccount.address.toLowerCase() && entry.status == "SUBMITTED") {
            // console.log("transaction", tx_info)
            console.log(`ready to swap ${tx_info.token_amount} of ${tx_info.token_name} token ${tx_info.token_contract}`)
            let amount = new bigDecimal(tx_info.token_amount)
            try {

                let swap_tx = await execute_usdc_swap_for(POLYGON_NETWORK, tx_info.token_contract, amount, USE_OUR_CONTRACT, merchantEntry.merchantAddress)
                let collection = FIRESTORE_DB.collection(WORMHOLE_COLLECTION_NAME);
                if (USE_OUR_CONTRACT) {
                    console.log(`sending USDC to a happy merchant ${merchantEntry.merchantAddress}`)
                    await collection.doc(entry.documentId as string).update({
                        status: "COMPLETE",
                        swapTx: swap_tx.transactionHash,
                        usdcTx: swap_tx.transactionHash,
                    })
                    console.log('SWAPPED and COMPLETED', tx_info.token_amount)

                } else {
                    await collection.doc(entry.documentId as string).update({
                        status: "SWAPPED",
                        swapTx: swap_tx.transactionHash,
                    })
                    console.log('SWAPPED', tx_info.token_amount)

                }
            } catch(e:any) {
                if (e.message != undefined && e.message != null) {
                    if (e.message.indexOf("unsupported token")!=-1) {
                        console.log("unsupport token!", e)
                        continue
                    } 
                }
                throw e
            }
        }

        if (tx_info.to_address.toLowerCase() == swapperAccount.address.toLowerCase() && entry.status == "SWAPPED") {
            // now we have to send the usdc amount we got out of the swapper tx
            console.log('checking ', entry.swapTx)
            if (entry.swapTx == '' || entry.swapTx == undefined) {
                let collection = FIRESTORE_DB.collection(WORMHOLE_COLLECTION_NAME);
                await collection.doc(entry.documentId as string).update({
                    status: "ERROR",
                })
                continue
            }
            let tx_info;
            try {
                tx_info = await covalentGetTransaction(POLYGON_CHAIN_ID, entry.swapTx, swapperAccount.address);
            } catch (e) {
                throw e;
            }
            if (tx_info.to_address.toLowerCase() != swapperAccount.address.toLowerCase()) {
                console.log('warning: our usdc transfer didn\'t swap to our address, but instead went to ', tx_info.to_address)
                continue
            }
            if (tx_info.token_name != "USDC") {
                console.log('we got swapped something other than USDC: ', tx_info.token_name)
                console.log("I guess we'll just send this to the merchant instead.")
            }
            // console.log("swapped tx", tx_info)

            // now to send the fresh usdc to the happy little merchant
            const usdc = new web3.eth.Contract(ERC20_ABI as any, tx_info.token_contract);
            usdc.options.gas = 300000

            let usdc_human = (new bigDecimal(tx_info.token_amount)).divide(new bigDecimal(10 ** tx_info.token_decimals),4).getValue()

            console.log(`sending ${usdc_human} ${tx_info.token_name} to a happy merchant`)
            let tx = await usdc
                .methods.transfer(merchantEntry.merchantAddress, tx_info.token_amount)
                .send({ from: swapperAccount.address }); 
            let collection = FIRESTORE_DB.collection(WORMHOLE_COLLECTION_NAME);
            await collection.doc(entry.documentId as string).update({
                status: "COMPLETE",
                usdcTx: tx.transactionHash,
            })
        }
    }
}


async function run_test_matic_transfer() {
    // insert our merchant id if it doesn't exist
    let merchantId = "testwmatic-conor"
    try {
        await get_mechant_entry(FIRESTORE_DB, merchantId)
    } catch(e) {
        console.log('creating merchant ID', merchantId)
        let collection = FIRESTORE_DB.collection(MERCHANT_COLLECTION_NAME);
        let entry: MerchantEntry = {
            merchantAddress: testAccount.address,
            merchantId: merchantId,
        }
        await collection.add(entry)


    }
    // sanity check it got added
    await get_mechant_entry(FIRESTORE_DB, merchantId)
    console.log('preparing simulated wh transfer..')

    // first we send some wmatic over to our swapper address and pretend it's a wh transfer
    // by creating an appropiate firebase entry.
    let wmatic_amount = (new bigDecimal("0.0031")).multiply(new bigDecimal(10 ** 18))
    const wmatic = new web3.eth.Contract(ERC20_ABI as any, CONTRACT_WMATIC);
    wmatic.options.gas = 300000

    let tx = await wmatic
        .methods.transfer(swapperAccount.address, wmatic_amount.getValue())
        .send({ from: testAccount.address }); 
    // console.log(tx)

    let collection = FIRESTORE_DB.collection(WORMHOLE_COLLECTION_NAME);
    let wh_entry: WormholeEntry = {
        chainId: POLYGON_CHAIN_ID,
        emitterAddress: testAccount.address,
        merchantId: merchantId,
        orderId: (Math.random() * 1000) | 0,
        sequence: ((Math.random() * 100000) | 0) + "",
        status: "SUBMITTED",
        targetTx: tx.transactionHash,
        vaa: "11112222333323956324095623049650394287598032749805723aaafffeeeccc",
        swapTx: "",
        usdcTx: "",
    } as WormholeEntry
    await collection.add(wh_entry)
    console.log('sent some wmatic to our swapper address and marked it as a SUBMITED wh tx.')
    console.log('sleeping 10s and then running 1 poll loop.')
    await sleep(5000)
    await poll_swaps_from_firebase("SUBMITTED")

}

async function run_signature(){
    /*
    interface ISwapTransfer {
    function swapThenTransfer(
        address recipient,
        IERC20 inputToken,
        IERC20 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] memory transformations
    ) external payable;
    }
    */
   // 0x415565b0 -> 0xa4b6e171 -> 0xd9f8c552
    let fsig = 'transformERC20(address,address,uint256,uint256,(uint32,bytes)[])';
    let encodedSig= web3.eth.abi.encodeFunctionSignature(fsig);
    let newfsig = 'swapThenTransfer(address,address,address,uint256,uint256,(uint32,bytes)[])';
    let newEncodedSig = web3.eth.abi.encodeFunctionSignature(newfsig);
    console.log(encodedSig, '->', newEncodedSig)
}

if (require.main === module) {
    // run_signature().then(()=>{
    // poll_swaps_from_firebase().then(()=>{
    run_test_matic_transfer().then(()=>{
        console.log('done')
    }).catch((e)=>{
        console.log('main exception', e)
    })
}