import {
  CHAIN_ID_SOLANA,
  isEVMChain,
  isTerraChain,
} from "@certusone/wormhole-sdk";
import { Checkbox, FormControlLabel } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { ethers } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { doc, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FIRESTORE_DB } from "../../config";
import useAllowance from "../../hooks/useAllowance";
import { useHandleTransfer } from "../../hooks/useHandleTransfer";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import {
  selectActualTokenAmount,
  selectMerchantId,
  selectMerchantOrderId,
  selectSourceWalletAddress,
  selectTransferIsSendComplete,
  selectTransferIsVAAPending,
  selectTransferSourceAsset,
  selectTransferSourceChain,
  selectTransferSourceParsedTokenAccount,
  selectTransferTargetError,
  selectTransferTransferTx,
} from "../../store/selectors";
import { reset, Transaction } from "../../store/transferSlice";
import { CHAINS_BY_ID, CLUSTER } from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import KeyAndBalance from "../KeyAndBalance";
import ShowTx from "../ShowTx";
import SolanaTPSWarning from "../SolanaTPSWarning";
import StepDescription from "../StepDescription";
import TerraFeeDenomPicker from "../TerraFeeDenomPicker";
import TransactionProgress from "../TransactionProgress";
import PendingVAAWarning from "./PendingVAAWarning";
import SendConfirmationDialog from "./SendConfirmationDialog";
import WaitingForWalletMessage from "./WaitingForWalletMessage";

