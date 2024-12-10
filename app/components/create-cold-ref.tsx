import {
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
} from "@meshsdk/core";
import { useState } from "react";

type WasmModule = typeof import("@emurgo/cardano-serialization-lib-browser");

export default function CreateColdRef(
  wallet: BrowserWallet | null,
  wasm: WasmModule | null,
  network: "preprod" | "mainnet",
  active: boolean
) {
  const [coldRefInput, setColdRefInput] = useState<string>("");
  const [coldRefFeeInput, setColdRefFeeInput] = useState<string>("");
  const [coldRefDatum, setColdRefDatum] = useState<string>("");
  const [coldRefNftPolicy, setColdRefNftPolicy] = useState<string>("");
  const [coldRefOutputAddress, setColdRefOutputAddress] = useState<string>("");
  const [coldRefChangeAddress, setColdRefChangeAddress] = useState<string>("");

  const createColdRef = async () => {
    const blockfrost = new BlockfrostProvider(
      network === "preprod"
        ? process.env.NEXT_PUBLIC_PREPROD_BLOCKFROST_API_KEY!
        : process.env.NEXT_PUBLIC_MAINNET_BLOCKFROST_API_KEY!
    );
    const txBuilder = new MeshTxBuilder({
      fetcher: blockfrost,
      evaluator: blockfrost,
    });

    txBuilder
      .txIn(coldRefInput.split("#")[0], Number(coldRefInput.split("#")[1]))
      .txIn(
        coldRefFeeInput.split("#")[0],
        Number(coldRefFeeInput.split("#")[1])
      )
      .setNetwork(network);

    if (coldRefChangeAddress === "" || !coldRefChangeAddress) {
      throw new Error("Must use a change address for this transaction");
    } else {
      txBuilder
        .txOut(coldRefOutputAddress, [
          {
            unit: coldRefNftPolicy,
            quantity: "1",
          },
        ])
        .txOutInlineDatumValue(coldRefDatum, "JSON")
        .changeAddress(coldRefChangeAddress);
    }

    try {
      const txHex = await txBuilder.complete();
      const signedTxHex = await wallet?.signTx(txHex, true);
      const coldRefTxHash = await wallet?.submitTx(signedTxHex!);
      console.log(coldRefTxHash);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={`w-1/2 ${active ? "block" : "hidden"}`}>
      <div className="mb-4">
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
      <div className="mb-4">
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
      <div className="mb-4">
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
      <div className="mb-4">
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
      <div className="mb-4">
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
      <div className="mb-4">
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
        onClick={() => createColdRef()}
        type="button"
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
      >
        Build Tx
      </button>
    </div>
  );
}
