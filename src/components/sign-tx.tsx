import { BrowserWallet } from "@meshsdk/core";
import { useState } from "react";

type WasmModule = typeof import("@emurgo/cardano-serialization-lib-browser");

export default function SignTx(
  wallet: BrowserWallet | null,
  wasm: WasmModule | null,
  network: "preprod" | "mainnet",
  active: boolean
) {
  const [txHex, setTxHex] = useState<string>("");
  const [signedTx, setSignedTx] = useState<string>("");

  const signTx = async () => {
    const signedTx = await wallet?.signTx(txHex, true);
    if (!signedTx) {
      throw new Error("Error signing transaction");
    }
    setSignedTx(signedTx);
  };

  return (
    <div className={`w-1/2 ${active ? "block" : "hidden"}`}>
      <div>
        <label
          htmlFor="message"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Transaction
        </label>
        <textarea
          id="message"
          rows={4}
          className="block mb-2 p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Transaction hex for signing"
          value={txHex}
          onChange={(e) => setTxHex(e.target.value)}
        ></textarea>
        <button
          type="button"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          onClick={signTx}
        >
          Sign
        </button>
        <textarea
          id="message"
          rows={4}
          readOnly
          className="block mb-2 p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Resulting signed tx"
          value={signedTx}
        ></textarea>
      </div>
    </div>
  );
}
