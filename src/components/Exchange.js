import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Contract } from '@ethersproject/contracts';
import { abis } from '../contracts';
import { ERC20, useContractFunction, useEthers, useTokenAllowance, useTokenBalance } from '@usedapp/core';
import { ethers } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

import { ROUTER_ADDRESS } from '../config';
import { AmountIn, AmountOut, Balance } from '.';
import styles from '../styles';
import { getAvailableTokens, getCounterpartTokens, findPoolByTokens, isOperationPending, getFailureMessage, getSuccessMessage } from '../utils';

const Exchange = ({ pools }) => {
  const { account } = useEthers();
  const [fromValue, setFromValue] = useState("0");
  const [fromToken, setFromToken] = useState(pools[0].token0Address);
  const [toToken, setToToken] = useState("");
  const [resetState, setResetState] = useState(false);

  const fromValueBigNumber = useMemo(() => parseUnits(fromValue || "0"), [fromValue]);
  const availableTokens = useMemo(() => getAvailableTokens(pools), [pools]);
  const counterpartTokens = useMemo(() => getCounterpartTokens(pools, fromToken), [fromToken, pools]);
  const pairAddress = useMemo(() => findPoolByTokens(pools, fromToken, toToken)?.address ?? "", [fromToken, pools, toToken]);

  const routerContract = new Contract(ROUTER_ADDRESS, abis.router02);
  const fromTokenContract = new Contract(fromToken, ERC20.abi);
  const fromTokenBalance = useTokenBalance(fromToken, account);
  const toTokenBalance = useTokenBalance(toToken, account);
  const tokenAllowance = useTokenAllowance(fromToken, account, ROUTER_ADDRESS) ?? parseUnits("0");
  const approvalNeeded = useMemo(() => fromValueBigNumber.gt(tokenAllowance), [fromValueBigNumber, tokenAllowance]);
  const fromValueIsGreaterThan0 = useMemo(() => fromValueBigNumber.gt(parseUnits("0")), [fromValueBigNumber]);
  const hasEnoughBalance = useMemo(() => fromValueBigNumber.lte(fromTokenBalance ?? parseUnits("0")), [fromTokenBalance, fromValueBigNumber]);

  const { state: swapApproveState, send: swapApproveSend } = useContractFunction(fromTokenContract, "approve", { transactionName: "onApproveRequested", gasLimitBufferPercentage: 10 });

  const { state: swapExecuteState, send: swapExecuteSend } = useContractFunction(routerContract, "swapExactTokensForTokens", { transactionName: "swapExactTokensForTokens", gasLimitBufferPercentage: 10 });

  const isApproving = useMemo(() => isOperationPending(swapApproveState), [swapApproveState]);
  const isSwapping = useMemo(() => isOperationPending(swapExecuteState), [swapExecuteState]);
  const canApprove = useMemo(() => !isApproving && approvalNeeded, [approvalNeeded, isApproving]);
  const canSwap = useMemo(() => !approvalNeeded && !isSwapping && fromValueIsGreaterThan0 && hasEnoughBalance, [approvalNeeded, fromValueIsGreaterThan0, hasEnoughBalance, isSwapping]);

  const successMessage = useMemo(() => getSuccessMessage(swapApproveState, swapExecuteState), [swapApproveState, swapExecuteState]);
  const failureMessage = useMemo(() => getFailureMessage(swapApproveState, swapExecuteState), [swapApproveState, swapExecuteState]);

  const onApproveRequested = useCallback(() => {
    swapApproveSend(ROUTER_ADDRESS, ethers.constants.MaxUint256);
  }, [swapApproveSend]);

  const onSwapRequested = useCallback(() => {
    swapExecuteSend(fromValueBigNumber, 0, [fromToken, toToken], account, Math.floor(Date.now() / 1000) + (60 * 2))
      .then(() => {
        setFromValue("0");
      });
  }, [account, fromToken, fromValueBigNumber, swapExecuteSend, toToken]);

  const onFromValueChange = useCallback((value) => {
    const trimmedValue = value.trim();
    try {
      if (trimmedValue) {
        parseUnits(value);
        setFromValue(value);
      }
    } catch(error) {
      console.error("Error in onFromValueChange. Details: ", error);
    }
  }, []);

  const onFromTokenChange = useCallback((value) => {
    setFromToken(value);
  }, []);

  const onToTokenChange = useCallback((value) => {
    setToToken(value);
  }, []);

  useEffect(() => {
    if (successMessage || failureMessage) {
      setTimeout(() => {
        setResetState(true);
        setFromValue("0");
        setToToken("");
      }, 5000);
    }
  }, [failureMessage, successMessage]);

  return (<div className='flex flex-col w-full items-center'>
    <div className='mb-8'>
        <AmountIn
          value={fromValue}
          onChange={onFromValueChange}
          currencyValue={fromToken}
          onSelect={onFromTokenChange}
          currencies={availableTokens}
          isSwapping={isSwapping && hasEnoughBalance} 
        />
        <Balance tokenBalance={fromTokenBalance} />
    </div>
    <div className='mb-8 w-[100%]'>
        <AmountOut
          fromToken={fromToken}
          toToken={toToken}
          amountIn={fromValueBigNumber}
          pairContract={pairAddress}
          currencyValue={toToken}
          onSelect={onToTokenChange}
          currencies={counterpartTokens}
        />
        <Balance tokenBalance={toTokenBalance} />
    </div>
    { (approvalNeeded && !isSwapping)
      ? (<button
        disabled={!canApprove}
        className={`${styles.actionButton} ${canApprove ? "bg-site-pink text-white" : "bg-site-dim2 text-site-dim2"}`}
        onClick={onApproveRequested}
      >
        {isApproving ? "Approving..." : "Approve"}
      </button>)
      : (<button
        disabled={!canSwap}
        className={`${styles.actionButton} ${canSwap ? "bg-site-pink text-white" : "bg-site-dim2 text-site-dim2"}`}
        onClick={onSwapRequested}
      >
        {isSwapping ? "Swapping..." : (hasEnoughBalance ? "Swap" : "Insufficient Balance" )}
      </button>) }
      { (failureMessage && !resetState)
        ? (<p className={styles.message}>{failureMessage}</p>)
        : (successMessage)
          ? (<p className={styles.message}>{successMessage}</p>)
          : null }
  </div>);
};

export default Exchange;
