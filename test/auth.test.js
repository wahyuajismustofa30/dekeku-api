import { test, describe } from "node:test";
import assert from "node:assert";
import { signJwt, verifyJwt } from "../src/utils/jwt.js";
import { hashPassword, verifyPassword } from "../src/utils/hash.js";
import worker from "../src/index.js";

const JWT_SECRET = "test-secret-key-1234567890";
const ADMIN_PASSWORD = "secure-password";
let ADMIN_HASH;

describe("Auth Module - B-002 Implementation & Regression", async () => {

  // Setup Hash
  ADMIN_HASH = await hashPassword(ADMIN_PASSWORD);
  const env = {
    JWT_SECRET: JWT_SECRET,
    ADMIN_PASSWORD_HASH: ADMIN_HASH,
    GITHUB_TOKEN: "mock-token",
    GITHUB_OWNER: "mock-owner",
    GITHUB_REPO: "mock-repo"
  };

  describe("PBKDF2 Regression Tests", () => {
    test("Password yang benar berhasil diverifikasi", async () => {
      const isValid = await verifyPassword(ADMIN_PASSWORD, ADMIN_HASH);
      assert.strictEqual(isValid, true);
    });

    test("Password yang salah ditolak", async () => {
      const isValid = await verifyPassword("wrong-password", ADMIN_HASH);
      assert.strictEqual(isValid, false);
    });

    test("Format hash valid (pbkdf2:100000:salt:hash) diterima", async () => {
      const isValid = await verifyPassword(ADMIN_PASSWORD, ADMIN_HASH);
      assert.strictEqual(isValid, true);
    });

    test("Format hash yang rusak ditolak", async () => {
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, "invalid-format"), false);
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, "pbkdf2:100000:salthex"), false);
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, "pbkdf2:100000:salthex:hashhex:extra"), false);
    });

    test("Salt harus tepat 16 byte (32 hex characters)", async () => {
      const parts = ADMIN_HASH.split(':');
      const shortSalt = `pbkdf2:${parts[1]}:${parts[2].slice(0, 30)}:${parts[3]}`;
      const longSalt = `pbkdf2:${parts[1]}:${parts[2]}ff:${parts[3]}`;
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, shortSalt), false);
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, longSalt), false);
    });

    test("Hash harus tepat 32 byte (64 hex characters)", async () => {
      const parts = ADMIN_HASH.split(':');
      const shortHash = `pbkdf2:${parts[1]}:${parts[2]}:${parts[3].slice(0, 62)}`;
      const longHash = `pbkdf2:${parts[1]}:${parts[2]}:${parts[3]}ff`;
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, shortHash), false);
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, longHash), false);
    });

    test("Karakter non-hexadecimal pada salt/hash ditolak", async () => {
      const parts = ADMIN_HASH.split(':');
      const badSalt = `pbkdf2:${parts[1]}:${parts[2].replace(/[0-9a-f]/, 'g')}:${parts[3]}`;
      // Note: regex match might fail or parseInt might return NaN
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, badSalt), false);
    });

    test("Iterasi harus integer dan dalam rentang aman (10k - 1M)", async () => {
      const parts = ADMIN_HASH.split(':');
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, `pbkdf2:9999:${parts[2]}:${parts[3]}`), false);
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, `pbkdf2:1000001:${parts[2]}:${parts[3]}`), false);
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, `pbkdf2:NaN:${parts[2]}:${parts[3]}`), false);
      assert.strictEqual(await verifyPassword(ADMIN_PASSWORD, `pbkdf2:100.5:${parts[2]}:${parts[3]}`), false);
    });

    test("Input malformed tidak menyebabkan crash", async () => {
      await verifyPassword(null, undefined);
      await verifyPassword("", "");
      await verifyPassword({}, []);
    });

    test("PBKDF2 uniqueness: same password, different salts", async () => {
      const hash1 = await hashPassword(ADMIN_PASSWORD);
      const hash2 = await hashPassword(ADMIN_PASSWORD);
      assert.notStrictEqual(hash1, hash2);
    });
  });

  describe("JWT Regression Tests", () => {
    const now = () => Math.floor(Date.now() / 1000);

    test("JWT valid diterima", async () => {
      const t = now();
      const payload = { iss: "dekeku-api", aud: "dekeku-admin", sub: "admin", role: "admin", iat: t, exp: t + 1800 };
      const token = await signJwt(payload, JWT_SECRET);
      const result = await verifyJwt(token, JWT_SECRET, { iss: "dekeku-api", aud: "dekeku-admin", role: "admin" });
      assert.strictEqual(result.valid, true);
    });

    test("JWT tanpa iat ditolak", async () => {
      const t = now();
      const token = await signJwt({ exp: t + 1800, sub: "admin" }, JWT_SECRET);
      const result = await verifyJwt(token, JWT_SECRET);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "Missing or invalid iat");
    });

    test("JWT tanpa exp ditolak", async () => {
      const t = now();
      const token = await signJwt({ iat: t, sub: "admin" }, JWT_SECRET);
      const result = await verifyJwt(token, JWT_SECRET);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "Missing or invalid exp");
    });

    test("iat bukan angka finite ditolak", async () => {
      const t = now();
      const token = await signJwt({ iat: "now", exp: t + 1800, sub: "admin" }, JWT_SECRET);
      const result = await verifyJwt(token, JWT_SECRET);
      assert.strictEqual(result.valid, false);
    });

    test("exp bukan angka finite ditolak", async () => {
      const t = now();
      const token = await signJwt({ iat: t, exp: Infinity, sub: "admin" }, JWT_SECRET);
      const result = await verifyJwt(token, JWT_SECRET);
      assert.strictEqual(result.valid, false);
    });

    test("exp <= iat ditolak", async () => {
      const t = now();
      const token1 = await signJwt({ iat: t, exp: t, sub: "admin" }, JWT_SECRET);
      const token2 = await signJwt({ iat: t, exp: t - 10, sub: "admin" }, JWT_SECRET);
      assert.strictEqual((await verifyJwt(token1, JWT_SECRET)).valid, false);
      assert.strictEqual((await verifyJwt(token2, JWT_SECRET)).valid, false);
    });

    test("Masa berlaku > 1800 detik ditolak", async () => {
      const t = now();
      const token = await signJwt({ iat: t, exp: t + 1801, sub: "admin" }, JWT_SECRET);
      const result = await verifyJwt(token, JWT_SECRET);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "Token duration exceeds 30 minutes");
    });

    test("iat > 30 detik di masa depan ditolak", async () => {
      const t = now();
      const token = await signJwt({ iat: t + 35, exp: t + 1800, sub: "admin" }, JWT_SECRET);
      const result = await verifyJwt(token, JWT_SECRET);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "Token issued in the future");
    });

    test("Toleransi clock skew (30s) bekerja", async () => {
      const t = now();
      const tokenFuture = await signJwt({ iat: t + 25, exp: t + 1800, sub: "admin" }, JWT_SECRET);
      const tokenExpired = await signJwt({ iat: t - 1800, exp: t - 5, sub: "admin" }, JWT_SECRET);

      assert.strictEqual((await verifyJwt(tokenFuture, JWT_SECRET)).valid, true);
      assert.strictEqual((await verifyJwt(tokenExpired, JWT_SECRET)).valid, true);
    });

    test("Token kedaluwarsa (> 30s) ditolak", async () => {
      const t = now();
      const token = await signJwt({ iat: t - 2000, exp: t - 35, sub: "admin" }, JWT_SECRET);
      const result = await verifyJwt(token, JWT_SECRET);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "Token expired");
    });

    test("Signature tidak valid ditolak", async () => {
      const t = now();
      const token = await signJwt({ iat: t, exp: t + 1800, sub: "admin" }, JWT_SECRET);
      const tampered = token.slice(0, -5) + "abcde";
      const result = await verifyJwt(tampered, JWT_SECRET);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "Invalid signature");
    });

    test("Klaim iss, aud, sub, role tidak valid ditolak", async () => {
      const t = now();
      const payload = { iss: "wrong-iss", aud: "wrong-aud", sub: "admin", role: "user", iat: t, exp: t + 1800 };
      const token = await signJwt(payload, JWT_SECRET);

      const resIss = await verifyJwt(token, JWT_SECRET, { iss: "dekeku-api" });
      const resAud = await verifyJwt(token, JWT_SECRET, { aud: "dekeku-admin" });
      const resRole = await verifyJwt(token, JWT_SECRET, { role: "admin" });

      assert.strictEqual(resIss.valid, false);
      assert.strictEqual(resAud.valid, false);
      assert.strictEqual(resRole.valid, false);
    });
  });

  describe("Login & Integration Regression", () => {
    test("Success login with correct credentials", async () => {
      const req = new Request("http://api/api/v1/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: "admin", password: ADMIN_PASSWORD }),
        headers: { "Content-Type": "application/json" }
      });
      const res = await worker.fetch(req, env);
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.access_token);
      assert.strictEqual(data.token_type, "Bearer");
    });

    test("Reject wrong password", async () => {
      const req = new Request("http://api/api/v1/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: "admin", password: "wrong-password" }),
        headers: { "Content-Type": "application/json" }
      });
      const res = await worker.fetch(req, env);
      assert.strictEqual(res.status, 401);
    });

    test("End-to-End: Login and access protected endpoint", async () => {
      const loginReq = new Request("http://api/api/v1/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: "admin", password: ADMIN_PASSWORD }),
        headers: { "Content-Type": "application/json" }
      });
      const loginRes = await worker.fetch(loginReq, env);
      const { access_token } = await loginRes.json();

      const testReq = new Request("http://api/api/v1/admin/test", {
        method: "POST",
        headers: { "Authorization": `Bearer ${access_token}` }
      });
      const testRes = await worker.fetch(testReq, env);
      const testData = await testRes.json();

      assert.strictEqual(testRes.status, 200);
      assert.strictEqual(testData.success, true);
    });

    test("Regression: GET /api/v1/health is still public", async () => {
      const res = await worker.fetch(new Request("http://api/api/v1/health"), env);
      assert.strictEqual(res.status, 200);
    });
  });
});