function Send() {
  const dispatch = useDispatch();
  const { handleClick, disabled, showLoader } = useHandleTransfer();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const handleTransferClick = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);
  const handleConfirmClick = useCallback(() => {
    handleClick();
    setIsConfirmOpen(false);
  }, [handleClick]);
  const handleConfirmClose = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);
  const handleResetClick = useCallback(() => {
    dispatch(reset());
  }, [dispatch]);

  const sourceChain = useSelector(selectTransferSourceChain);
  const sourceAsset = useSelector(selectTransferSourceAsset);
  const actualTransferAmount = useSelector(selectActualTokenAmount);
  const transferAmountParsed = BigInt(actualTransferAmount);

  const sourceParsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );
  const sourceDecimals = sourceParsedTokenAccount?.decimals;
  const humanReadableTransferAmount = actualTransferAmount && sourceDecimals
    ? (parseFloat(actualTransferAmount) / 10 ** sourceDecimals).toString()
    : "";
    
  const sourceIsNative = sourceParsedTokenAccount?.isNativeAsset;
  const oneParsed =
    sourceDecimals !== undefined &&
    sourceDecimals !== null &&
    parseUnits("1", sourceDecimals).toBigInt();
  const transferTx = useSelector(selectTransferTransferTx);

  const merchantId = useSelector(selectMerchantId);
  const merchantOrderId = useSelector(selectMerchantOrderId);

  async function checkTfExists(transferTx: Transaction) {
    // ensure transferTx is created in the db with the merchant fields
    try {
      await setDoc(doc(FIRESTORE_DB, "test", transferTx.id), {
        status: "CREATED",
        chainId: sourceChain,
        emitterAddress: transferTx.emitterAddress,
        sequence: transferTx.sequence,
        merchantId: merchantId,
        orderId: merchantOrderId,
      });
      console.log("Document written with ID: ", transferTx.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  useEffect(() => {
    if (!transferTx) return;
    checkTfExists(transferTx);
  }, [transferTx])

  const isSendComplete = useSelector(selectTransferIsSendComplete);
  const isVAAPending = useSelector(selectTransferIsVAAPending);

  const error = useSelector(selectTransferTargetError);
  const [allowanceError, setAllowanceError] = useState("");
  const { isReady, statusMessage, walletAddress } =
    useIsWalletReady(sourceChain);
  const sourceWalletAddress = useSelector(selectSourceWalletAddress);
  //The chain ID compare is handled implicitly, as the isWalletReady hook should report !isReady if the wallet is on the wrong chain.
  const isWrongWallet =
    sourceWalletAddress &&
    walletAddress &&
    sourceWalletAddress !== walletAddress;
  const [shouldApproveUnlimited, setShouldApproveUnlimited] = useState(false);
  const toggleShouldApproveUnlimited = useCallback(
    () => setShouldApproveUnlimited(!shouldApproveUnlimited),
    [shouldApproveUnlimited]
  );

  const {
    sufficientAllowance,
    isAllowanceFetching,
    isApproveProcessing,
    approveAmount,
  } = useAllowance(
    sourceChain,
    sourceAsset,
    transferAmountParsed || undefined,
    sourceIsNative
  );

  const approveButtonNeeded = isEVMChain(sourceChain) && !sufficientAllowance;
  const notOne = shouldApproveUnlimited || transferAmountParsed !== oneParsed;
  const isDisabled =
    !isReady ||
    isWrongWallet ||
    disabled ||
    isAllowanceFetching ||
    isApproveProcessing;
  const errorMessage = isWrongWallet
    ? "A different wallet is connected than in Step 1."
    : statusMessage || error || allowanceError || undefined;

  const approveExactAmount = useMemo(() => {
    return () => {
      setAllowanceError("");
      approveAmount(transferAmountParsed).then(
        () => {
          setAllowanceError("");
        },
        (error) => setAllowanceError("Failed to approve the token transfer.")
      );
    };
  }, [approveAmount, transferAmountParsed]);
  const approveUnlimited = useMemo(() => {
    return () => {
      setAllowanceError("");
      approveAmount(ethers.constants.MaxUint256.toBigInt()).then(
        () => {
          setAllowanceError("");
        },
        (error) => setAllowanceError("Failed to approve the token transfer.")
      );
    };
  }, [approveAmount]);

  return (
    <>
      <StepDescription>
        Transfer the tokens to the Wormhole Token Bridge.
      </StepDescription>
      <KeyAndBalance chainId={sourceChain} />
      {isTerraChain(sourceChain) && (
        <TerraFeeDenomPicker disabled={disabled} chainId={sourceChain} />
      )}
      <Alert severity="info" variant="outlined">
        This will initiate the transfer on {CHAINS_BY_ID[sourceChain].name} and
        wait for finalization. After the transaction is created and submitted to the network, you may leave.
        In case the transaction is not finalized, you will be contacted to pay again.
      </Alert>
      {sourceChain === CHAIN_ID_SOLANA && CLUSTER === "mainnet" && (
        <SolanaTPSWarning />
      )}
      {approveButtonNeeded ? (
        <>
          <FormControlLabel
            control={
              <Checkbox
                checked={shouldApproveUnlimited}
                onChange={toggleShouldApproveUnlimited}
                color="primary"
              />
            }
            label="Approve Unlimited Tokens"
          />
          <ButtonWithLoader
            disabled={isDisabled}
            onClick={
              shouldApproveUnlimited ? approveUnlimited : approveExactAmount
            }
            showLoader={isAllowanceFetching || isApproveProcessing}
            error={errorMessage}
          >
            {"Approve " +
              (shouldApproveUnlimited
                ? "Unlimited"
                : humanReadableTransferAmount
                ? humanReadableTransferAmount
                : actualTransferAmount) +
              ` Token${notOne ? "s" : ""}`}
          </ButtonWithLoader>
        </>
      ) : (
        <>
          <ButtonWithLoader
            disabled={isDisabled}
            onClick={handleTransferClick}
            showLoader={showLoader && !isVAAPending}
            error={errorMessage}
          >
            Transfer
          </ButtonWithLoader>
          <SendConfirmationDialog
            open={isConfirmOpen}
            onClick={handleConfirmClick}
            onClose={handleConfirmClose}
          />
        </>
      )}
      <WaitingForWalletMessage />
      {transferTx ? <ShowTx chainId={sourceChain} tx={transferTx} /> : null}
      <TransactionProgress
        chainId={sourceChain}
        tx={transferTx}
        isSendComplete={isSendComplete || isVAAPending}
      />
      {isVAAPending ? (
        <>
          <PendingVAAWarning sourceChain={sourceChain}/>
          <ButtonWithLoader onClick={handleResetClick}>
            Transfer More Tokens!
          </ButtonWithLoader>
        </>
      ) : null}
    </>
  );
}

export default Send;
