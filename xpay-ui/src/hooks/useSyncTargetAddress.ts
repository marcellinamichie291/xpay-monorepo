import {
  isEVMChain,
  uint8ArrayToHex,
} from "@certusone/wormhole-sdk";
import { arrayify, zeroPad } from "@ethersproject/bytes";
import { useConnectedWallet } from "@terra-money/wallet-provider";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAlgorandContext } from "../contexts/AlgorandWalletContext";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { setTargetAddressHex as setNFTTargetAddressHex } from "../store/nftSlice";
import {
  selectNFTTargetAsset,
  selectNFTTargetChain,
  selectTransferTargetAsset,
  selectTransferTargetChain,
  selectTransferTargetParsedTokenAccount,
} from "../store/selectors";
import { setTargetAddressHex as setTransferTargetAddressHex } from "../store/transferSlice";
import { useNearContext } from "../contexts/NearWalletContext";
import { useConnectedWallet as useXplaConnectedWallet } from "@xpla/wallet-provider";
import { useAptosContext } from "../contexts/AptosWalletContext";
import { TARGET_ADDRESS } from "../utils/consts";

function useSyncTargetAddress(shouldFire: boolean, nft?: boolean) {
  const dispatch = useDispatch();
  const targetChain = useSelector(
    nft ? selectNFTTargetChain : selectTransferTargetChain
  );
  const { signerAddress } = useEthereumProvider();
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  const targetAsset = useSelector(
    nft ? selectNFTTargetAsset : selectTransferTargetAsset
  );
  const targetParsedTokenAccount = useSelector(
    selectTransferTargetParsedTokenAccount
  );
  const targetTokenAccountPublicKey = targetParsedTokenAccount?.publicKey;
  const terraWallet = useConnectedWallet();
  const xplaWallet = useXplaConnectedWallet();
  const { accounts: algoAccounts } = useAlgorandContext();
  const { account: aptosAccount } = useAptosContext();
  const aptosAddress = aptosAccount?.address?.toString();
  const { accountId: nearAccountId, wallet } = useNearContext();
  const setTargetAddressHex = nft
    ? setNFTTargetAddressHex
    : setTransferTargetAddressHex;
  useEffect(() => {
    if (shouldFire) {
      if (isEVMChain(targetChain) && signerAddress) {
        dispatch(
          setTargetAddressHex(
            uint8ArrayToHex(zeroPad(arrayify(TARGET_ADDRESS), 32))
          )
        );
      } else {
        dispatch(setTargetAddressHex(TARGET_ADDRESS));
      }
    }
  }, [
    dispatch,
    shouldFire,
    targetChain,
    signerAddress,
    solPK,
    targetAsset,
    targetTokenAccountPublicKey,
    terraWallet,
    nft,
    setTargetAddressHex,
    algoAccounts,
    nearAccountId,
    wallet,
    xplaWallet,
    aptosAddress,
  ]);
}

export default useSyncTargetAddress;
