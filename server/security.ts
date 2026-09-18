import crypto from "crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function tokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_TOKEN_SECRET must be configured in production");
  }
  return "development-only-token-secret";
}

export function createSessionToken(user: { id: string; username: string; role?: string }) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, username: user.username, role: user.role || "user", exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS })).toString("base64url");
  const signature = crypto.createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): { sub: string; username: string; role: string } | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = crypto.createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.sub || !parsed.username || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: parsed.sub, username: parsed.username, role: parsed.role || "user" };
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const digest = crypto.scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${digest}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith("scrypt$")) return password === stored;
  const [, salt, digest] = stored.split("$");
  if (!salt || !digest) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "base64url");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
