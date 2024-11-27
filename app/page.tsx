"use client";
import { useEffect, useState } from "react";
import {
  applyParamsToScript,
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  resolveScriptHash,
} from "@meshsdk/core";
import axios from "axios";

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
  // For NFT minting
  const [nftInput, setNftInput] = useState<string>("");
  const [nftOutputAddress, setNftOutputAddress] = useState<string>("");
  const [nftMintChangeAddress, setNftMintChangeAddress] = useState<string>("");
  // For setting up cold ref
  const [coldRefInput, setColdRefInput] = useState<string>("");
  const [coldRefFeeInput, setColdRefFeeInput] = useState<string>("");
  const [coldRefDatum, setColdRefDatum] = useState<string>("");
  const [coldRefNftPolicy, setColdRefNftPolicy] = useState<string>("");
  const [coldRefOutputAddress, setColdRefOutputAddress] = useState<string>("");
  const [coldRefChangeAddress, setColdRefChangeAddress] = useState<string>("");

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
        setBalance(await wallet.getLovelace());
      }
    };
    getBalance();
  }, [wallet]);

  const testColdRef = async () => {
    const blockfrost = new BlockfrostProvider(
      process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY!
    );
    const txBuilder = new MeshTxBuilder({
      fetcher: blockfrost,
      evaluator: blockfrost,
    });
    const collateralInputs = await wallet?.getCollateral();
    if (!collateralInputs) {
      throw new Error("Please set collateral in wallet");
    }

    txBuilder
      .txIn(coldRefInput.split("#")[0], Number(coldRefInput.split("#")[1]))
      .txIn(
        coldRefFeeInput.split("#")[0],
        Number(coldRefFeeInput.split("#")[1])
      )
      .txOut(coldRefOutputAddress, [
        {
          quantity: "1",
          unit: coldRefNftPolicy,
        },
      ])
      .txOutInlineDatumValue(coldRefDatum, "JSON")
      .changeAddress(coldRefChangeAddress);

    try {
      const txHex = await txBuilder.complete();
      const signedTxHex = await wallet?.signTx(txHex);
      const nftMintTxHash = await wallet?.submitTx(signedTxHex!);
      console.log(nftMintTxHash);
    } catch (err) {
      console.log(err);
    }
  };

  const testMint = async () => {
    if (!wallet) {
      throw new Error("Please connect wallet");
    }
    const [txHash, txIndex] = nftInput.split("#");
    const datumJSON = JSON.stringify({
      constructor: 0,
      fields: [
        {
          constructor: 0,
          fields: [
            {
              bytes: txHash,
            },
          ],
        },
        {
          int: Number(txIndex),
        },
      ],
    });
    const wasmDatum = wasm?.PlutusData.from_json(
      datumJSON,
      wasm.PlutusDatumSchema.DetailedSchema
    );

    const script = applyParamsToScript(
      "59021d01000032323232323232222533300432323253330073370e900018041baa0011323253330093375e6e98004dd319980200124500480084c8cc004004dd6180318061baa3006300c375400e44a66601c00229404c94ccc030cdd7980418071baa301100200b14a226600600600260220022a66601266ebcdd30009ba633300400248900480045288a5032330010013756601c601e601e601e601e60166ea8c014c02cdd50031129998068008a5eb7bdb1804c8c8c8c94ccc038cdc8a441000021533300e3371e91010000210031005133012337606ea4008dd3000998030030019bab300f003375c601a0046022004601e0026eb8c030c024dd50008b1805980618041baa00322253330083370e00290000a5eb7bdb1804c8c8cc0040052f5bded8c044a66601c00226601e66ec0dd48031ba60034bd6f7b630099191919299980799b9000a002133013337606ea4028dd30038028a99980799b8f00a002133013337606ea4028dd300380189980999bb037520046e98004cc01801800cdd598080019bae300e0023012002301000132330010014bd6f7b63011299980680089980719bb037520086ea000d2f5bded8c0264646464a66601c66e400200084cc048cdd81ba9008375000e00a2a66601c66e3c0200084cc048cdd81ba9008375000e00626602466ec0dd48011ba800133006006003375a601e0066eb8c034008c044008c03c0048c028004526136565734aae7555cf2ab9f5740ae855d101",
      [wasmDatum!.to_hex()],
      "CBOR"
    );

    const blockfrost = new BlockfrostProvider(
      process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY!
    );
    const txBuilder = new MeshTxBuilder({
      fetcher: blockfrost,
      evaluator: blockfrost,
    });
    const collateralInputs = await wallet?.getCollateral();
    if (!collateralInputs) {
      throw new Error("Please set collateral in wallet");
    }
    txBuilder
      .txIn(txHash, Number(txIndex))
      .mintPlutusScriptV2()
      .mint("1", resolveScriptHash(script, "V2"), "")
      .mintRedeemerValue("")
      .mintingScript(script)
      .txOut(nftOutputAddress, [
        {
          unit: resolveScriptHash(script, "V2"),
          quantity: "1",
        },
      ])
      .txInCollateral(
        collateralInputs![0].input.txHash,
        collateralInputs![0].input.outputIndex
      )
      .changeAddress(nftMintChangeAddress);

    try {
      const txHex = await txBuilder.complete();
      const signedTxHex = await wallet?.signTx(txHex);
      const nftMintTxHash = await wallet?.submitTx(signedTxHex!);
      console.log(nftMintTxHash);
    } catch (err) {
      console.log(err);
    }
  };

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
              onClick={() => setTab("signTx")}
              href="#"
              className={tab === "signTx" ? tabActive : tabInactive}
            >
              Sign Tx
            </a>
          </li>
        </ul>
        {tab === "mintNFT" && (
          <>
            <div className="w-1/2">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Input
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="txHash#index"
                value={nftInput}
                onChange={(e) => setNftInput(e.target.value)}
              ></input>
            </div>
            <div className="w-1/2">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                NFT output address
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="addr.."
                value={nftOutputAddress}
                onChange={(e) => setNftOutputAddress(e.target.value)}
              ></input>
            </div>
            <div className="w-1/2">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Change address
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="addr.."
                value={nftMintChangeAddress}
                onChange={(e) => setNftMintChangeAddress(e.target.value)}
              ></input>
            </div>
            <button
              onClick={() => testMint()}
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
              Build Tx
            </button>
          </>
        )}
        {tab === "createColdRef" && (
          <>
            <div className="w-1/2">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Cold Ref Input
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="txHash#index"
                value={coldRefInput}
                onChange={(e) => setColdRefInput(e.target.value)}
              ></input>
            </div>
            <div className="w-1/2">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Fee Input
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="txHash#index"
                value={coldRefFeeInput}
                onChange={(e) => setColdRefFeeInput(e.target.value)}
              ></input>
            </div>
            <div className="w-1/2">
              <label
                htmlFor="message"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Datum
              </label>
              <textarea
                id="message"
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Datum in JSON format"
                value={coldRefDatum}
                onChange={(e) => setColdRefDatum(e.target.value)}
              ></textarea>
            </div>
            <div className="w-1/2">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                NFT Policy
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="nft policy"
                value={coldRefNftPolicy}
                onChange={(e) => setColdRefNftPolicy(e.target.value)}
              ></input>
            </div>
            <div className="w-1/2">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                NFT output address
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="addr.."
                value={coldRefOutputAddress}
                onChange={(e) => setColdRefOutputAddress(e.target.value)}
              ></input>
            </div>
            <div className="w-1/2">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Change Address
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="addr.."
                value={coldRefChangeAddress}
                onChange={(e) => setColdRefChangeAddress(e.target.value)}
              ></input>
            </div>
            <button
              onClick={() => testColdRef()}
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
              Build Tx
            </button>
          </>
        )}
      </main>
    </div>
  );
}
