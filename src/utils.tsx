import {
    applyParamsToScript,
    NativeScript,
    Network,
    resolvePlutusScriptAddress,
    resolveScriptHash,
  } from "@meshsdk/core";
  import { resolveNativeScriptHash } from "@meshsdk/core-csl";
  
  type WasmModule = typeof import("@emurgo/cardano-serialization-lib-browser");
  
  export const nativeScript = (nonce: string): NativeScript => {
    return {
      type: "all",
      scripts: [
        {
          type: "sig",
          keyHash: "4689263c8aedf782c5f44f2f920142a8de58dc10c4aff11b0fb84080",
        },
        {
          type: "after",
          slot: nonce,
        },
      ],
    };
  };
  
  const authorityMapDatum = JSON.stringify({
    map: [
      {
        k: {
          constructor: 1,
          fields: [
            {
              bytes: resolveNativeScriptHash(nativeScript("3")),
            },
          ],
        },
        v: {
          int: 3,
        },
      },
      {
        k: {
          constructor: 1,
          fields: [
            {
              bytes: resolveNativeScriptHash(nativeScript("4")),
            },
          ],
        },
        v: {
          int: 4,
        },
      },
      {
        k: {
          constructor: 1,
          fields: [
            {
              bytes: resolveNativeScriptHash(nativeScript("5")),
            },
          ],
        },
        v: {
          int: 5,
        },
      },
      {
        k: {
          constructor: 1,
          fields: [
            {
              bytes: resolveNativeScriptHash(nativeScript("6")),
            },
          ],
        },
        v: {
          int: 6,
        },
      },
      {
        k: {
          constructor: 1,
          fields: [
            {
              bytes: resolveNativeScriptHash(nativeScript("7")),
            },
          ],
        },
        v: {
          int: 7,
        },
      },
    ],
  });
  
  const nonce = "54737974787743327542326c4b654767436b755136";
  
  export const getColdIntentHoldScript = (wasm: WasmModule) => {
    return applyParamsToScript(
      "5905d801000032323232323232232232232323232322322533300e32323232323232325333016300f3017375400226464a666030602460326ea80044c8c94ccc068cdc3a400860366ea80044c8c8c8c94ccc078c060c07cdd5000899192999810180d18109baa0011325333021533302132330010013756604e60506050605060506050605060486ea8c03cc090dd500a9129998130008a501325333024325333025301f30263754002266ebcc0a8c09cdd500080d0b181298148010a5113300300300130290011337126eb4c098c09cc09cc09cc08cdd50038008a501533302100313375e6e98c8ccc004004018cc050dd59813981418141814181418121baa300f3024375402a9110022253330270021001132333004004302b0033322323300100100522533302c00113302d337606ea4010dd3001a5eb7bdb1804c8c8c8c94ccc0b4cdc800400109981899bb037520106e9801c01454ccc0b4cdc78040010992999817181418179baa001133032337606ea4024c0ccc0c0dd5000802080219299981729998188008a5114a02980103d87a80001301e33032374c00297ae03233300100100800222253330330021001132333004004303700333223233001001005225333038001133039337606ea4010dd4001a5eb7bdb1804c8c8c8c94ccc0e4cdc800400109981e99bb037520106ea001c01454ccc0e4cdc7804001099299981d181a181d9baa00113303e337606ea4024c0fcc0f0dd5000802080219299981d181a0008a60103d87a80001302a3303e375000297ae03370000e00226607a66ec0dd48011ba800133006006003375a60740066eb8c0e0008c0f0008c0e8004dd718190009bad30330013035002133031337606ea4008dd3000998030030019bab302e003375c60580046060004605c0026eb8c098004dd59813800981480126101a00014a02940dd6981298111baa00116323300100101e22533302400114c0103d87a8000132323253330243375e032604a00626028660506ea00052f5c026600a00a0046eb4c094008c0a0008c098004c94ccc07ccdc3a400860406ea80044c8cdc79b9437660026eb8c044c088dd500d981218109baa00116300a30203754604660406ea800458c030cc02cdd61804980f9baa300a301f3754020466ebcc02cc080dd5000980518101baa0193300e3756601a603c6ea8c034c078dd50022441003012001301f301c37540022c600a60366ea8c028c06cdd5000980e980d1baa001163006330053758600860326ea8c010c064dd5005119baf3005301a3754002004603660306ea800458c018c05cdd50041180d180d980d8009180c80091191980080080191299980c8008a5eb804c8c94ccc060c0140084cc070008cc0100100044cc010010004c074008c06c00494ccc0540045300103d87a8000130023301630170014bd701ba5480008c054c05800488c8cc00400400c894ccc05400452f5bded8c0264646464a66602c66e4401c00854ccc058cdc78038010801880289980d19bb037520046e98004cc01801800cdd5980b8019bae30150023019002301700114984d958c010004c00401494ccc028c010c02cdd500089919191919191919299980a980c00109924ca666024601860266ea800c4c8c8c8c94ccc064c0700084c8c926325333018301200113232533301d3020002132498c94ccc06cc0540044c8c94ccc080c08c0084c9263015001163021001301d37540042a66603660280022646464646464a666048604e0042930b1bad30250013025002375a604600260460046eb4c084004c074dd50010b180d9baa00116301e001301a37540062a66603060220022a66603660346ea800c526161630183754004601c0062c60340026034004603000260286ea800c5858dd6980b000980b001180a000980a0011bae30120013012002375a602000260186ea8004588c94ccc028c0100044c8c94ccc03cc04800852616375c602000260186ea800854ccc028c00c0044c8c94ccc03cc04800852616375c602000260186ea800858c028dd50009b8748008dc3a40006eb8004dd5800ab9a5573aaae7955cfaba05742ae89",
      [
        wasm?.PlutusData.from_json(
          authorityMapDatum,
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
        wasm?.PlutusData.from_json(
          JSON.stringify({
            bytes: nonce,
          }),
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
      ],
      "CBOR"
    );
  };
  
  export const getColdIntentTokenPolicyScript = (
    wasm: WasmModule,
    network: Network
  ) => {
    return applyParamsToScript(
      "59053c0100003232323232323223222322323232322533300c3232323232325333012300b3013375400226464a66602866ebcdd30009ba6333005002488100480084c94ccc054c038c058dd500089919299980b99b8748010c060dd5000899191919299980d980a180e1baa00113232533301d3375e601e603e6ea802006854ccc07401040045280a50533301c323300100137566044604660466046604660466046603e6ea8c03cc07cdd50091129998108008a50132533301f325333020301930213754002266ebcc094c088dd500080d0b181018120010a51133003003001302400113370e6eb4c084c088c088c088c078dd50028008a50375a6040603a6ea800458c8cc004004064894ccc07c004530103d87a80001323232533301f3375e0326040006266e95200033023375000297ae0133005005002375a6040004604600460420026464a66603660280022c2a6660366026002266e24dd69810180e9baa002375a601a603a6ea801058c06cdd50009805980d9baa301e301f301b3754603c603e603e603e603e603e603e603e60366ea8c02cc06cdd5007299980c1808980c9baa00113232323232323232533302330260021324994ccc080c064c084dd5001899191919299981398150010991924c64a66604c603e00226464a666056605c004264931929998149811000899192999817181880109924c60440022c605e00260566ea800854ccc0a4c0840044c8c8c8c8c8c94ccc0c8c0d400852616375a606600260660046eb4c0c4004c0c4008dd6981780098159baa00216302937540022c605800260506ea800c54ccc098c07800454ccc0a4c0a0dd50018a4c2c2c604c6ea8008c06c00c58c0a0004c0a0008c098004c088dd50018b0b1bad3024001302400230220013022002375c604000260400046eb4c078004c068dd50008b180e180c9baa001163006301837540026034602e6ea800458c94ccc0600045300103d87a800013374a90001980c980d000a5eb80c8cc004004dd61802980b9baa30073017375401444a666032002297ae01323253330183375e6e98cc030dd59805980d1baa002488100374c66601200c91100480084cc070008cc0100100044cc010010004c074008c06c00454ccc050cdd79ba6001374c66600a00491100480045288a5033007375660306032603260326032602a6ea8c014c054dd500424500375c602e60286ea800458c010c04cdd50031180b180b980b800911299980918058008a5eb7bdb1804c8c8cc0040052f5bded8c044a66603000226603266ec0dd48031ba60034bd6f7b630099191919299980c99b9000a00213301d337606ea4028dd30038028a99980c99b8f00a00213301d337606ea4028dd300380189980e99bb037520046e98004cc01801800cdd5980d0019bae3018002301c002301a00132330010014bd6f7b63011299980b80089980c19bb037520086ea000d2f5bded8c0264646464a66603066e400200084cc070cdd81ba9008375000e00a2a66603066e3c0200084cc070cdd81ba9008375000e00626603866ec0dd48011ba800133006006003375a60320066eb8c05c008c06c008c0640048c0500048c04cc05000488c8cc00400400c894ccc04c00452f5bded8c0264646464a66602866e4401c00854ccc050cdc78038010801880289980c19bb037520046e98004cc01801800cdd5980a8019bae30130023017002301500114984d958c0040108c94ccc02cc0100044c8c94ccc040c04c00852616375c6022002601a6ea800854ccc02cc00c0044c8c94ccc040c04c00852616375c6022002601a6ea800858c02cdd50009b8748008dc3a40006eb8004dd5800ab9a5573aaae7955cfaba05742ae89",
      [
        wasm?.PlutusData.from_json(
          authorityMapDatum,
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
        wasm?.PlutusData.from_address(
          wasm?.Address.from_bech32(
            resolvePlutusScriptAddress(
              { code: getColdIntentHoldScript(wasm), version: "V2" },
              network === "preprod" ? 0 : 1
            )
          )
        ).to_hex()!,
        wasm?.PlutusData.from_json(
          JSON.stringify({
            bytes: nonce,
          }),
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
      ],
      "CBOR"
    );
  };
  
  export const getColdRefHoldScript = (wasm: WasmModule, network: Network) => {
    return applyParamsToScript(
      "5904300100003232323232323223223223222323232322533300e32323232325333016301900213253330143370e9002180a9baa0011323232325333018300f3019375400226464a666034008200229414ccc064c8cc004004dd5980f981018101810181018101810180e1baa300c301c375401a44a66603c00229404c94ccc070c94ccc074c050c078dd5000899baf3022301f375400202a2c603a604200429444cc00c00c004c0840044cdc49bad301e301f301f301f301b375400a0022940dd6980e980d1baa00116323300100101622533301c00114c0103d87a80001323232533301c3375e028603a00626018660406ea00052f5c026600a00a0046eb4c074008c080008c078004c8c94ccc060c03c0045854ccc060c0380044cdc499b80375a601460346ea80112080f0b252375a603a60346ea800858c060dd50009804180c1baa301b301837546036603860386038603860386038603860306ea8c020c060dd5004a99980a9806180b1baa00113232323232323232533302030230021324994ccc074c050c078dd5001899191919299981218138010991924c64a666046603400226464a666050605600426493192999813180e800899192999815981700109924c603a0022c605800260506ea800854ccc098c0700044c8c8c8c8c8c94ccc0bcc0c800852616375a606000260600046eb4c0b8004c0b8008dd6981600098141baa00216302637540022c6052002604a6ea800c54ccc08cc06400454ccc098c094dd50018a4c2c2c60466ea8008c05800c58c094004c094008c08c004c07cdd50018b0b1bad30210013021002301f001301f002375c603a002603a0046eb4c06c004c05cdd50008b180c980b1baa00116301830193019301537546008602a6ea800458c05c004c8cc004004dd61802180a1baa30043014375400a44a66602c002297ae013232533301533712900119299980b1806180b9baa0011480004dd6980d980c1baa001325333016300c301737540022980103d87a8000132330010013756603860326ea8008894ccc06c004530103d87a8000132323232533301c33722911000021533301c3371e9101000021300c33020375000297ae014c0103d87a8000133006006003375a603a0066eb8c06c008c07c008c074004c8cc004004dd59803980c1baa30073018375400644a666034002298103d87a8000132323232533301b3372202e0042a66603666e3c05c0084c02ccc07cdd3000a5eb80530103d87a8000133006006003375660380066eb8c068008c078008c0700044cc064008cc0100100044cc010010004c068008c060004dd2a40004602a602c0024602800229309b2b180080211929998069802000899192999809180a8010a4c2c6eb8c04c004c03cdd50010a9998069801800899192999809180a8010a4c2c6eb8c04c004c03cdd50010b18069baa001370e90011b8748000dd70009bae0013756002ae6955ceaab9e5573eae815d0aba201",
      [
        wasm?.PlutusData.from_json(
          authorityMapDatum,
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
        wasm?.PlutusData.from_json(
          JSON.stringify({
            bytes: resolveScriptHash(
              getColdIntentTokenPolicyScript(wasm, network),
              "V2"
            ),
          }),
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
        wasm?.PlutusData.from_json(
          JSON.stringify({
            bytes: nonce,
          }),
          wasm.PlutusDatumSchema.DetailedSchema
        ).to_hex()!,
      ],
      "CBOR"
    );
  };
  