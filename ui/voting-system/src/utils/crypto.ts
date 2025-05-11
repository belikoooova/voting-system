import { cryptoApi, votingApi } from '../config/api';
import { RSABSSA } from "@cloudflare/blindrsa-ts";
import { pemToSpki, uint8ArrayToBase64, base64ToUint8Array } from "./encodingUtils";

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----','')
    .replace('-----END PUBLIC KEY-----','')
    .replace(/\s/g,'');
  const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'spki',
    der.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

export async function encryptAnswer(answerId: string, publicKeyPem: string): Promise<string> {
  const key = await importRsaPublicKey(publicKeyPem);
  const pt = new TextEncoder().encode(answerId);
  const ct = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    pt
  );
  return btoa(String.fromCharCode(...new Uint8Array(ct)));
}

async function importRsaPssPublicKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----','')
    .replace('-----END PUBLIC KEY-----','')
    .replace(/\s/g,'');
  const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'spki',
    der.buffer,
    { name: 'RSA-PSS', hash: 'SHA-384' },
    true,
    ['verify']
  );
}

export async function blindSignMessage(message: string): Promise<string> {
  const { data:{ publicKey: pem } } = await cryptoApi.getPublicKey();
  const publicKey = await importRsaPssPublicKey(pem);

  const suite = RSABSSA.SHA384.PSS.Randomized();
  const msgBytes = new TextEncoder().encode(message);
  const prepared = suite.prepare(msgBytes);
  const { blindedMsg, inv } = await suite.blind(publicKey, prepared);

  const { data:{ blindSignature } } =
    await cryptoApi.sign({ blindedPublicKey: uint8ArrayToBase64(blindedMsg) });

  const sigBuf = base64ToUint8Array(blindSignature);
  const signature = await suite.finalize(publicKey, prepared, sigBuf, inv);

  const ok = await suite.verify(publicKey, signature, prepared);
  if (!ok) throw new Error('Blind‐signature verification failed');

  return uint8ArrayToBase64(signature);
}

export const getZKProof = async (votingId: string, userId: string): Promise<string> => {
  try {
    const response = await cryptoApi.getZeroKnowledgeProof(votingId);
    return response.data.zeroKnowledgeProof;
  } catch (error) {
    console.error('Ошибка при получении доказательства:', error);
    throw new Error('Не удалось получить доказательство');
  }
};

export const submitVote = async (
  votingId: string,
  userId: string,
  answerId: string,
  encryptedVote: string,
  zkProof: string,
  signature: string
): Promise<void> => {
  try {
    await votingApi.vote(votingId, {
      answerId,
      encryptedVote: encryptedVote,
      zeroKnowledgeProof: zkProof,
      signature: signature,
    });
  } catch (error) {
    console.error('Ошибка при отправке голоса:', error);
    throw new Error('Не удалось отправить голос');
  }
};

export const getPublicKey = async (): Promise<string> => {
  try {
    const response = await cryptoApi.getPublicKey();
    return response.data.publicKey;
  } catch (error) {
    console.error('Ошибка при получении публичного ключа:', error);
    throw new Error('Не удалось получить публичный ключ');
  }
};

export const encryptVote = (vote: string, publicKey: string): string => {
  try {
    // TODO: Реализовать шифрование ElGamal
    return vote;
  } catch (error) {
    console.error('Ошибка при шифровании голоса:', error);
    throw new Error('Не удалось зашифровать голос');
  }
};

export const getZeroKnowledgeProof = async (votingId: string): Promise<string> => {
  try {
    const response = await cryptoApi.getZeroKnowledgeProof(votingId);
    return response.data.zeroKnowledgeProof;
  } catch (error) {
    console.error('Ошибка при получении доказательства:', error);
    throw new Error('Не удалось получить доказательство');
  }
}; 