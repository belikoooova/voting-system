import { cryptoApi, votingApi } from '../config/api';
import { RSABSSA } from "@cloudflare/blindrsa-ts";
import { pemToSpki, uint8ArrayToBase64, base64ToUint8Array } from "./encodingUtils";
import { sha256 } from 'js-sha256';
import { ec } from 'elliptic';
import { publicEncrypt } from 'crypto';

const curve = new ec('secp256k1');

export const parseRsaPemToHex = (pem: string): { n: string; e: string } => {
  try {
    const base64 = pem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return {
      n: '0x10001', 
      e: '0x10001', 
    };
  } catch (error) {
    console.error('Ошибка при парсинге RSA ключа:', error);
    throw new Error('Не удалось распарсить RSA ключ');
  }
};

export async function blindSignMessage(message: string): Promise<string> {
  try {
    console.log('Начало создания слепой подписи');
    
    const response = await cryptoApi.getPublicKey();
    const pem = response.data.publicKey;
    console.log('Получен публичный ключ:', pem);
    
    const spki = pemToSpki(pem);
    console.log('Ключ преобразован в SPKI формат');

    const publicKey = await crypto.subtle.importKey(
      "spki",
      spki,
      { name: "RSA-PSS", hash: "SHA-384" },
      true,
      ["verify"]
    );
    console.log('Ключ импортирован в WebCrypto');

    const suite = RSABSSA.SHA384.PSS.Randomized();
    console.log('Выбран вариант PSS-подписи');

    const encoder = new TextEncoder();
    const msgBytes = encoder.encode(message);
    const prepared = suite.prepare(msgBytes);
    console.log('Сообщение подготовлено');

    const { blindedMsg, inv } = await suite.blind(publicKey, prepared);
    console.log('Создана слепая подпись');

    const resp = await cryptoApi.sign({ blindedPublicKey: uint8ArrayToBase64(blindedMsg) });
    const blindSigBuf = base64ToUint8Array(resp.data.blindSignature);
    console.log('Получена подпись от сервера');

    const signature = await suite.finalize(publicKey, prepared, blindSigBuf, inv);
    console.log('Снята слепота с подписи');

    const ok = await suite.verify(publicKey, signature, prepared);
    if (!ok) throw new Error("Проверка слепой подписи не удалась");
    console.log('Подпись успешно проверена');

    return uint8ArrayToBase64(signature);
  } catch (error) {
    console.error('Ошибка при создании слепой подписи:', error);
    throw new Error('Не удалось создать слепую подпись');
  }
}

export const encryptAnswer = async (answerId: string, publicKeyPem: string): Promise<string> => {
  try {
    const pemContents = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const publicKey = await crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(answerId);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      data
    );
    
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encrypted))));
  } catch (error) {
    console.error('Ошибка при шифровании:', error);
    throw new Error('Ошибка шифрования');
  }
};

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