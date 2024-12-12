"use client";
import {
  applyParamsToScript,
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  resolveScriptHash,
} from "@meshsdk/core";
import { useState } from "react";

type WasmModule = typeof import("@emurgo/cardano-serialization-lib-browser");

export default function NFTMinting(
  wallet: BrowserWallet | null,
  wasm: WasmModule | null,
  network: "preprod" | "mainnet",
  active: boolean
) {
  const [nftInput, setNftInput] = useState<string>("");
  const [nftOutputAddress, setNftOutputAddress] = useState<string>("");
  const [nftMintChangeAddress, setNftMintChangeAddress] = useState<string>("");

  const mint = async () => {
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
      network === "preprod"
        ? process.env.NEXT_PUBLIC_PREPROD_BLOCKFROST_API_KEY!
        : process.env.NEXT_PUBLIC_MAINNET_BLOCKFROST_API_KEY!
    );
    const txBuilder = new MeshTxBuilder({
      fetcher: blockfrost,
      evaluator: blockfrost,
    });
    let collateralInputs = await wallet?.getCollateral();
    if (!collateralInputs || collateralInputs.length === 0) {
      collateralInputs = [(await blockfrost.fetchUTxOs(txHash))[0]];
    }
    txBuilder
      .txIn(txHash, Number(txIndex))
      .mintPlutusScriptV2()
      .mint("1", resolveScriptHash(script, "V2"), "")
      .mintRedeemerValue("")
      .mintingScript(script)
      .txInCollateral(
        collateralInputs[0].input.txHash,
        Number(collateralInputs[0].input.outputIndex)
      )
      .setNetwork(network);

    if (nftMintChangeAddress === "" || !nftMintChangeAddress) {
      txBuilder.changeAddress(nftOutputAddress);
    } else {
      txBuilder
        .txOut(nftOutputAddress, [
          {
            unit: resolveScriptHash(script, "V2"),
            quantity: "1",
          },
        ])
        .changeAddress(nftMintChangeAddress);
    }

    try {
      const txHex = await txBuilder.complete();
      const signedTxHex = await wallet?.signTx(txHex, true);
      const nftMintTxHash = await wallet?.submitTx(signedTxHex!);
      console.log(nftMintTxHash);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={`w-1/2 ${active ? "block" : "hidden"}`}>
      <div className="mb-4">
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
      <div className="mb-4">
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
      <div className="mb-4">
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
        onClick={() => mint()}
        type="button"
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
      >
        Build Tx
      </button>
    </div>
  );
}
