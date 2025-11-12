import { createCipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export function md5Hex(input: string | Buffer): string {
  return createHash("md5").update(input).digest("hex");
}

export function genSalt(bytes: number = 16): string {
  return randomBytes(bytes).toString("hex");
}

export function md5Salt(password: string, salt: string, order: "pre" | "post" = "pre"): string {
  const data = order === "pre" ? salt + password : password + salt;
  return createHash("md5").update(data).digest("hex");
}

export function hmacMd5Hex(message: string | Buffer, key: string | Buffer | undefined): string {
  return createHmac("md5", key ? key : '').update(message).digest("hex");
}

export function createSaltedMd5(password: string) {
  const salt = genSalt(16);
  const hash = md5Salt(password, salt, "pre");
  return { salt, hash };
}

export function verifySaltedMd5(password: string, salt: string, expectedHex: string): boolean {
  const calc = md5Salt(password, salt, "pre");
  return timingSafeEqual(Buffer.from(calc, "hex"), Buffer.from(expectedHex, "hex"));
}

export function md5SaltBase64(password: string, salt: string, order: "pre" | "post" = "pre"): string {
  const data = order === "pre" ? salt + password : password + salt;
  return createHash("md5").update(data).digest("base64");
}

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = createHash("sha256").update(process.env.APP_SECRET_KEY!).digest();

export function encryptData(data: any) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, SECRET_KEY, iv);

  const json = JSON.stringify(data);
  let encrypted = cipher.update(json, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag().toString("base64");

  return { iv: iv.toString("base64"), data: encrypted, tag: authTag };
}

export async function decryptData(encrypted: {
  iv: string;
  data: string;
  tag: string;
}, keyString: string) {
  const enc = new TextEncoder();
  const keyData = enc.encode(keyString.padEnd(32, "0")); // สร้าง 256-bit key
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));
  const data = Uint8Array.from(atob(encrypted.data), (c) => c.charCodeAt(0));
  const tag = Uint8Array.from(atob(encrypted.tag), (c) => c.charCodeAt(0));

  const fullData = new Uint8Array([...data, ...tag]);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    fullData
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}
