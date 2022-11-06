import {
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
} from "@certusone/wormhole-sdk";
import { getAddress } from "@ethersproject/address";
import { Button, makeStyles, Typography } from "@material-ui/core";
import { VerifiedUser } from "@material-ui/icons";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import {
  selectMerchantOrderId,
  selectTransferAmount,
  selectTransferIsSourceComplete,
  selectTransferShouldLockFields,
  selectTransferSourceBalanceString,
  selectTransferSourceChain,
  selectTransferSourceError,
  selectTransferSourceParsedTokenAccount,
} from "../../store/selectors";
import {
  incrementStep,
  setAmount,
  setMerchantOrderId,
  setSourceChain,
} from "../../store/transferSlice";
import {
  BSC_MIGRATION_ASSET_MAP,
  CHAINS,
  CLUSTER,
  ETH_MIGRATION_ASSET_MAP,
  getIsTransferDisabled,
  MIGRATION_ASSET_MAP,
} from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import ChainSelect from "../ChainSelect";
import KeyAndBalance from "../KeyAndBalance";
import LowBalanceWarning from "../LowBalanceWarning";
import NumberTextField from "../NumberTextField";
import SolanaTPSWarning from "../SolanaTPSWarning";
import StepDescription from "../StepDescription";
import { TokenSelector } from "../TokenSelectors/SourceTokenSelector";
import SourceAssetWarning from "./SourceAssetWarning";
import ChainWarningMessage from "../ChainWarningMessage";
import useIsTransferLimited from "../../hooks/useIsTransferLimited";
import TransferLimitedWarning from "./TransferLimitedWarning";

const useStyles = makeStyles((theme) => ({
  chainSelectWrapper: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  chainSelectContainer: {
    flexBasis: "100%",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  chainSelectArrow: {
    position: "relative",
    top: "12px",
    [theme.breakpoints.down("sm")]: { transform: "rotate(90deg)" },
  },
  transferField: {
    marginTop: theme.spacing(5),
  },
}));

function Source() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const sourceChain = useSelector(selectTransferSourceChain);
  const isSourceTransferDisabled = useMemo(() => {
    return getIsTransferDisabled(sourceChain, true);
  }, [sourceChain]);
  const parsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );
  const hasParsedTokenAccount = !!parsedTokenAccount;
  const isSolanaMigration =
    sourceChain === CHAIN_ID_SOLANA &&
    !!parsedTokenAccount &&
    !!MIGRATION_ASSET_MAP.get(parsedTokenAccount.mintKey);
  const isEthereumMigration =
    sourceChain === CHAIN_ID_ETH &&
    !!parsedTokenAccount &&
    !!ETH_MIGRATION_ASSET_MAP.get(getAddress(parsedTokenAccount.mintKey));
  const isBscMigration =
    sourceChain === CHAIN_ID_BSC &&
    !!parsedTokenAccount &&
    !!BSC_MIGRATION_ASSET_MAP.get(getAddress(parsedTokenAccount.mintKey));
  const isMigrationAsset =
    isSolanaMigration || isEthereumMigration || isBscMigration;
  const uiAmountString = useSelector(selectTransferSourceBalanceString);
  const amount = useSelector(selectTransferAmount);
  const merchantOrderId = useSelector(selectMerchantOrderId);
  const error = useSelector(selectTransferSourceError);
  const isSourceComplete = useSelector(selectTransferIsSourceComplete);
  const shouldLockFields = useSelector(selectTransferShouldLockFields);
  const { isReady, statusMessage } = useIsWalletReady(sourceChain);
  const isTransferLimited = useIsTransferLimited();
  const handleMigrationClick = useCallback(() => {
    if (sourceChain === CHAIN_ID_SOLANA) {
      history.push(
        `/migrate/Solana/${parsedTokenAccount?.mintKey}/${parsedTokenAccount?.publicKey}`
      );
    } else if (sourceChain === CHAIN_ID_ETH) {
      history.push(`/migrate/Ethereum/${parsedTokenAccount?.mintKey}`);
    } else if (sourceChain === CHAIN_ID_BSC) {
      history.push(`/migrate/BinanceSmartChain/${parsedTokenAccount?.mintKey}`);
    }
  }, [history, parsedTokenAccount, sourceChain]);
  const handleSourceChange = useCallback(
    (event) => {
      dispatch(setSourceChain(event.target.value));
    },
    [dispatch]
  );
  const handleAmountChange = useCallback(
    (event) => {
      dispatch(setAmount(event.target.value));
    },
    [dispatch]
  );
  const handleMerchantOrderIdChange = useCallback(
    (event) => {
      dispatch(setMerchantOrderId(event.target.value));
    },
    [dispatch]
  );
  const handleNextClick = useCallback(() => {
    dispatch(incrementStep());
  }, [dispatch]);

  return (
    <>
      <StepDescription>
        <div style={{ display: "flex", alignItems: "center" }}>
          Select tokens to send through the Portal.
          <div style={{ flexGrow: 1 }} />
          <div>
            <Button
              component={Link}
              to="/token-origin-verifier"
              size="small"
              variant="outlined"
              startIcon={<VerifiedUser />}
            >
              Token Origin Verifier
            </Button>
          </div>
        </div>
      </StepDescription>
      <div
        className={classes.chainSelectWrapper}
        style={{ marginBottom: "25px" }}
      >
        <div className={classes.chainSelectContainer}>
          <Typography variant="caption">Source</Typography>
          <ChainSelect
            select
            variant="outlined"
            fullWidth
            value={sourceChain}
            onChange={handleSourceChange}
            disabled={shouldLockFields}
            chains={CHAINS}
          />
        </div>
      </div>
      <KeyAndBalance chainId={sourceChain} />
      {isReady || uiAmountString ? (
        <div className={classes.transferField}>
          <TokenSelector disabled={shouldLockFields} />
        </div>
      ) : null}
      {isMigrationAsset ? (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleMigrationClick}
        >
          Go to Migration Page
        </Button>
      ) : (
        <>
          <LowBalanceWarning chainId={sourceChain} />
          {sourceChain === CHAIN_ID_SOLANA && CLUSTER === "mainnet" && (
            <SolanaTPSWarning />
          )}
          <SourceAssetWarning
            sourceChain={sourceChain}
            sourceAsset={parsedTokenAccount?.mintKey}
          />
          {hasParsedTokenAccount ? (
            <>
              <NumberTextField
                variant="outlined"
                label="Order Amount (USD)"
                fullWidth
                className={classes.transferField}
                value={amount}
                disabled={shouldLockFields}
                onChange={handleAmountChange}
              />
              <NumberTextField
                variant="outlined"
                label="Order ID (see your order completion page)"
                fullWidth
                className={classes.transferField}
                value={merchantOrderId}
                onChange={handleMerchantOrderIdChange}
              />
            </>
          ) : null}
          <ChainWarningMessage chainId={sourceChain} />
          <TransferLimitedWarning isTransferLimited={isTransferLimited} />
          <ButtonWithLoader
            disabled={
              !isSourceComplete ||
              isSourceTransferDisabled
            }
            onClick={handleNextClick}
            showLoader={false}
            error={statusMessage || error}
          >
            Next
          </ButtonWithLoader>
        </>
      )}
    </>
  );
}

export default Source;
