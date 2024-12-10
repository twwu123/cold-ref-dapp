import {
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  resolvePlutusScriptAddress,
  resolveScriptHash,
} from "@meshsdk/core";
import { useState } from "react";
import {
  getColdIntentHoldScript,
  getColdIntentTokenPolicyScript,
  getColdRefHoldScript,
} from "../utils";

type WasmModule = typeof import("@emurgo/cardano-serialization-lib-browser");

const tabActive =
  "inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500";
const tabInactive =
  "inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300";

export default function RotateColdRef(
  wallet: BrowserWallet | null,
  wasm: WasmModule | null,
  network: "preprod" | "mainnet",
  active: boolean
) {
  const [tab, setTab] = useState<string>("createIntent");
  // For minting cold intent
  const [coldIntentFeeInput, setColdIntentFeeInput] = useState<string>("");
  const [nativeScriptHex, setNativeScriptHex] = useState<string>("");
  const [coldIntentDatum, setColdIntentDatum] = useState<string>("");
  const [invalidHereafter, setInvalidHereafter] = useState<string>("");

  // For rotating cold ref
  const [coldRefInput, setColdRefInput] = useState<string>("");
  const [coldRefRotationFeeInput, setColdRefRotationFeeInput] =
    useState<string>("");
  const [coldRefRotationIntentInput, setColdRefRotationIntentInput] =
    useState<string>("");
  const [coldRefRotationNativeScriptHex, setColdRefRotationNativeScriptHex] =
    useState<string>("");
  const [coldRefRotationDatum, setColdRefRotationDatum] = useState<string>("");
  const [coldRefNFTPolicy, setColdRefNFTPolicy] = useState<string>("");
  const [coldRefOutputAddress, setColdRefOutputAddress] = useState<string>("");
  const [coldRefRotationInvalidBefore, setColdRefRotationInvalidBefore] =
    useState<string>("");

  const mintColdIntent = async () => {
    const blockfrost = new BlockfrostProvider(
      network === "preprod"
        ? process.env.NEXT_PUBLIC_PREPROD_BLOCKFROST_API_KEY!
        : process.env.NEXT_PUBLIC_MAINNET_BLOCKFROST_API_KEY!
    );
    const txBuilder = new MeshTxBuilder({
      fetcher: blockfrost,
      evaluator: blockfrost,
    });

    const changeAddress = await wallet?.getChangeAddress();

    txBuilder
      .txIn(
        coldIntentFeeInput.split("#")[0],
        Number(coldIntentFeeInput.split("#")[1])
      )
      .txOut(
        resolvePlutusScriptAddress(
          { code: getColdIntentHoldScript(wasm!), version: "V2" },
          network === "preprod" ? 0 : 1
        ),
        [
          { unit: "lovelace", quantity: "2000000" },
          {
            unit: resolveScriptHash(
              getColdIntentTokenPolicyScript(wasm!, network),
              "V2"
            ),
            quantity: "1",
          },
        ]
      )
      .txOutInlineDatumValue(coldIntentDatum, "JSON")
      .mintPlutusScriptV2()
      .mint(
        "1",
        resolveScriptHash(getColdIntentTokenPolicyScript(wasm!, network), "V2"),
        ""
      )
      .mintingScript(getColdIntentTokenPolicyScript(wasm!, network))
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 1,
          fields: [
            {
              bytes: resolveScriptHash(nativeScriptHex),
            },
          ],
        }),
        "JSON"
      )
      .txInCollateral(
        coldIntentFeeInput.split("#")[0],
        Number(coldIntentFeeInput.split("#")[1])
      )
      .withdrawal(
        wasm?.RewardAddress.new(
          network === "preprod" ? 0 : 1,
          wasm.Credential.from_scripthash(
            wasm.ScriptHash.from_hex(resolveScriptHash(nativeScriptHex))
          )
        )
          .to_address()
          .to_bech32()!,
        "0"
      )
      .withdrawalScript(nativeScriptHex)
      .invalidBefore(Number(10))
      .invalidHereafter(Number(invalidHereafter))
      .changeAddress(changeAddress!);

    try {
      const txHex = await txBuilder.complete();
      const signedTxHex = await wallet?.signTx(txHex, true);
      const nftMintTxHash = await wallet?.submitTx(signedTxHex!);
      console.log(nftMintTxHash);
    } catch (err) {
      console.log(err);
    }
  };

  const rotate = async () => {
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
      throw new Error("Set wallet collateral inputs");
    }
    const changeAddress = await wallet?.getChangeAddress();

    const redeemerJSON = JSON.stringify({
      constructor: 1,
      fields: [
        {
          bytes: resolveScriptHash(coldRefRotationNativeScriptHex),
        },
      ],
    });

    txBuilder
      .txIn(
        coldRefRotationFeeInput.split("#")[0],
        Number(coldRefRotationFeeInput.split("#")[1])
      )
      .spendingPlutusScriptV2()
      .txIn(coldRefInput.split("#")[0], Number(coldRefInput.split("#")[1]))
      .txInScript(getColdRefHoldScript(wasm!, network))
      .txInInlineDatumPresent()
      .txInRedeemerValue(redeemerJSON, "JSON")
      .spendingPlutusScriptV2()
      .txIn(
        coldRefRotationIntentInput.split("#")[0],
        Number(coldRefRotationIntentInput.split("#")[1])
      )
      .txInScript(getColdIntentHoldScript(wasm!))
      .txInInlineDatumPresent()
      .txInRedeemerValue(redeemerJSON, "JSON")
      .mintPlutusScriptV2()
      .mint(
        "-1",
        resolveScriptHash(getColdIntentTokenPolicyScript(wasm!, network), "V2"),
        ""
      )
      .mintingScript(getColdIntentTokenPolicyScript(wasm!, network))
      .mintRedeemerValue(redeemerJSON, "JSON")
      .withdrawal(
        wasm?.RewardAddress.new(
          network === "preprod" ? 0 : 1,
          wasm.Credential.from_scripthash(
            wasm.ScriptHash.from_hex(
              resolveScriptHash(coldRefRotationNativeScriptHex)
            )
          )
        )
          .to_address()
          .to_bech32()!,
        "0"
      )
      .withdrawalScript(coldRefRotationNativeScriptHex)
      .txOut(coldRefOutputAddress, [
        {
          unit: "lovelace",
          quantity: "20000000",
        },
        {
          unit: coldRefNFTPolicy,
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(coldRefRotationDatum, "JSON")
      .txInCollateral(
        collateralInputs[0].input.txHash,
        collateralInputs[0].input.outputIndex,
        collateralInputs[0].output.amount,
        collateralInputs[0].output.address
      )
      .invalidBefore(Number(coldRefRotationInvalidBefore))
      .changeAddress(changeAddress!);

    try {
      const txHex = await txBuilder.complete();
      const signedTxHex = await wallet?.signTx(txHex, true);
      const txHash = await wallet?.submitTx(signedTxHex!);
      console.log(txHash);
    } catch (err) {
      console.log(err);
    }
  };

  const testButton = () => {
    // console.log(
    //   "cold ref hold",
    //   resolveScriptHash(getColdRefHoldScript(wasm!, network), "V2"),
    //   resolvePlutusScriptAddress(
    //     {
    //       code: getColdRefHoldScript(wasm!, network),
    //       version: "V2",
    //     },
    //     network === "preprod" ? 0 : 1
    //   ),
    //   getColdRefHoldScript(wasm!, network)
    // );
    // console.log(
    //   "cold intent hold",
    //   resolveScriptHash(getColdIntentHoldScript(wasm!), "V2"),
    //   resolvePlutusScriptAddress(
    //     {
    //       code: getColdIntentHoldScript(wasm!),
    //       version: "V2",
    //     },
    //     network === "preprod" ? 0 : 1
    //   ),
    //   getColdIntentHoldScript(wasm!)
    // );
    // console.log(
    //   "cold intent policy",
    //   resolveScriptHash(getColdIntentTokenPolicyScript(wasm!, network), "V2"),
    //   getColdIntentTokenPolicyScript(wasm!, network)
    // );
    // console.log(resolveNativeScriptHex(nativeScript("7")));
  };

  return (
    <div className={`w-1/2 ${active ? "block" : "hidden"}`}>
      <ul className="mb-2 flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
        <li className="me-2">
          <a
            onClick={() => setTab("createIntent")}
            href="#"
            aria-current="page"
            className={tab === "createIntent" ? tabActive : tabInactive}
          >
            Create Intent
          </a>
        </li>
        <li className="me-2">
          <a
            onClick={() => setTab("consumeIntent")}
            href="#"
            className={tab === "consumeIntent" ? tabActive : tabInactive}
          >
            Consume Intent (Rotate)
          </a>
        </li>
        <li className="me-2">
          <a
            onClick={() => setTab("test")}
            href="#"
            className={tab === "test" ? tabActive : tabInactive}
          >
            Test
          </a>
        </li>
      </ul>
      {tab === "createIntent" && (
        <>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Fee Input
            </label>
            <input
              type="text"
              id="small-input"
              className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="txHash#index"
              value={coldIntentFeeInput}
              onChange={(e) => setColdIntentFeeInput(e.target.value)}
            ></input>
          </div>
          <div className="mb-4">
            <label
              htmlFor="message"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Native Script Hex
            </label>
            <textarea
              id="message"
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Native Script Hex"
              value={nativeScriptHex}
              onChange={(e) => setNativeScriptHex(e.target.value)}
            ></textarea>
          </div>
          <div className="mb-4">
            <label
              htmlFor="message"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Cold Intent Datum
            </label>
            <textarea
              id="message"
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Datum in JSON format"
              value={coldIntentDatum}
              onChange={(e) => setColdIntentDatum(e.target.value)}
            ></textarea>
          </div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Invalid hereafter
          </label>
          <input
            type="text"
            id="small-input"
            className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="slots"
            value={invalidHereafter}
            onChange={(e) => setInvalidHereafter(e.target.value)}
          ></input>
          <button
            onClick={() => mintColdIntent()}
            type="button"
            className="mt-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          >
            Create Intent
          </button>
        </>
      )}
      {tab === "consumeIntent" && (
        <>
          <div>
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
                Cold Rotation Intent Input
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="txHash#index"
                value={coldRefRotationIntentInput}
                onChange={(e) => setColdRefRotationIntentInput(e.target.value)}
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
                value={coldRefRotationFeeInput}
                onChange={(e) => setColdRefRotationFeeInput(e.target.value)}
              ></input>
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Cold Ref NFT Policy
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="cold ref nft policy"
                value={coldRefNFTPolicy}
                onChange={(e) => setColdRefNFTPolicy(e.target.value)}
              ></input>
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Cold Ref Output Address
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
              <label
                htmlFor="message"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Native Script Hex
              </label>
              <textarea
                id="message"
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Native Script Hex"
                value={coldRefRotationNativeScriptHex}
                onChange={(e) =>
                  setColdRefRotationNativeScriptHex(e.target.value)
                }
              ></textarea>
            </div>
            <div className="mb-4">
              <label
                htmlFor="message"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                New Cold Ref Datum
              </label>
              <textarea
                id="message"
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Datum in JSON format"
                value={coldRefRotationDatum}
                onChange={(e) => setColdRefRotationDatum(e.target.value)}
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Invald before
              </label>
              <input
                type="text"
                id="small-input"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="invalid before"
                value={coldRefRotationInvalidBefore}
                onChange={(e) =>
                  setColdRefRotationInvalidBefore(e.target.value)
                }
              ></input>
            </div>
            <button
              onClick={() => rotate()}
              type="button"
              className="mt-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
              Consume Intent
            </button>
          </div>
        </>
      )}
      {tab === "test" && (
        <>
          <button
            onClick={() => testButton()}
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          >
            Test Button
          </button>
        </>
      )}
    </div>
  );
}
