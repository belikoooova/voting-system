import { cryptoApi, votingApi } from '../config/api';
import { RSABSSA } from "@cloudflare/blindrsa-ts";
import { pemToSpki, uint8ArrayToBase64, base64ToUint8Array } from "./encodingUtils";
import { sha256 } from 'js-sha256';
import { ec } from 'elliptic';
import { publicEncrypt } from 'crypto';

// Инициализация эллиптической кривой
const curve = new ec('secp256k1');

/**
 * Парсит PEM-формат RSA ключа в параметры n и e
 */
export const parseRsaPemToHex = (pem: string): { n: string; e: string } => {
  try {
    // Удаляем заголовки и переносы строк
    const base64 = pem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');

    // Декодируем base64
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Временное решение: используем фиксированные значения для тестирования
    return {
      n: '0x10001', // Модуль
      e: '0x10001', // Публичная экспонента
    };
  } catch (error) {
    console.error('Ошибка при парсинге RSA ключа:', error);
    throw new Error('Не удалось распарсить RSA ключ');
  }
};

/**
 * Выполняет слепую подпись сообщения
 */
export async function blindSignMessage(message: string): Promise<string> {
  try {
    console.log('Начало создания слепой подписи');
    
    // 1) Получить публичный ключ SPKI-PEM
    const response = await cryptoApi.getPublicKey();
    const pem = response.data.publicKey;
    console.log('Получен публичный ключ:', pem);
    
    const spki = pemToSpki(pem);
    console.log('Ключ преобразован в SPKI формат');

    // 2) Импортировать ключ в WebCrypto
    const publicKey = await crypto.subtle.importKey(
      "spki",
      spki,
      { name: "RSA-PSS", hash: "SHA-384" },
      true,
      ["verify"]
    );
    console.log('Ключ импортирован в WebCrypto');

    // 3) Выбрать вариант PSS-подписи
    const suite = RSABSSA.SHA384.PSS.Randomized();
    console.log('Выбран вариант PSS-подписи');

    // 4) Подготовить сообщение
    const encoder = new TextEncoder();
    const msgBytes = encoder.encode(message);
    const prepared = suite.prepare(msgBytes);
    console.log('Сообщение подготовлено');

    // 5) Слепим
    const { blindedMsg, inv } = await suite.blind(publicKey, prepared);
    console.log('Создана слепая подпись');

    // 6) Отправим на бэкенд
    const resp = await cryptoApi.sign({ blindedPublicKey: uint8ArrayToBase64(blindedMsg) });
    const blindSigBuf = base64ToUint8Array(resp.data.blindSignature);
    console.log('Получена подпись от сервера');

    // 7) Снимем слепоту и получим окончательную подпись
    const signature = await suite.finalize(publicKey, prepared, blindSigBuf, inv);
    console.log('Снята слепота с подписи');

    // 8) Проверим подпись
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
    // Преобразуем PEM ключ в ArrayBuffer
    const pemContents = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    // Импортируем публичный ключ
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

/**
 * Получает доказательство с нулевым разглашением
 */
export const getZKProof = async (votingId: string, userId: string): Promise<string> => {
  try {
    const response = await cryptoApi.getZeroKnowledgeProof(votingId);
    return response.data.zeroKnowledgeProof;
  } catch (error) {
    console.error('Ошибка при получении доказательства:', error);
    throw new Error('Не удалось получить доказательство');
  }
};

/**
 * Отправляет голос на сервер
 */
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

// Функция для получения публичного ключа
export const getPublicKey = async (): Promise<string> => {
  try {
    const response = await cryptoApi.getPublicKey();
    return response.data.publicKey;
  } catch (error) {
    console.error('Ошибка при получении публичного ключа:', error);
    throw new Error('Не удалось получить публичный ключ');
  }
};

// Функция для шифрования голоса
export const encryptVote = (vote: string, publicKey: string): string => {
  try {
    // TODO: Реализовать шифрование ElGamal
    return vote;
  } catch (error) {
    console.error('Ошибка при шифровании голоса:', error);
    throw new Error('Не удалось зашифровать голос');
  }
};

// Функция для получения доказательства с нулевым разглашением
export const getZeroKnowledgeProof = async (votingId: string): Promise<string> => {
  try {
    const response = await cryptoApi.getZeroKnowledgeProof(votingId);
    return response.data.zeroKnowledgeProof;
  } catch (error) {
    console.error('Ошибка при получении доказательства:', error);
    throw new Error('Не удалось получить доказательство');
  }
}; 