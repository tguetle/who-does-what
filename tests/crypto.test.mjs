import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// js/crypto.js is a browser script, so it is evaluated here with a module object.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(root, "js", "crypto.js"), "utf8");
const { isEncryptedEnvelope, encryptData, decryptData, generatePassphrase } = new Function(
  "module",
  `${source}\nreturn module.exports;`,
)({ exports: {} });

const PASSPHRASE = "test-passphrase-1234";
const organization = {
  organization: { name: "Testverein", updated: "2026-10-09" },
  root: { title: "Mitgliederversammlung" },
  people: [{ id: "p1", name: "Erika Mustermann", email: "erika@example.org" }],
  board: [],
  sections: [],
};

test("Verschlüsselung ist umkehrbar", async () => {
  const envelope = await encryptData(organization, PASSPHRASE);
  assert.deepEqual(await decryptData(envelope, PASSPHRASE), organization);
});

test("falsche Passphrase liefert null", async () => {
  const envelope = await encryptData(organization, PASSPHRASE);
  assert.equal(await decryptData(envelope, "falsche-passphrase"), null);
});

test("manipulierter Ciphertext wird erkannt", async () => {
  const envelope = await encryptData(organization, PASSPHRASE);
  const bytes = Buffer.from(envelope.data, "base64");
  bytes[0] ^= 1;
  envelope.data = bytes.toString("base64");
  assert.equal(await decryptData(envelope, PASSPHRASE), null);
});

test("Envelope enthält keine Klartextdaten", async () => {
  const envelope = await encryptData(organization, PASSPHRASE);
  const text = JSON.stringify(envelope);
  assert.ok(!text.includes("Erika"));
  assert.ok(!text.includes("Testverein"));
  assert.equal(isEncryptedEnvelope(envelope), true);
});

test("isEncryptedEnvelope erkennt Klartextdaten nicht", () => {
  assert.equal(isEncryptedEnvelope(organization), false);
  assert.equal(isEncryptedEnvelope(null), false);
});

test("Zufalls-Passphrasen sind lang, gruppiert und verschieden", () => {
  const first = generatePassphrase();
  const second = generatePassphrase();
  assert.match(first, /^[a-hj-np-z2-9]{5}(-[a-hj-np-z2-9]{5}){3}$/);
  assert.notEqual(first, second);
});
