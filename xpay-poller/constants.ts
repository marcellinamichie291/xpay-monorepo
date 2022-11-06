const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Change this to true to use our polygon contract
export let USE_OUR_CONTRACT = true;

export const DEPOSIT_ADDRESS = "0x1A8df09eF4239768E0fC695a6B4E122ae374Fa89";
export const RELAYER_ADDRESS = "0x1A8df09eF4239768E0fC695a6B4E122ae374Fa89";
export const COVALENT_API_KEY = "ckey_2df49266a766464382aa406dc6e";
// export const ALCHEMY_API_KEY = "24AbzWQuoDBDMLSmQzQq4Ipt0hwME7xE";
export const ALCHEMY_API_KEY = "61zLlMg4BZJUSpU65QgrULEniBLNb-X0";

export const QUICKNODE_ENDPOINT = "https://summer-nameless-pond.matic.discover.quiknode.pro/f105f405591b3c451a94c29db07a4be4b71e7f7e/";

export const ALCHEMY_NETWORK = process.env.NODE_ENV === "production"
  ? "matic"
  : "maticmum";

export const ZERO_EX_ADDRESS = process.env.NODE_ENV === "production"
? "0xdef1c0ded9bec7f1a1670819833240f027b25eff"
: "0xf471d32cb40837bf24529fcf17418fc1a4807626";

export const POLYGON_NETWORK = process.env.NODE_ENV === "production"
  ? "mainnet"
  : "mumbai";

export const POLYGON_CHAIN_ID = process.env.NODE_ENV === "production"
  ? 137
  : 80001;

export const CONTRACT_WMATIC = process.env.NODE_ENV === "production"
  ? "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"
  : "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889";

export const CONTRACT_USDC = process.env.NODE_ENV === "production"
  ? "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
  : "0xe11A86849d99F524cAC3E7A0Ec1241828e332C62";

export const OUR_SWAPPER_CONTRACT = process.env.NODE_ENV === "production"
  ? "0x702b46443619C552eB348892a4Dc798B199B98cE"
  : "0xddBd5E4dc74Bd0fAb16D424917fDDDD05A9C8417";


export const WORMHOLE_COLLECTION_NAME = "test";
export const MERCHANT_COLLECTION_NAME = "test-merchant";

export const WH_RPC_HOST = process.env.NODE_ENV === "production"
  ? "https://wormhole-v2-mainnet-api.certus.one"
  : "https://wormhole-v2-testnet-api.certus.one"

export const TOKEN_BRIDGE_ADDRESS = process.env.NODE_ENV === "production"
  ? "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE"
  : "0x377D55a7928c046E18eEbb61977e714d2a76472a";


const SERVICE_ACCOUNT = require('./private/xpay-bec12-firebase-adminsdk-8z5fx-76d9d67065.json');
initializeApp({
  credential: cert(SERVICE_ACCOUNT)
});
export const FIRESTORE_DB = getFirestore();

export let TOKEN_LIST = [
    {
        asset: "Token Wrapped BNB (Wormhole)",
        contract: "0xecdcb5b88f8e3c15f95c720c51c71c9e2080525d",
        decimals: 18,
        network: "polygon"
    },
    {
        asset: "BUSD Token (Wormhole)",
        contract: "0xa8d394fe7380b8ce6145d5f85e6ac22d4e91acde",
        decimals: 18,
        network: "polygon"
    },
    {
        asset: "Wrapped Ether (Wormhole)",
        contract: "0x11cd37bb86f65419713f30673a480ea33c826872",
        decimals: 18,
        network: "polygon"
    },
    {
        asset: "LUNA (Wormhole) (LUNA)",
        contract: "0x9cd6746665d9557e1b9a775819625711d0693439",
        decimals: 18,
        network: "polygon"
    },

    {
        asset: "WMATIC",
        contract: "0x9c3c9283d3e44854697cd22d3faa240cfb032889",
        decimals: 18,
        network: "mumbai"
    },
    {
        asset: "WETH",
        contract: "0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa",
        decimals: 18,
        network: "mumbai"
    },
]