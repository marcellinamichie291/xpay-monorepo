import {
  CHAIN_ID_APTOS,
  hexToNativeString,
} from "@certusone/wormhole-sdk";
import { CHAIN_ID_NEAR } from "@certusone/wormhole-sdk/lib/esm";
import { makeStyles, Typography } from "@material-ui/core";
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNearContext } from "../../contexts/NearWalletContext";
import useGetTargetParsedTokenAccounts from "../../hooks/useGetTargetParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import useSyncTargetAddress from "../../hooks/useSyncTargetAddress";
import {
  selectActualTokenAmount,
  selectTransferAmount,
  selectTransferIsTargetComplete,
  selectTransferShouldLockFields,
  selectTransferSourceParsedTokenAccount,
  selectTransferTargetAddressHex,
  selectTransferTargetAsset,
  selectTransferTargetAssetWrapper,
  selectTransferTargetBalanceString,
  selectTransferTargetChain,
  selectTransferTargetError,
  selectTransferTargetParsedTokenAccount,
} from "../../store/selectors";
import { incrementStep, setActualTokenAmount } from "../../store/transferSlice";
import { getEmitterAddressNear } from "../../utils/near";
import ButtonWithLoader from "../ButtonWithLoader";
import KeyAndBalance from "../KeyAndBalance";
import LowBalanceWarning from "../LowBalanceWarning";
import SmartAddress from "../SmartAddress";
import RegisterNowButton from "./RegisterNowButton";

const useStyles = makeStyles((theme) => ({
  transferField: {
    marginTop: theme.spacing(5),
  },
  alert: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

export const useTargetInfo = () => {
  const { accountId: nearAccountId } = useNearContext();

  const targetChain = useSelector(selectTransferTargetChain);
  const targetAddressHex = useSelector(selectTransferTargetAddressHex);
  const targetAsset = useSelector(selectTransferTargetAsset);
  const targetParsedTokenAccount = useSelector(
    selectTransferTargetParsedTokenAccount
  );
  const tokenName = targetParsedTokenAccount?.name;
  const symbol = targetParsedTokenAccount?.symbol;
  const logo = targetParsedTokenAccount?.logo;
  const readableTargetAddress =
    targetChain === CHAIN_ID_NEAR
      ? // Near uses a hashed address, which isn't very readable - check that the hash matches and show them their account id
        nearAccountId &&
        // this just happens to be the same hashing mechanism as emitters
        getEmitterAddressNear(nearAccountId) === targetAddressHex
        ? nearAccountId
        : targetAddressHex || ""
      : targetChain === CHAIN_ID_APTOS
      ? `0x${targetAddressHex}` || ""
      : hexToNativeString(targetAddressHex, targetChain) || "";
  return useMemo(
    () => ({
      targetChain,
      targetAsset,
      tokenName,
      symbol,
      logo,
      readableTargetAddress,
    }),
    [targetChain, targetAsset, tokenName, symbol, logo, readableTargetAddress]
  );
};

function Target() {
  useGetTargetParsedTokenAccounts();
  const classes = useStyles();
  const dispatch = useDispatch();
  const { error: targetAssetError, data } = useSelector(
    selectTransferTargetAssetWrapper
  );
  const {
    targetChain,
    targetAsset,
    tokenName,
    symbol,
    logo,
    readableTargetAddress,
  } = useTargetInfo();
  const uiAmountString = useSelector(selectTransferTargetBalanceString);
  const transferAmount = useSelector(selectTransferAmount);
  const actualTokenAmount = useSelector(selectActualTokenAmount);
  const sourceParsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );
  const sourceDecimals = sourceParsedTokenAccount?.decimals;
  const error = useSelector(selectTransferTargetError);
  const isTargetComplete = useSelector(selectTransferIsTargetComplete);
  const shouldLockFields = useSelector(selectTransferShouldLockFields);
  const { statusMessage } = useIsWalletReady(targetChain);
  const isLoading = !statusMessage && !targetAssetError && !data;
  useSyncTargetAddress(!shouldLockFields);
  const handleNextClick = useCallback(() => {
    dispatch(incrementStep());
  }, [dispatch]);

  // lookup 0x quote for targetAsset to USDC.MATIC
  useEffect(() => {
    console.log(targetAsset);
    console.log(transferAmount);
    const transferAmountAdjusted = parseFloat(transferAmount) * 1.029;
    const machineUsdTfAmt = transferAmountAdjusted * 10 ** 6;
    const machineUsdTfAmtInt = Math.round(machineUsdTfAmt);
    const url = `https://polygon.api.0x.org/swap/v1/quote?sellToken=USDC&buyToken=${targetAsset}&sellAmount=${machineUsdTfAmtInt}`;
    console.log(url);
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        dispatch(setActualTokenAmount(json.buyAmount));
      })
      .catch(console.error);
  }, [targetAsset, transferAmount, dispatch]);

  const actualTokenAmountHumanReadable = actualTokenAmount && sourceDecimals
    ? (parseFloat(actualTokenAmount) / 10 ** sourceDecimals).toString()
    : "";

  return (
    <>
      <KeyAndBalance chainId={targetChain} />
      {readableTargetAddress ? (
        <>
          {targetAsset ? (
            <div className={classes.transferField}>
              <Typography variant="subtitle2">Bridged tokens:</Typography>
              <Typography component="div">
                <SmartAddress
                  chainId={targetChain}
                  address={targetAsset}
                  symbol={symbol}
                  tokenName={tokenName}
                  logo={logo}
                  variant="h6"
                  isAsset
                />
                {`(Amount: ${actualTokenAmountHumanReadable})`}
              </Typography>
            </div>
          ) : null}
          <div className={classes.transferField}>
            <Typography variant="subtitle2">Sent to:</Typography>
            <Typography component="div">
              <SmartAddress
                chainId={targetChain}
                address={readableTargetAddress}
                variant="h6"
              />
              {`(Current balance: ${uiAmountString || "0"})`}
            </Typography>
          </div>
        </>
      ) : null}
      <LowBalanceWarning chainId={targetChain} />
      <ButtonWithLoader
        disabled={!isTargetComplete}
        onClick={handleNextClick}
        showLoader={isLoading}
        error={
          statusMessage || (isLoading ? undefined : error || targetAssetError)
        }
      >
        Next
      </ButtonWithLoader>
      {!statusMessage && data && !data.doesExist ? <RegisterNowButton /> : null}
    </>
  );
}

export default Target;
