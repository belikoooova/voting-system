declare module 'blind-signatures' {
  import { BN } from 'bn.js';

  interface BlindSignatureResult {
    blinded: BN;
    r: BN;
  }

  interface BlindSignatureOptions {
    message: BN;
    N: BN;
    E: BN;
  }

  interface UnblindOptions {
    signed: BN;
    N: BN;
    r: BN;
  }

  export const blind: {
    blind: (options: BlindSignatureOptions) => BlindSignatureResult;
    unblind: (options: UnblindOptions) => BN;
  };
} 