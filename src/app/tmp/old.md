inject.js:1 Port connected
inject.js:1 Port connected
inpage.js:493 Uncaught TypeError: Cannot redefine property: ethereum
    at Object.defineProperties (<anonymous>)
    at inpage.js:493:68642
    at inpage.js:493:69569
    at inpage.js:493:69573
poc.ts:11 creating webauthn key (attestation)...
webauthnAttestation.ts:18 publicKey.pubKeyCredParams is missing at least one of the default algorithm identifiers: ES256 and RS256. This can result in registration failures on incompatible authenticators. See https://chromium.googlesource.com/chromium/src/+/main/content/browser/webauth/pub_key_cred_params.md for details
createWebauthnAttestation @ webauthnAttestation.ts:18
poc.ts:13 created webauthn public key: 0x5e09ec0d31c9d9ca8889d730489eb02bf316515642f6a1547437b3cffdd89cee
poc.ts:39 account classHash 0x36078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f
poc.ts:49 deploy-webauthnOwner= WebauthnOwner {attestation: {…}, rpIdHash: {…}, crossOrigin: false, requestSignature: ƒ}attestation: credentialId: Uint8Array(16) [238, 111, 59, 225, 205, 138, 68, 20, 197, 109, 165, 118, 103, 68, 143, 50, buffer: ArrayBuffer(16), byteLength: 16, byteOffset: 0, length: 16, Symbol(Symbol.toStringTag): 'Uint8Array']email: "toto1"origin: "http://localhost:5173"pubKey: Uint8Array(32) [94, 9, 236, 13, 49, 201, 217, 202, 136, 137, 215, 48, 72, 158, 176, 43, 243, 22, 81, 86, 66, 246, 161, 84, 116, 55, 179, 207, 253, 216, 156, 238, buffer: ArrayBuffer(32), byteLength: 32, byteOffset: 0, length: 32, Symbol(Symbol.toStringTag): 'Uint8Array']rpId: "localhost"[[Prototype]]: ObjectcrossOrigin: falserequestSignature: async (attestation, challenge) => {…}rpIdHash: {low: '0x8fe4aeb9a28632c7995cf3ba831d9763', high: '0x49960de5880e8c687434170f6476605b'}compiledSigner: (...)compiledSignerAsOption: (...)guid: (...)publicKey: (...)signer: (...)signerAsOption: (...)storedValue: (...)[[Prototype]]: KeyPair
poc.ts:50 deploy-classHash= 0x36078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f
poc.ts:56 deploy-classH= 0x36078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f
poc.ts:57 deploy-constructor= (28) ['4', '21', '104', '116', '116', '112', '58', '47', '47', '108', '111', '99', '97', '108', '104', '111', '115', '116', '58', '53', '49', '55', '51', '191266990927768818505269035571842226019', '97812770077760695459826172618884931675', '323118283216146363594228736594812640494', '124998949969550268041867244298005557291', '1', __compiled__: true]
poc.ts:58 deploy-salt= 12n
starknet.ts:70 funding account...
poc.ts:65 deploying account to address 0x447790f13946d6bf65487a38fe55f227c163d79850f2d98f63876366a56132c
signers.ts:154 In MultisigSigner.signRaw
webauthnOwner.ts:121 In WebauthnOwner/signRaw...
webauthnOwner.ts:122 txH= 0x3c74c9d4aee28f1e518cf41c1ff422e43d7e6b30b892aac9a1ab0f009fddb1a
webauthnOwner.ts:124 challenge= Uint8Array(33) [3, 199, 76, 157, 74, 238, 40, 241, 229, 24, 207, 65, 193, 255, 66, 46, 67, 215, 230, 179, 11, 137, 42, 172, 154, 26, 176, 240, 9, 253, 219, 26, 0, buffer: ArrayBuffer(33), byteLength: 33, byteOffset: 0, length: 33, Symbol(Symbol.toStringTag): 'Uint8Array']
webauthnOwner.ts:125 this.attestation {email: 'toto1', rpId: 'localhost', origin: 'http://localhost:5173', credentialId: Uint8Array(16), pubKey: Uint8Array(32)}
webauthnAttestation.ts:55 request signature-attestation= {email: 'toto1', rpId: 'localhost', origin: 'http://localhost:5173', credentialId: Uint8Array(16), pubKey: Uint8Array(32)}
webauthnAttestation.ts:56 request signature-challenge= Uint8Array(33) [3, 199, 76, 157, 74, 238, 40, 241, 229, 24, 207, 65, 193, 255, 66, 46, 67, 215, 230, 179, 11, 137, 42, 172, 154, 26, 176, 240, 9, 253, 219, 26, 0, buffer: ArrayBuffer(33), byteLength: 33, byteOffset: 0, length: 33, Symbol(Symbol.toStringTag): 'Uint8Array']
webauthnAttestation.ts:57 credential.get= {publicKey: {…}}publicKey: {rpId: 'localhost', challenge: Uint8Array(33), allowCredentials: Array(1), userVerification: 'required', timeout: 60000}[[Prototype]]: Object
webauthnOwner.ts:127 assertionResponse= AuthenticatorAssertionResponse {authenticatorData: ArrayBuffer(37), signature: ArrayBuffer(70), userHandle: ArrayBuffer(32), clientDataJSON: ArrayBuffer(244)}
webauthnOwner.ts:132 clientDataJson= {"type":"webauthn.get","challenge":"A8dMnUruKPHlGM9Bwf9CLkPX5rMLiSqsmhqw8An92xoA","origin":"http://localhost:5173","crossOrigin":false,"other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}
webauthnOwner.ts:133 clientDataJson= Uint8Array(244) [123, 34, 116, 121, 112, 101, 34, 58, 34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 103, 101, 116, 34, 44, 34, 99, 104, 97, 108, 108, 101, 110, 103, 101, 34, 58, 34, 65, 56, 100, 77, 110, 85, 114, 117, 75, 80, 72, 108, 71, 77, 57, 66, 119, 102, 57, 67, 76, 107, 80, 88, 53, 114, 77, 76, 105, 83, 113, 115, 109, 104, 113, 119, 56, 65, 110, 57, 50, 120, 111, 65, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116, 116, 112, 58, 47, 47, 108, …]
webauthnOwner.ts:134 authenticatorData= Uint8Array(37) [73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131, 29, 151, 99, 29, 0, 0, 0, 0, buffer: ArrayBuffer(37), byteLength: 37, byteOffset: 0, length: 37, Symbol(Symbol.toStringTag): 'Uint8Array']
webauthnOwner.ts:135 flags= 29
webauthnOwner.ts:136 signCount= 0
webauthnOwner.ts:144 clientDataJsonOutro= Uint8Array(110) [44, 34, 111, 116, 104, 101, 114, 95, 107, 101, 121, 115, 95, 99, 97, 110, 95, 98, 101, 95, 97, 100, 100, 101, 100, 95, 104, 101, 114, 101, 34, 58, 34, 100, 111, 32, 110, 111, 116, 32, 99, 111, 109, 112, 97, 114, 101, 32, 99, 108, 105, 101, 110, 116, 68, 97, 116, 97, 74, 83, 79, 78, 32, 97, 103, 97, 105, 110, 115, 116, 32, 97, 32, 116, 101, 109, 112, 108, 97, 116, 101, 46, 32, 83, 101, 101, 32, 104, 116, 116, 112, 115, 58, 47, 47, 103, 111, 111, 46, 103, …]
webauthnOwner.ts:189 parseASN1Signature ECDSASigValue {r: Uint8Array(32), s: Uint8Array(32)}
webauthnOwner.ts:169 WebauthnOwner signed, signature is: {cross_origin: false, client_data_json_outro: Array(110), flags: 29, sign_count: 0, ec_signature: {…}, …}
webauthnOwner.ts:173 compiled signature= (147) ['4', '21', '104', '116', '116', '112', '58', '47', '47', '108', '111', '99', '97', '108', '104', '111', '115', '116', '58', '53', '49', '55', '51', '191266990927768818505269035571842226019', '97812770077760695459826172618884931675', '323118283216146363594228736594812640494', '124998949969550268041867244298005557291', '0', '110', '44', '34', '111', '116', '104', '101', '114', '95', '107', '101', '121', '115', '95', '99', '97', '110', '95', '98', '101', '95', '97', '100', '100', '101', '100', '95', '104', '101', '114', '101', '34', '58', '34', '100', '111', '32', '110', '111', '116', '32', '99', '111', '109', '112', '97', '114', '101', '32', '99', '108', '105', '101', '110', '116', '68', '97', '116', '97', '74', '83', '79', '78', '32', '97', '103', '97', '105', '110', '115', '116', '32', …]
webauthnOwner.ts:174 {halt: undefined}
signers.ts:160 signer final signature = (148) ['1', '4', '21', '104', '116', '116', '112', '58', '47', '47', '108', '111', '99', '97', '108', '104', '111', '115', '116', '58', '53', '49', '55', '51', '191266990927768818505269035571842226019', '97812770077760695459826172618884931675', '323118283216146363594228736594812640494', '124998949969550268041867244298005557291', '0', '110', '44', '34', '111', '116', '104', '101', '114', '95', '107', '101', '121', '115', '95', '99', '97', '110', '95', '98', '101', '95', '97', '100', '100', '101', '100', '95', '104', '101', '114', '101', '34', '58', '34', '100', '111', '32', '110', '111', '116', '32', '99', '111', '109', '112', '97', '114', '101', '32', '99', '108', '105', '101', '110', '116', '68', '97', '116', '97', '74', '83', '79', '78', '32', '97', '103', '97', '105', '110', '115', '116', …]
poc.ts:67 waiting for deployment tx 0x3c74c9d4aee28f1e518cf41c1ff422e43d7e6b30b892aac9a1ab0f009fddb1a
poc.ts:69 deployed
signers.ts:53 transaction data V2= {tip: 0, paymasterData: Array(0), accountDeploymentData: Array(0), nonceDataAvailabilityMode: 'L1', feeDataAvailabilityMode: 'L1', …}
signers.ts:154 In MultisigSigner.signRaw
webauthnOwner.ts:121 In WebauthnOwner/signRaw...


webauthnOwner.ts:122 txH= 0x3084bd10734b67f6670346bcf45488e89926f0449bf1aa5f0182451b77e20cf
webauthnOwner.ts:124 challenge= Uint8Array(33) [3, 8, 75, 209, 7, 52, 182, 127, 102, 112, 52, 107, 207, 69, 72, 142, 137, 146, 111, 4, 73, 191, 26, 165, 240, 24, 36, 81, 183, 126, 32, 207, 0, buffer: ArrayBuffer(33), byteLength: 33, byteOffset: 0, length: 33, Symbol(Symbol.toStringTag): 'Uint8Array']
webauthnOwner.ts:125 this.attestation {email: 'toto1', rpId: 'localhost', origin: 'http://localhost:5173', credentialId: Uint8Array(16), pubKey: Uint8Array(32)}credentialId: Uint8Array(16) [238, 111, 59, 225, 205, 138, 68, 20, 197, 109, 165, 118, 103, 68, 143, 50, buffer: ArrayBuffer(16), byteLength: 16, byteOffset: 0, length: 16, Symbol(Symbol.toStringTag): 'Uint8Array']email: "toto1"origin: "http://localhost:5173"pubKey: Uint8Array(32) [94, 9, 236, 13, 49, 201, 217, 202, 136, 137, 215, 48, 72, 158, 176, 43, 243, 22, 81, 86, 66, 246, 161, 84, 116, 55, 179, 207, 253, 216, 156, 238, buffer: ArrayBuffer(32), byteLength: 32, byteOffset: 0, length: 32, Symbol(Symbol.toStringTag): 'Uint8Array']rpId: "localhost"[[Prototype]]: Object
webauthnAttestation.ts:55 request signature-attestation= {email: 'toto1', rpId: 'localhost', origin: 'http://localhost:5173', credentialId: Uint8Array(16), pubKey: Uint8Array(32)}credentialId: Uint8Array(16) [238, 111, 59, 225, 205, 138, 68, 20, 197, 109, 165, 118, 103, 68, 143, 50, buffer: ArrayBuffer(16), byteLength: 16, byteOffset: 0, length: 16, Symbol(Symbol.toStringTag): 'Uint8Array']email: "toto1"origin: "http://localhost:5173"pubKey: Uint8Array(32) [94, 9, 236, 13, 49, 201, 217, 202, 136, 137, 215, 48, 72, 158, 176, 43, 243, 22, 81, 86, 66, 246, 161, 84, 116, 55, 179, 207, 253, 216, 156, 238, buffer: ArrayBuffer(32), byteLength: 32, byteOffset: 0, length: 32, Symbol(Symbol.toStringTag): 'Uint8Array']rpId: "localhost"[[Prototype]]: Object
webauthnAttestation.ts:56 request signature-challenge= Uint8Array(33) [3, 8, 75, 209, 7, 52, 182, 127, 102, 112, 52, 107, 207, 69, 72, 142, 137, 146, 111, 4, 73, 191, 26, 165, 240, 24, 36, 81, 183, 126, 32, 207, 0, buffer: ArrayBuffer(33), byteLength: 33, byteOffset: 0, length: 33, Symbol(Symbol.toStringTag): 'Uint8Array']

webauthnAttestation.ts:57 credential.get= {publicKey: {…}}
    publicKey: 
        allowCredentials: Array(1)
            0: 
                id: Uint8Array(16) [238, 111, 59, 225, 205, 138, 68, 20, 197, 109, 165, 118, 103, 68, 143, 50, buffer: ArrayBuffer(16), byteLength: 16, byteOffset: 0, length: 16, Symbol(Symbol.toStringTag): 'Uint8Array']
                transports: ['internal']
                type: "public-key"
                [[Prototype]]: Objectlength: 1[[Prototype]]: Array(0)
        challenge: Uint8Array(33) [3, 8, 75, 209, 7, 52, 182, 127, 102, 112, 52, 107, 207, 69, 72, 142, 137, 146, 111, 4, 73, 191, 26, 165, 240, 24, 36, 81, 183, 126, 32, 207, 0, buffer: ArrayBuffer(33), byteLength: 33, byteOffset: 0, length: 33, Symbol(Symbol.toStringTag): 'Uint8Array']
        rpId: "localhost"
        timeout: 60000
        userVerification: "required"
    [[Prototype]]: Object
[[Prototype]]: Object
        
webauthnOwner.ts:127 assertionResponse= AuthenticatorAssertionResponse {authenticatorData: ArrayBuffer(37)
    {
    "0": 73,
    "1": 150,
    "2": 13,
    "3": 229,
    "4": 136,
    "5": 14,
    "6": 140,
    "7": 104,
    "8": 116,
    "9": 52,
    "10": 23,
    "11": 15,
    "12": 100,
    "13": 118,
    "14": 96,
    "15": 91,
    "16": 143,
    "17": 228,
    "18": 174,
    "19": 185,
    "20": 162,
    "21": 134,
    "22": 50,
    "23": 199,
    "24": 153,
    "25": 92,
    "26": 243,
    "27": 186,
    "28": 131,
    "29": 29,
    "30": 151,
    "31": 99,
    "32": 29,
    "33": 0,
    "34": 0,
    "35": 0,
    "36": 0
}
, signature: ArrayBuffer(71)
    0: 48
    1: 69
    2: 2
    3: 32
    4: 54
    5: 140
    6: 47
    7: 119
    8: 112
    9: 212
    10: 40
    11: 208
    12: 39
    13: 47
    14: 3
    15: 33
    16: 184
    17: 135
    18: 73
    19: 149
    20: 175
    21: 71
    22: 40
    23: 209
    24: 187
    25: 49
    26: 176
    27: 156
    28: 38
    29: 65
    30: 105
    31: 143
    32: 23
    33: 159
    34: 181
    35: 231
    36: 2
    37: 33
    38: 0
    39: 179
    40: 57
    41: 65
    42: 57
    43: 122
    44: 200
    45: 11
    46: 252
    47: 200
    48: 30
    49: 215
    50: 205
    51: 106
    52: 174
    53: 237
    54: 150
    55: 243
    56: 33
    57: 153
    58: 126
    59: 3
    60: 66
    61: 34
    62: 131
    63: 42
    64: 209
    65: 199
    66: 29
    67: 61
    68: 9
    69: 118
    70: 161
, userHandle: ArrayBuffer(32)
{
    "0": 24,
    "1": 27,
    "2": 24,
    "3": 24,
    "4": 23,
    "5": 4,
    "6": 13,
    "7": 13,
    "8": 19,
    "9": 32,
    "10": 20,
    "11": 4,
    "12": 23,
    "13": 0,
    "14": 13,
    "15": 37,
    "16": 10,
    "17": 12,
    "18": 9,
    "19": 37,
    "20": 4,
    "21": 24,
    "22": 2,
    "23": 0,
    "24": 27,
    "25": 14,
    "26": 22,
    "27": 18,
    "28": 27,
    "29": 12,
    "30": 21,
    "31": 9
}
, clientDataJSON: ArrayBuffer(244)

}
webauthnOwner.ts:132 clientDataJson= {"type":"webauthn.get","challenge":"AwhL0Qc0tn9mcDRrz0VIjomSbwRJvxql8BgkUbd-IM8A","origin":"http://localhost:5173","crossOrigin":false,"other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}
webauthnOwner.ts:133 clientDataJson= Uint8Array(244) [123, 34, 116, 121, 112, 101, 34, 58, 34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 103, 101, 116, 34, 44, 34, 99, 104, 97, 108, 108, 101, 110, 103, 101, 34, 58, 34, 65, 119, 104, 76, 48, 81, 99, 48, 116, 110, 57, 109, 99, 68, 82, 114, 122, 48, 86, 73, 106, 111, 109, 83, 98, 119, 82, 74, 118, 120, 113, 108, 56, 66, 103, 107, 85, 98, 100, 45, 73, 77, 56, 65, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116, 116, 112, 58, 47, 47, 108, …]
webauthnOwner.ts:134 authenticatorData= Uint8Array(37) [73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131, 29, 151, 99, 29, 0, 0, 0, 0, buffer: ArrayBuffer(37), byteLength: 37, byteOffset: 0, length: 37, Symbol(Symbol.toStringTag): 'Uint8Array']
webauthnOwner.ts:135 flags= 29
webauthnOwner.ts:136 signCount= 0
webauthnOwner.ts:144 clientDataJsonOutro= Uint8Array(110) [44, 34, 111, 116, 104, 101, 114, 95, 107, 101, 121, 115, 95, 99, 97, 110, 95, 98, 101, 95, 97, 100, 100, 101, 100, 95, 104, 101, 114, 101, 34, 58, 34, 100, 111, 32, 110, 111, 116, 32, 99, 111, 109, 112, 97, 114, 101, 32, 99, 108, 105, 101, 110, 116, 68, 97, 116, 97, 74, 83, 79, 78, 32, 97, 103, 97, 105, 110, 115, 116, 32, 97, 32, 116, 101, 109, 112, 108, 97, 116, 101, 46, 32, 83, 101, 101, 32, 104, 116, 116, 112, 115, 58, 47, 47, 103, 111, 111, 46, 103, …]
webauthnOwner.ts:189 parseASN1Signature ECDSASigValue {r: Uint8Array(32), s: Uint8Array(33)}
webauthnOwner.ts:169 WebauthnOwner signed, signature is: {cross_origin: false, client_data_json_outro: Array(110), flags: 29, sign_count: 0, ec_signature: {…}, …}
webauthnOwner.ts:173 compiled signature= (147) ['4', '21', '104', '116', '116', '112', '58', '47', '47', '108', '111', '99', '97', '108', '104', '111', '115', '116', '58', '53', '49', '55', '51', '191266990927768818505269035571842226019', '97812770077760695459826172618884931675', '323118283216146363594228736594812640494', '124998949969550268041867244298005557291', '0', '110', '44', '34', '111', '116', '104', '101', '114', '95', '107', '101', '121', '115', '95', '99', '97', '110', '95', '98', '101', '95', '97', '100', '100', '101', '100', '95', '104', '101', '114', '101', '34', '58', '34', '100', '111', '32', '110', '111', '116', '32', '99', '111', '109', '112', '97', '114', '101', '32', '99', '108', '105', '101', '110', '116', '68', '97', '116', '97', '74', '83', '79', '78', '32', '97', '103', '97', '105', '110', '115', '116', '32', …]
webauthnOwner.ts:174 {halt: true}
