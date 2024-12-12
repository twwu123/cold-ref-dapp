import { useEffect, useState } from "react";
import { BrowserWallet } from "@meshsdk/core";
import NFTMinting from "../components/nft-minting";
import CreateColdRef from "../components/create-cold-ref";
import RotateColdRef from "../components/rotate-cold-ref";
import SignTx from "../components/sign-tx";

type WasmModule = typeof import("@emurgo/cardano-serialization-lib-browser");

const tabActive =
  "inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500";
const tabInactive =
  "inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300";

export default function Home() {
  const [wasm, setWasm] = useState<WasmModule | null>(null);
  const [walletList, setWalletList] = useState<string[]>([]);
  const [walletDropdown, setWalletDropdown] = useState<boolean>(false);
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("mintNFT");
  const [network, setNetwork] = useState<"preprod" | "mainnet">("preprod");

  useEffect(() => {
    const getWallets = async () => {
      setWalletList(
        (await BrowserWallet.getAvailableWallets()).map((wallet) => wallet.id)
      );
    };

    const getWasm = async () => {
      try {
        setWasm(await import("@emurgo/cardano-serialization-lib-browser"));
      } catch (e) {
        console.error(e);
      }
    };
    getWasm();
    getWallets();
  }, []);

  useEffect(() => {
    const getBalance = async () => {
      if (wallet) {
        if ((await wallet.getNetworkId()) === 1) {
          setNetwork("mainnet");
        } else {
          setNetwork("preprod");
        }
        setBalance(await wallet.getLovelace());
      }
    };
    getBalance();
  }, [wallet]);

  return (
    <div className="grid items-center p-5 min-h-screenfont-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <div>
          <button
            onClick={() => {
              setWalletDropdown(!walletDropdown);
            }}
            id="dropdownDefaultButton"
            data-dropdown-toggle="dropdown"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            type="button"
          >
            {wallet
              ? `Wallet Connected: ${wallet._walletName}`
              : `Connect Wallet`}
            <svg
              className="w-2.5 h-2.5 ms-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 4 4 4-4"
              />
            </svg>
          </button>

          <div
            id="dropdown"
            className={`absolute mt-3 z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 ${
              walletDropdown ? "block" : "hidden"
            }`}
          >
            <ul
              className="py-2 text-sm text-gray-700 dark:text-gray-200"
              aria-labelledby="dropdownDefaultButton"
            >
              {walletList.map((val) => {
                return (
                  <li key={val}>
                    <a
                      onClick={async () => {
                        setWallet(await BrowserWallet.enable(val));
                        setWalletDropdown(false);
                      }}
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      {val}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        {wallet && balance && <div>{balance} lovelace</div>}
        <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
          <li className="me-2">
            <a
              onClick={() => setTab("mintNFT")}
              href="#"
              aria-current="page"
              className={tab === "mintNFT" ? tabActive : tabInactive}
            >
              Mint NFT
            </a>
          </li>
          <li className="me-2">
            <a
              onClick={() => setTab("createColdRef")}
              href="#"
              className={tab === "createColdRef" ? tabActive : tabInactive}
            >
              Create Cold Ref
            </a>
          </li>
          <li className="me-2">
            <a
              onClick={() => setTab("rotateColdRef")}
              href="#"
              className={tab === "rotateColdRef" ? tabActive : tabInactive}
            >
              Rotate Cold Ref
            </a>
          </li>
          <li className="me-2">
            <a
              onClick={() => setTab("signTx")}
              href="#"
              className={tab === "signTx" ? tabActive : tabInactive}
            >
              Sign Tx
            </a>
          </li>
        </ul>
        {NFTMinting(wallet, wasm, network, tab === "mintNFT")}
        {CreateColdRef(wallet, wasm, network, tab === "createColdRef")}
        {RotateColdRef(wallet, wasm, network, tab === "rotateColdRef")}
        {SignTx(wallet, wasm, network, tab === "signTx")}
      </main>
    </div>
  );
}
