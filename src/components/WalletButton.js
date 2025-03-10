import React, { useState, useEffect } from 'react';
import { shortenAddress, useEthers, useLookupAddress } from '@usedapp/core';

import styles from '../styles';

const WalletButton = () => {
  const [accountAddress, setAccountAddress] = useState(null);
  const { ens } = useLookupAddress();
  const { account, activateBrowserWallet, deactivate } = useEthers();

  useEffect(() => {
    if (ens) {
      setAccountAddress(ens);
    }
    else if (account) {
      setAccountAddress(shortenAddress(account));
    }
    else {
      setAccountAddress(null);
    }
  }, [account, ens, setAccountAddress]);

  return (<button onClick={() => {
    if (!account) {
      activateBrowserWallet();
    } else {
      deactivate();
    }
  }} className={styles.walletButton = "bg-[#ff0099] text-white px-6 py-2 rounded-full font-bold hover:bg-[#cc007a] transition-all"}>
    {(accountAddress) ? accountAddress : 'Connect Wallet'}
  </button>);
};

export default WalletButton;
