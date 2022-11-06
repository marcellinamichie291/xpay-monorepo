import { ChainId } from "@certusone/wormhole-sdk";
import { CHAIN_ID_AURORA } from "@certusone/wormhole-sdk";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-B7cau-RhhB0nkE4V-NfBrNngDas6wuQ",
  authDomain: "xpay-bec12.firebaseapp.com",
  projectId: "xpay-bec12",
  storageBucket: "xpay-bec12.appspot.com",
  messagingSenderId: "277189487644",
  appId: "1:277189487644:web:c5672b45bca493ae4f83d9"
};

// Initialize Firebase
const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);

export type DisableTransfers = boolean | "to" | "from";

export interface WarningMessage {
  text: string;
  link?: {
    url: string;
    text: string;
  };
}

export interface ChainConfig {
  disableTransfers?: DisableTransfers;
  warningMessage?: WarningMessage;
}

export type ChainConfigMap = {
  [key in ChainId]?: ChainConfig;
};

export const CHAIN_CONFIG_MAP: ChainConfigMap = {
  [CHAIN_ID_AURORA]: {
    disableTransfers: true,
    warningMessage: {
      text: "As a precautionary measure, Wormhole Network and Portal have paused Aurora support temporarily.",
    },
  } as ChainConfig,
};