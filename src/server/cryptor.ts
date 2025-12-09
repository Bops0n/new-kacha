import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

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
