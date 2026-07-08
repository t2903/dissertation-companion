import jwt from "jsonwebtoken";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

const COOKIE = "crp_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionClaims = { sub: string; email: string; role: string | null };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET missing");
  return s;
}

export function issueSession(claims: SessionClaims) {
  const token = jwt.sign(claims, secret(), { expiresIn: MAX_AGE });
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie() {
  deleteCookie(COOKIE, { path: "/" });
}

export function readSession(): SessionClaims | null {
  const token = getCookie(COOKIE);
  if (!token) return null;
  try {
    return jwt.verify(token, secret()) as SessionClaims;
  } catch {
    return null;
  }
}

export function requireSession(): SessionClaims {
  const s = readSession();
  if (!s) throw new Error("Not authenticated");
  return s;
}

export function requireAdmin(): SessionClaims {
  const s = requireSession();
  if (s.role !== "admin") throw new Error("Admin access required");
  return s;
}
