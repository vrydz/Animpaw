import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from "./security";

process.env.AUTH_TOKEN_SECRET = "test-secret";

test("session tokens are signed and reject tampering", () => {
  const token = createSessionToken({ id: "user_1", username: "trainer" });
  assert.deepEqual(verifySessionToken(token), { sub: "user_1", username: "trainer", role: "user" });
  assert.equal(verifySessionToken(`${token}x`), null);
  assert.equal(verifySessionToken(Buffer.from("user_1:trainer").toString("base64")), null);
});

test("password hashes verify only the original password", () => {
  const hash = hashPassword("correct horse battery staple");
  assert.match(hash, /^scrypt\$/);
  assert.equal(verifyPassword("correct horse battery staple", hash), true);
  assert.equal(verifyPassword("incorrect", hash), false);
});
