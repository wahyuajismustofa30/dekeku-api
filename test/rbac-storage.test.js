import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  PRIVATE_STORAGE_PATHS,
  normalizeRegisteredOrigin,
  validatePrivateStoragePath,
  validateUsersDocument,
  validateRepositoryMappingsDocument
} from "../src/modules/rbac/storage.js";

const now = "2026-11-21T00:00:00.000Z";
const user = {
  id: "user_123456",
  username: "customer.one",
  passwordHash: `pbkdf2:100000:${"a".repeat(32)}:${"b".repeat(64)}`,
  role: "user",
  status: "active",
  createdAt: now,
  updatedAt: now
};
const users = { version: 1, users: [user] };
const mapping = (overrides = {}) => ({
  id: "repo_123456",
  userId: user.id,
  owner: "wahyuajismustofa30",
  repo: "demo",
  branch: "main",
  origin: "https://demo.dekeku.my.id",
  status: "active",
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("RBAC-01 private storage schema", () => {
  test("private storage paths are exact allowlist entries", () => {
    assert.equal(validatePrivateStoragePath(PRIVATE_STORAGE_PATHS.users), true);
    assert.equal(validatePrivateStoragePath(PRIVATE_STORAGE_PATHS.repositories), true);
    assert.equal(validatePrivateStoragePath("public/data/users.json"), false);
    assert.equal(validatePrivateStoragePath("private/auth/../../public/data/users.json"), false);
    assert.equal(validatePrivateStoragePath("private/system/secrets.json"), false);
  });

  test("valid user document is accepted", () => {
    assert.equal(validateUsersDocument(users), users);
  });

  test("duplicate usernames are rejected case-insensitively", () => {
    assert.throws(() => validateUsersDocument({
      version: 1,
      users: [user, { ...user, id: "user_654321", username: "CUSTOMER.ONE" }]
    }), /Duplicate username/);
  });

  test("plaintext or malformed password values are rejected", () => {
    assert.throws(() => validateUsersDocument({
      version: 1,
      users: [{ ...user, passwordHash: "plaintext-password" }]
    }), /Invalid password hash/);
  });

  test("non-user roles and unknown fields are rejected", () => {
    assert.throws(() => validateUsersDocument({
      version: 1,
      users: [{ ...user, role: "admin" }]
    }), /Invalid user role/);
    assert.throws(() => validateUsersDocument({
      version: 1,
      users: [{ ...user, isAdmin: true }]
    }), /Invalid user record/);
  });

  test("registered Origin must be a canonical HTTPS origin", () => {
    assert.equal(normalizeRegisteredOrigin("https://demo.dekeku.my.id"), "https://demo.dekeku.my.id");
    assert.equal(normalizeRegisteredOrigin("http://demo.dekeku.my.id"), null);
    assert.equal(normalizeRegisteredOrigin("https://demo.dekeku.my.id/path"), null);
    assert.equal(normalizeRegisteredOrigin("https://demo.dekeku.my.id:8443"), null);
    assert.equal(normalizeRegisteredOrigin("https://user@demo.dekeku.my.id"), null);
  });

  test("valid mapping references a known user", () => {
    const document = { version: 1, repositories: [mapping()] };
    assert.equal(validateRepositoryMappingsDocument(document, users), document);
  });

  test("unknown user references are rejected", () => {
    assert.throws(() => validateRepositoryMappingsDocument({
      version: 1,
      repositories: [mapping({ userId: "user_unknown" })]
    }, users), /unknown user/);
  });

  test("duplicate active repository and Origin are rejected", () => {
    assert.throws(() => validateRepositoryMappingsDocument({
      version: 1,
      repositories: [mapping(), mapping({ id: "repo_654321", repo: "DEMO" })]
    }, users), /already assigned/);
    assert.throws(() => validateRepositoryMappingsDocument({
      version: 1,
      repositories: [mapping(), mapping({ id: "repo_654321", owner: "another-owner", repo: "another-repo" })]
    }, users), /Origin is already assigned/);
  });

  test("disabled mappings do not reserve repository or Origin", () => {
    const document = {
      version: 1,
      repositories: [
        mapping({ status: "disabled" }),
        mapping({ id: "repo_654321", userId: "user_654321" })
      ]
    };
    assert.equal(validateRepositoryMappingsDocument(document), document);
  });

  test("unsafe branch names are rejected", () => {
    for (const branch of ["../main", "main..bad", "main//bad", "main/", "main\\bad", "main?x"]) {
      assert.throws(() => validateRepositoryMappingsDocument({
        version: 1,
        repositories: [mapping({ branch })]
      }), /Invalid repository branch/);
    }
  });
});
