import {
  applyParamsToScript,
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  NativeScript,
  resolveNativeScriptHash,
  resolveNativeScriptHex,
  resolvePlutusScriptAddress,
  resolveScriptHash,
} from "@meshsdk/core";
import { useState } from "react";
import {
  getColdIntentHoldScript,
  getColdIntentTokenPolicyScript,
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

  const testMintColdIntent = async () => {
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
      .invalidHereafter(78047791)
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

  const testRotate = async () => {
    const nativeScript: NativeScript = {
      type: "atLeast",
      required: 1,
      scripts: [
        {
          type: "sig",
          keyHash: "4689263c8aedf782c5f44f2f920142a8de58dc10c4aff11b0fb84080",
        },
      ],
    };

    const blockfrost = new BlockfrostProvider(
      network === "preprod"
        ? process.env.NEXT_PUBLIC_PREPROD_BLOCKFROST_API_KEY!
        : process.env.NEXT_PUBLIC_MAINNET_BLOCKFROST_API_KEY!
    );
    const txBuilder = new MeshTxBuilder({
      fetcher: blockfrost,
      evaluator: blockfrost,
    });

    const authorityMapDatum = JSON.stringify({
      map: [
        {
          k: {
            constructor: 1,
            fields: [
              {
                bytes: resolveNativeScriptHash(nativeScript),
              },
            ],
          },
          v: {
            int: 7,
          },
        },
      ],
    });

    const coldIntentHoldScript = applyParamsToScript(
      "5905d401000032323232323232232232323232322322533300c32323232323232325333014300f3015375400226464a66602c6024602e6ea80044c8c94ccc060cdc3a400860326ea80044c8c8c8c94ccc070c060c074dd500089919299980f180d180f9baa001132533301f533301f32330010013756604a604c604c604c604c604c604c60446ea8c03cc088dd500a9129998120008a501325333022325333023301f30243754002266ebcc0a0c094dd500080d0b181198138010a5113300300300130270011337126eb4c090c094c094c094c084dd50038008a501533301f00313375e6e98c8ccc004004018cc050dd59812981318131813181318111baa300f3022375402a9101002225333025002100113233300400430290033322323300100100522533302a00113302b337606ea4010dd3001a5eb7bdb1804c8c8c8c94ccc0accdc800400109981799bb037520106e9801c01454ccc0accdc78040010992999816181418169baa001133030337606ea4024c0c4c0b8dd5000802080219299981629998178008a5114a02980103d87a80001301e33030374c00297ae03233300100100800222253330310021001132333004004303500333223233001001005225333036001133037337606ea4010dd4001a5eb7bdb1804c8c8c8c94ccc0dccdc800400109981d99bb037520106ea001c01454ccc0dccdc7804001099299981c181a181c9baa00113303c337606ea4024c0f4c0e8dd5000802080219299981c181a0008a60103d87a80001302a3303c375000297ae03370000e00226607666ec0dd48011ba800133006006003375a60700066eb8c0d8008c0e8008c0e0004dd718180009bad3031001303300213302f337606ea4008dd3000998030030019bab302c003375c6054004605c00460580026eb8c090004dd59812800981380126101a00014a02940dd6981198101baa00116323300100101c22533302200114c0103d87a8000132323253330223375e0326046006260286604c6ea00052f5c026600a00a0046eb4c08c008c098008c090004c94ccc074cdc3a4008603c6ea80044c8cdc79b9437660026eb8c044c080dd500d9811180f9baa00116300a301e37546042603c6ea800458c030cc02cdd61804980e9baa300a301d3754020466ebcc02cc078dd50009805180f1baa0193300e3756601a60386ea8c034c070dd50022441003012001301d301a37540022c600a60326ea8c028c064dd5000980d980c1baa0011630063300537586008602e6ea8c010c05cdd5005119baf3005301837540020046032602c6ea800458c018c054dd50041180c180c980c8009180b80091191980080080191299980b8008a5eb804c8c94ccc058c0140084cc068008cc0100100044cc010010004c06c008c06400494ccc04c0045300103d87a8000130023301430150014bd701ba5480008c04cc05000488c8cc00400400c894ccc04c00452f5bded8c0264646464a66602866e4401c00854ccc050cdc78038010801880289980c19bb037520046e98004cc01801800cdd5980a8019bae30130023017002301500114984d958c010004c00401494ccc020c010c024dd5000899191919191919192999809980b00109924ca666020601860226ea800c4c8c8c8c94ccc05cc0680084c8c926325333016301200113232533301b301e002132498c94ccc064c0540044c8c94ccc078c0840084c926301500116301f001301b37540042a66603260280022646464646464a666044604a0042930b1bad30230013023002375a604200260420046eb4c07c004c06cdd50010b180c9baa00116301c001301837540062a66602c60220022a66603260306ea800c526161630163754004601c0062c60300026030004602c00260246ea800c5858dd6980a000980a001180900098090011bae30100013010002375a601c00260146ea8004588c94ccc020c0100044c8c94ccc034c04000852616375c601c00260146ea800854ccc020c00c0044c8c94ccc034c04000852616375c601c00260146ea800858c020dd50009b8748008dc3a40006eac0055cd2ab9d5573caae7d5d02ba157441",
      [
        wasm?.PlutusData.from_json(
          authorityMapDatum,
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
      ],
      "CBOR"
    );

    const coldIntentTokenPolicyScript = applyParamsToScript(
      "5905370100003232323232323223222323232322533300a3232323232325333010300b3011375400226464a66602466ebcdd30009ba633300500248900480084c94ccc04cc038c050dd500089919299980a99b8748010c058dd5000899191919299980c980a180d1baa00113232533301b3375e601e603a6ea802006054ccc06c01040045280a50533301a323300100137566040604260426042604260426042603a6ea8c03cc074dd500911299980f8008a50132533301d32533301e3019301f3754002266ebcc08cc080dd500080d0b180f18110010a51133003003001302200113370e6eb4c07cc080c080c080c070dd50028008a50375a603c60366ea800458c8cc00400405c894ccc074004530103d87a80001323232533301d3375e032603c006266e95200033021375000297ae0133005005002375a603c0046042004603e0026464a66603260280022c2a6660326026002266e24dd6980f180d9baa002375a601a60366ea801058c064dd50009805980c9baa301c301d301937546038603a603a603a603a603a603a603a60326ea8c02cc064dd5007299980b1808980b9baa00113232323232323232533302130240021324994ccc078c064c07cdd5001899191919299981298140010991924c64a666048603e00226464a6660526058004264931929998139811000899192999816181780109924c60440022c605a00260526ea800854ccc09cc0840044c8c8c8c8c8c94ccc0c0c0cc00852616375a606200260620046eb4c0bc004c0bc008dd6981680098149baa00216302737540022c6054002604c6ea800c54ccc090c07800454ccc09cc098dd50018a4c2c2c60486ea8008c06c00c58c098004c098008c090004c080dd50018b0b1bad3022001302200230200013020002375c603c002603c0046eb4c070004c060dd50008b180d180b9baa001163006301637540026030602a6ea800458c94ccc0580045300103d87a800013374a90001980b980c000a5eb80c8cc004004dd61802980a9baa30073015375401444a66602e002297ae01323253330163375e6e98cc030dd59805980c1baa002488100374c66601200c91100480084cc068008cc0100100044cc010010004c06c008c06400454ccc048cdd79ba6001374c66600a00491100480045288a50330073756602c602e602e602e602e60266ea8c014c04cdd500424500375c602a60246ea800458c010c044dd50031180a180a980a800911299980818058008a5eb7bdb1804c8c8cc0040052f5bded8c044a66602c00226602e66ec0dd48031ba60034bd6f7b630099191919299980b99b9000a00213301b337606ea4028dd30038028a99980b99b8f00a00213301b337606ea4028dd300380189980d99bb037520046e98004cc01801800cdd5980c0019bae3016002301a002301800132330010014bd6f7b63011299980a80089980b19bb037520086ea000d2f5bded8c0264646464a66602c66e400200084cc068cdd81ba9008375000e00a2a66602c66e3c0200084cc068cdd81ba9008375000e00626603466ec0dd48011ba800133006006003375a602e0066eb8c054008c064008c05c0048c0480048c044c04800488c8cc00400400c894ccc04400452f5bded8c0264646464a66602466e4401c00854ccc048cdc78038010801880289980b19bb037520046e98004cc01801800cdd598098019bae30110023015002301300114984d958c0040108c94ccc024c0100044c8c94ccc038c04400852616375c601e00260166ea800854ccc024c00c0044c8c94ccc038c04400852616375c601e00260166ea800858c024dd50009b8748008dc3a40006eac0055cd2ab9d5573caae7d5d02ba157441",
      [
        wasm?.PlutusData.from_json(
          authorityMapDatum,
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
        wasm?.PlutusData.from_address(
          wasm?.Address.from_bech32(
            resolvePlutusScriptAddress(
              { code: coldIntentHoldScript, version: "V2" },
              network === "preprod" ? 0 : 1
            )
          )
        ).to_hex()!,
      ],
      "CBOR"
    );

    const coldRefHoldScript = applyParamsToScript(
      "590925010000323232323232323232323232232232223232323232253330103232323253330180011533015012161325333019301c00213253330163370e9002180c1baa00113232323232533301b3010301d375400226464a66603aa66603a008294454cc0792411174746c5f636865636b203f2046616c73650014a02a66603a002294454cc079240117617574686f726974795f636865636b203f2046616c73650014a029414ccc070c8cc004004dd5981198121812181218121812181218101baa300d3020375401c44a66604400229404c94ccc07cc94ccc080c054c088dd5000899baf30263023375400202c2a660429212465787065637420496e6c696e65286372656429203d207769746864726177616c2e31737400163021302500214a2266006006002604a002266e24dd69811181198119811980f9baa00500114a06eb4c084c078dd50008a9980e24814265787065637420536f6d6528617574686f726974795f6e756d62657229203d206765745f666972737428617574686f726974795f6d61702c2072656465656d6572290016323300100101622533302000114c0103d87a80001323232533301f3375e02a60420062601a660486ea00052f5c026600a00a0046eb4c084008c090008c088004c8c94ccc06cc04000454cc071241295472616e73616374696f6e2074746c2073686f756c6420686176652061206c6f77657220626f756e6400161533301b300f0011337126eb4c02cc078dd50021bad3021301e37540042a66038921375472616e73616374696f6e206c6f77657220626f756e642073686f756c64206e6f7420626520706f73697469766520696e66696e6974790016301c3754002601260386ea8c07cc070dd5180f9810181018101810181018101810180e1baa3009301c3754014a666030601a60346ea80044c94ccc07400454cc068060584c8c94ccc07c00454cc070068584c8c94ccc08400454cc078070584c8c94ccc08c00454cc080078584c94ccc090c09c0084c9265333020301530223754006264a66604a0022a660440402c26464a66604e0022a660480442c264a66605060560042646493192999813180d80089929998158008a998140130b0992999816181780109924c64a666052603c002264a66605c0022a660560522c264a66605e6064004264931980f0008150a998160150b19299999981980088008a998160150b0a998160150b0a998160150b0a998160150b181800098161baa00215333029301d001132533302e001153302b02916132325333030001153302d02b16132325333032001153302f02d1613253330333036002149854cc0c00b858c94cccccc0dc00454cc0c00b85854cc0c00b85854cc0c00b8584dd68008a998180170b181a000981a00119299999981a8008a998170160b0a998170160b0a998170160b09bad001153302e02c1630320013032002325333333033001153302c02a16153302c02a16153302c02a161375a0022a660580542c606000260586ea800854cc0a80a058c0a8dd50008a998148138b19299999981800088008a998148138b0a998148138b0a998148138b0a998148138b181680098149baa00315333026301a0011533302a302937540062930a998138128b0a998138128b18139baa0023301700302315330250231632533333302c00110011533025023161533025023161533025023161533025023163029001302900232533333302a00110011533023021161533023021161533023021161533023021163027001302337540062a6604203e2c2a6604203e2c64a6666660500022a6604203e2c2a6604203e2c2a6604203e2c26eb400454cc08407c58c094004c094008c94cccccc098004400454cc07c0745854cc07c0745854cc07c0745854cc07c07458c08c004c08c008c94cccccc09000454cc07406c5854cc07406c5854cc07406c5854cc07406c584dd7000981080098108011929999998110008a9980d80c8b0a9980d80c8b0a9980d80c8b09bad001153301b01916301f001301b37540022a6603202e2ca66666603e00220022a6603002c2c2a6603002c2c2a6603002c2c2a6603002c2c603860326ea800454cc05d2414165787065637420496e6c696e65446174756d28696e74656e745f696e7075745f6461746129203d20696e74656e745f696e7075742e6f75747075742e646174756d0016301b301c301c30183754600860306ea800454cc05804c58c068004c8cc004004dd61802180b9baa30043017375400a44a666032002297ae013232533301733712900119299980c1806180d1baa0011480004dd6980f180d9baa001325333018300c301a3754002298103d87a8000132330010013756603e60386ea8008894ccc078004530103d87a8000132323232533301e33722911000021533301e3371e9101000021300c33023375000297ae014c0103d87a8000133006006003375a60400066eb8c078008c088008c080004c8cc004004dd59803980d9baa3007301b375400644a66603a002298103d87a8000132323232533301d3372202c0042a66603a66e3c0580084c02ccc088dd3000a5eb80530103d87a80001330060060033756603e0066eb8c074008c084008c07c0044cc070008cc0100100044cc010010004c074008c06c004dd2a40004603060320024602e0022930a99808a4811856616c696461746f722072657475726e65642066616c736500136563300100400b223253330103005001132533301500115330120031613253330163019002149854cc04c01058c94cccccc06800454cc04c0105854cc04c0105854cc04c0105854cc04c010584dd7000980b80098099baa003153330103004001132533301500115330120031613253330163019002149854cc04c01058c94cccccc06800454cc04c0105854cc04c0105854cc04c0105854cc04c010584dd7000980b80098099baa003153301100216301137540046e1d2002370e9000299999980900088008a998058038b0a998058038b0a998058038b0a998058038b1bae00137560029211472656465656d65723a2043726564656e7469616c00490125657870656374205b696e74656e745f696e7075745d203d20696e74656e745f696e707574730049014165787065637420696e74656e745f696e7075745f646174756d3a20436f6c64526566496e74656e74446174756d203d20696e74656e745f696e7075745f64617461005734ae7155ceaab9e5573eae815d0aba257481",
      [
        wasm?.PlutusData.from_json(
          authorityMapDatum,
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
        wasm?.PlutusData.from_json(
          JSON.stringify({
            bytes: resolveScriptHash(coldIntentTokenPolicyScript, "V2"),
          }),
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
      ],
      "CBOR"
    );

    const utxos = await wallet?.getUtxos();

    let collateralInputs = await wallet?.getCollateral();
    if (!collateralInputs || collateralInputs.length === 0) {
      collateralInputs = [
        (await blockfrost.fetchUTxOs(utxos![0].input.txHash))[0],
      ];
    }

    const changeAddress = await wallet?.getChangeAddress();

    txBuilder
      .txIn(
        "46bed7887344538c901fed5900e7b2151cdb0465cb4f61ab52adcbfb7c11c23b",
        1
      )
      .spendingPlutusScriptV2()
      .txIn(
        "55fd150669aedbf6ae6e79c905b44159d1ba87481d13dfd707398f94c7eeff21",
        0
      )
      .txInScript(coldRefHoldScript)
      .txInInlineDatumPresent()
      .txInRedeemerValue(
        JSON.stringify({
          constructor: 1,
          fields: [
            {
              bytes: resolveNativeScriptHash(nativeScript),
            },
          ],
        }),
        "JSON"
      )
      .spendingPlutusScriptV2()
      .txIn(
        "4319e59e767ffdb9a8f1f03afc60379ee490362c0a8d59523c7119b04fba00e2",
        0
      )
      .txInScript(coldIntentHoldScript)
      .txInInlineDatumPresent()
      .txInRedeemerValue(
        JSON.stringify({
          constructor: 1,
          fields: [
            {
              bytes: resolveNativeScriptHash(nativeScript),
            },
          ],
        }),
        "JSON"
      )
      .mintPlutusScriptV2()
      .mint("-1", resolveScriptHash(coldIntentTokenPolicyScript, "V2"), "")
      .mintingScript(coldIntentTokenPolicyScript)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 1,
          fields: [
            {
              bytes: resolveNativeScriptHash(nativeScript),
            },
          ],
        }),
        "JSON"
      )
      .withdrawal(
        wasm?.RewardAddress.new(
          network === "preprod" ? 0 : 1,
          wasm.Credential.from_scripthash(
            wasm.ScriptHash.from_hex(resolveNativeScriptHash(nativeScript))
          )
        )
          .to_address()
          .to_bech32()!,
        "0"
      )
      .withdrawalScript(resolveNativeScriptHex(nativeScript))
      .txOut(
        "addr_test1vprgjf3u3tkl0qk9738jlyspg25dukxuzrz2lugmp7uypqqnxjrcg",
        [
          {
            unit: "lovelace",
            quantity: "1500000",
          },
        ]
      )
      .txOutInlineDatumValue(
        JSON.stringify({
          bytes: "616263",
        }),
        "JSON"
      )
      .txInCollateral(
        collateralInputs[0].input.txHash,
        collateralInputs[0].input.outputIndex,
        collateralInputs[0].output.amount,
        collateralInputs[0].output.address
      )
      .invalidBefore(78224263)
      .changeAddress(changeAddress!);

    try {
      const txHex = await txBuilder.complete();
      console.log(txHex);
    //   const signedTxHex = await wallet?.signTx(txHex, true);
    //   const txHash = await wallet?.submitTx(signedTxHex!);
    //   console.log(txHash);
    } catch (err) {
      console.log(err);
    }
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
          <button
            onClick={() => testMintColdIntent()}
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          >
            Create Intent
          </button>
        </>
      )}
      {tab === "consumeIntent" && (
        <>
          <button
            onClick={() => testRotate()}
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          >
            Test Consume Intent
          </button>
        </>
      )}
    </div>
  );
}
