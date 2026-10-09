"use strict";

// Passphrase-encrypted organigram files. The format is described in README.md.
const ENCRYPTED_FORMAT = "who-does-what-encrypted";
const ENCRYPTED_VERSION = 1;
const PBKDF2_ITERATIONS = 600000;

function isEncryptedEnvelope(value) {
  return value?.format === ENCRYPTED_FORMAT;
}

function toBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(text) {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

async function deriveKey(passphrase, salt, iterations) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(value, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const plain = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);

  return {
    format: ENCRYPTED_FORMAT,
    version: ENCRYPTED_VERSION,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt: toBase64(salt)
    },
    cipher: { name: "AES-GCM", iv: toBase64(iv) },
    data: toBase64(new Uint8Array(cipher))
  };
}

// Returns null for a wrong passphrase or modified data.
async function decryptData(envelope, passphrase) {
  if (!isEncryptedEnvelope(envelope) || envelope.version !== ENCRYPTED_VERSION) {
    throw new Error("Nicht unterstütztes Dateiformat.");
  }

  const key = await deriveKey(
    passphrase,
    fromBase64(envelope.kdf.salt),
    envelope.kdf.iterations
  );

  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(envelope.cipher.iv) },
      key,
      fromBase64(envelope.data)
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}

// 20 symbols from 32 (256 % 32 = 0, so no bias) give about 100 bits.
function generatePassphrase() {
  const alphabet = "abcdefghjklmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const text = Array.from(bytes, (byte) => alphabet[byte % 32]).join("");
  return text.match(/.{5}/g).join("-");
}

if (typeof module !== "undefined") {
  module.exports = {
    isEncryptedEnvelope,
    encryptData,
    decryptData,
    generatePassphrase
  };
}
