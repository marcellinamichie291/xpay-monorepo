import {
  ChainId,
  getForeignAssetEth,
  hexToNativeAssetString,
  hexToUint8Array,
  isEVMChain,
} from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { useNearContext } from "../contexts/NearWalletContext";
import {
  errorDataWrapper,
  fetchDataWrapper,
  receiveDataWrapper,
} from "../store/helpers";
import {
  selectNFTOriginTokenId,
  selectTransferIsSourceAssetWormholeWrapped,
  selectTransferOriginAsset,
  selectTransferOriginChain,
  selectTransferTargetChain,
} from "../store/selectors";
import { setTargetAsset as setTransferTargetAsset } from "../store/transferSlice";
import {
  getEvmChainId,
  getTokenBridgeAddressForChain,
} from "../utils/consts";

function useFetchTargetAsset() {
  const dispatch = useDispatch();
  const isSourceAssetWormholeWrapped = useSelector(
    selectTransferIsSourceAssetWormholeWrapped
  );
  const originChain = useSelector(
    selectTransferOriginChain
  );
  const originAsset = useSelector(
    selectTransferOriginAsset
  );
  const originTokenId = useSelector(selectNFTOriginTokenId);
  const tokenId = originTokenId || ""; // this should exist by this step for NFT transfers
  const targetChain = useSelector(
    selectTransferTargetChain
  );
  const setTargetAsset = setTransferTargetAsset;
  const { provider, chainId: evmChainId } = useEthereumProvider();
  const correctEvmNetwork = getEvmChainId(targetChain);
  const hasCorrectEvmNetwork = evmChainId === correctEvmNetwork;
  const { accountId: nearAccountId } = useNearContext();
  const [lastSuccessfulArgs, setLastSuccessfulArgs] = useState<{
    isSourceAssetWormholeWrapped: boolean | undefined;
    originChain: ChainId | undefined;
    originAsset: string | undefined;
    targetChain: ChainId;
    tokenId?: string;
  } | null>(null);
  const argsMatchLastSuccess =
    !!lastSuccessfulArgs &&
    lastSuccessfulArgs.isSourceAssetWormholeWrapped ===
      isSourceAssetWormholeWrapped &&
    lastSuccessfulArgs.originChain === originChain &&
    lastSuccessfulArgs.originAsset === originAsset &&
    lastSuccessfulArgs.targetChain === targetChain &&
    lastSuccessfulArgs.tokenId === tokenId;
  const setArgs = useCallback(
    () =>
      setLastSuccessfulArgs({
        isSourceAssetWormholeWrapped,
        originChain,
        originAsset,
        targetChain,
        tokenId,
      }),
    [
      isSourceAssetWormholeWrapped,
      originChain,
      originAsset,
      targetChain,
      tokenId,
    ]
  );
  useEffect(() => {
    if (argsMatchLastSuccess) {
      return;
    }
    setLastSuccessfulArgs(null);
    let cancelled = false;
    (async () => {
      if (isSourceAssetWormholeWrapped && originChain === targetChain) {
        if (!cancelled) {
          dispatch(
            setTargetAsset(
              receiveDataWrapper({
                doesExist: true,
                address:
                  hexToNativeAssetString(originAsset, originChain) || null,
              })
            )
          );
        }
        if (!cancelled) {
          setArgs();
        }
        return;
      }
      if (
        isEVMChain(targetChain) &&
        provider &&
        hasCorrectEvmNetwork &&
        originChain &&
        originAsset
      ) {
        dispatch(setTargetAsset(fetchDataWrapper()));
        try {
          const asset = await (
            getForeignAssetEth(
              getTokenBridgeAddressForChain(targetChain),
              provider,
              originChain,
              hexToUint8Array(originAsset)
            ));
          if (!cancelled) {
            dispatch(
              setTargetAsset(
                receiveDataWrapper({
                  doesExist: asset !== ethers.constants.AddressZero,
                  address: asset,
                })
              )
            );
            setArgs();
          }
        } catch (e) {
          if (!cancelled) {
            dispatch(
              setTargetAsset(
                errorDataWrapper(
                  "Unable to determine existence of wrapped asset"
                )
              )
            );
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    isSourceAssetWormholeWrapped,
    originChain,
    originAsset,
    targetChain,
    provider,
    setTargetAsset,
    tokenId,
    hasCorrectEvmNetwork,
    argsMatchLastSuccess,
    setArgs,
    nearAccountId,
  ]);
}

export default useFetchTargetAsset;
