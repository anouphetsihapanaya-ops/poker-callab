import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { dataDir } from "./paths.js";
import { HttpError } from "./store.js";

const pinFile = path.join(dataDir, "dealer-pin.json");
const tokens = new Set<string>();

type StoredPin = { salt: string; hash: string };

function hashPin(pin: string, salt: string) {
  return scryptSync(pin, salt, 32).toString("hex");
}

function readPin(): StoredPin {
  try {
    const parsed = JSON.parse(fs.readFileSync(pinFile, "utf8")) as StoredPin;
    if (parsed.salt && parsed.hash) return parsed;
  } catch {
    // Create the dealer PIN the first time the server starts.
  }
  const salt = randomBytes(16).toString("hex");
  const stored = { salt, hash: hashPin(process.env.DEALER_PIN || "245678", salt) };
  fs.mkdirSync(path.dirname(pinFile), { recursive: true });
  fs.writeFileSync(pinFile, JSON.stringify(stored, null, 2));
  return stored;
}

function pinMatches(pin: string) {
  const stored = readPin();
  const actual = Buffer.from(hashPin(pin, stored.salt), "hex");
  const expected = Buffer.from(stored.hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function tokenFrom(req: Request) {
  const header = req.header("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
}

export function login(pin: unknown) {
  if (typeof pin !== "string" || !pinMatches(pin)) throw new HttpError(401, "ລະຫັດດີເລີບໍ່ຖືກ");
  const token = randomBytes(24).toString("hex");
  tokens.add(token);
  return token;
}

export function logout(token: string) {
  tokens.delete(token);
}

export function changePin(currentPin: unknown, nextPin: unknown) {
  if (typeof currentPin !== "string" || !pinMatches(currentPin)) throw new HttpError(400, "ລະຫັດເກົ່າບໍ່ຖືກ");
  if (typeof nextPin !== "string" || !/^\d{4,8}$/.test(nextPin)) {
    throw new HttpError(400, "ລະຫັດໃໝ່ຕ້ອງເປັນຕົວເລກ 4 ຫາ 8 ໂຕ");
  }
  const salt = randomBytes(16).toString("hex");
  fs.writeFileSync(pinFile, JSON.stringify({ salt, hash: hashPin(nextPin, salt) }, null, 2));
}

export function requireDealer(req: Request, res: Response, next: NextFunction) {
  const token = tokenFrom(req);
  if (!token || !tokens.has(token)) {
    res.status(401).json({ error: "ຕ້ອງເຂົ້າລະບົບດີເລີ" });
    return;
  }
  next();
}
