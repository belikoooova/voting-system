declare module 'pkijs' {
  export class PublicKeyInfo {
    constructor(params: { schema: any });
    publicKey: any;
  }

  export class RSAPublicKey {
    constructor(params: { schema: any });
    modulus: {
      valueBlock: {
        valueHex: Buffer;
      };
    };
    publicExponent: {
      valueBlock: {
        valueHex: Buffer;
      };
    };
  }
} 