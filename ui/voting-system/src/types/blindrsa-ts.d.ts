declare module '@cloudflare/blindrsa-ts' {
  export namespace RSABSSA {
    export namespace SHA384 {
      export namespace PSS {
        export function Randomized(): {
          prepare(message: Uint8Array): Uint8Array;
          blind(publicKey: CryptoKey, prepared: Uint8Array): Promise<{
            blindedMsg: Uint8Array;
            inv: Uint8Array;
          }>;
          finalize(
            publicKey: CryptoKey,
            prepared: Uint8Array,
            blindSignature: Uint8Array,
            inv: Uint8Array
          ): Promise<Uint8Array>;
          verify(
            publicKey: CryptoKey,
            signature: Uint8Array,
            prepared: Uint8Array
          ): Promise<boolean>;
        };
      }
    }
  }
} 