import { afterEach, describe, expect, it, vi } from "vitest";
import { X509Certificate } from "node:crypto";
import { connect, createServer, type ConnectionOptions } from "node:tls";
import { once } from "node:events";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ postgres: vi.fn(() => ({ end: vi.fn(async () => undefined) })) }));
vi.mock("postgres", () => ({ default: mocks.postgres }));
import { databaseTlsOptions, isSupabaseDatabaseHost, SUPABASE_DATABASE_CA } from "./database-tls";
import { runtimeSql, runtimeDatabaseSsl, RUNTIME_POOL_OPTIONS } from "./runtime-client";

const fixture = {"certificate": "-----BEGIN CERTIFICATE-----\nMIIDHjCCAgagAwIBAgIUAOSRUqHACb6AABgrHY3iGOVCAwgwDQYJKoZIhvcNAQEL\nBQAwKTEnMCUGA1UEAwweYXdzLTAtdGVzdC5wb29sZXIuc3VwYWJhc2UuY29tMB4X\nDTI2MTAyMzAwNTUwOVoXDTM2MTAyMTAwNTUwOVowKTEnMCUGA1UEAwweYXdzLTAt\ndGVzdC5wb29sZXIuc3VwYWJhc2UuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A\nMIIBCgKCAQEApfQElIiqoeP3yr3TzFqrQHEDk36+bFORf8d8Z62BUJzjfWZKdWXM\nPErlemY4ZLkgBnhyVb4ov1gMoi5R7iOExdim6L+/wiuZXXc9cMOqziaAfYF1twDk\nwL0dAHEIOKLjn01Gv6Rnv1uMEwO+qCdpvqyCWQnObP0/UzLF976fNO+oEVuba+M+\nkdBW9ic8ekrV/QXEYPO5vBsNd5wxepYjPLx9oOoR4xfOqnZKOX+o3uueCJpECUkD\nsqoTOlRCLNEH9CmbvGNsqBvYigNBK0h0aY6QcE+sK5LgG+bammMlANgCmfIK+SR1\nALEgDlGpaVwbIY+iDHWfrPTq9oNn8oQt7wIDAQABoz4wPDAPBgNVHRMBAf8EBTAD\nAQH/MCkGA1UdEQQiMCCCHmF3cy0wLXRlc3QucG9vbGVyLnN1cGFiYXNlLmNvbTAN\nBgkqhkiG9w0BAQsFAAOCAQEAoEbHugVJDbUlYr4iwMgwzaFmXVMQIbGNYLMxy0yE\n9i4NYL2NJEhL5gCcyjmHpXSfRsjfCs3JK3wSJ7fXSMNctVdpq6MqiL2Qa4IjMYtb\nXTtbH2wqIErMw353FqCf6hQQmogCCn/32xP92HfqRAqIqQfBrnJT6z//ROIEeN7j\nOlRUJNK9eEGFuZFr8ecCxQmwS4bEGbgf+MtTmFtzJGwTmHE4IPJ1JKbeey5mPhsE\n2+dfRDkakYXj1vYC9JmPIEZVTKEsUfOLZEnM0OaGuD9sm73Pe/hMW5GRlqrRTBxG\noHJDOtw1DacFK+2fGWZ/XaqFk8xupXuEInSdtNaB8mgWDg==\n-----END CERTIFICATE-----\n", "privateKey": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCl9ASUiKqh4/fK\nvdPMWqtAcQOTfr5sU5F/x3xnrYFQnON9Zkp1Zcw8SuV6ZjhkuSAGeHJVvii/WAyi\nLlHuI4TF2Kbov7/CK5lddz1ww6rOJoB9gXW3AOTAvR0AcQg4ouOfTUa/pGe/W4wT\nA76oJ2m+rIJZCc5s/T9TMsX3vp8076gRW5tr4z6R0Fb2Jzx6StX9BcRg87m8Gw13\nnDF6liM8vH2g6hHjF86qdko5f6je654ImkQJSQOyqhM6VEIs0Qf0KZu8Y2yoG9iK\nA0ErSHRpjpBwT6wrkuAb5tqaYyUA2AKZ8gr5JHUAsSAOUalpXBshj6IMdZ+s9Or2\ng2fyhC3vAgMBAAECgf8Q2recXkT2LDD+ZkkceBjsco3qbPTqC5K7Z4c7AGQhy81O\n7xSg17XmabTkuX0AvcyC27jA/I8m38porkuj4/eYIGjTOqY/Ei6BT5rt2PF//mkO\nVheefni9GnfXk6NCHUkA5NhKnmfrB2EyjS7P5TDYLK0QXe6ZIx9LU9zHTJTey04+\nm1KxA/ItxWB8yd3Jqw2jD7ygLGEvIQ0qtko6HQjRVUeV13dkT08MgjG+EHvJkRf1\navq+Rgtd9IUu1lNlynGHL3A0nk81rJdPwLsxkkdy85CSSZ2d5e5/5X/Uzeyy5l/a\ngo0jA4UilKBYUPF1bPPDPKO8Xs9ba/76RG4/7sECgYEA4SPHaW9A0jOf7z3zIP6J\nDWQxeOMc7DotGEspPpu3a2xX1wL2pceR1YWvGCrvPXKyLNCHoUtxi8g/M7mZ/E9E\nOdF9k9TB2O0VE0nWU//fl0krF30qHP2rYZylctE+OHLWnjaIRgzQ+yARZi1pngk/\nwvDSOGaab50RDQhLKrDv438CgYEAvLNdYEgSTOrSUXt/ZJQIRZezE365Nkuwj8xQ\n6Z/STC88Ts38wmx/EyaTkgwEWTCm7Aum7+yUota6wJq/HCsr6IjJ5oScgbswHgG2\nWgELmACUkVcQBkZiGB58fiide0rPcKl5eaHW2t+iEzoWcA211lZDTGDV0EivKMQ+\nEMfZLZECgYEAiEkYVYK7QoNttW1S2A48+JZGPF9/CqDM23/kH7ozdhvHsKhilkgQ\nx6h9LawP1qqvoOE6uTDqMyus1qrrxAhXzIg79Fk+XwplT5/K1l52AyaPp1BlRddo\n/1XL8Y0olRMvR+bK51yqxNnMroWfAcOnjWIqX2n84sO5pqH2noktLhECgYBVqjfh\n1dY5BQGl7CLRTkLTFSM+3nDGrWXiYib5aIzX+TmvrOPqf8bQstqbmsj+lI+y6TdI\nBGcV5dWySo4oA5FTZ4YBGILUgl49wRk/kunof5rywEuODbXKrUxnGZkkt7mks8tp\n5Ibdpli10dEN3auHOnIi4nMus1CReUWT6KY3gQKBgQDHM9jvDD0qqHBeLAaswyK7\nsasrOZiEi03DHN90BtHslWhEXwDbRalXZNsa5U/5CmnSo66kY2CqAL4Vhb9NNkdw\nRQJuan7Cox2gWblC+/FIP+aU+EEXhs3hKgECYwwljBX5/CpGpVBxALCDxAGGO5cr\nRIfKkhTslDVqpcb3K7/8/A==\n-----END PRIVATE KEY-----\n"};
const endpoint = "postgres://test-only:unused@aws-0-test.pooler.supabase.com:6543/test?sslmode=disable";
afterEach(() => { vi.clearAllMocks(); });

async function tlsHandshake(options: ConnectionOptions): Promise<Error | undefined> {
  const server = createServer({ key: fixture.privateKey, cert: fixture.certificate });
  server.on("tlsClientError", () => undefined);
  server.listen({ host: "127.0.0.1", port: 0 });
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server unavailable");
  try {
    return await new Promise(resolve => {
      const socket = connect({ host: "127.0.0.1", port: address.port, ...options });
      socket.once("secureConnect", () => { socket.destroy(); resolve(undefined); });
      socket.once("error", error => { socket.destroy(); resolve(error); });
    });
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}

describe("verified Supabase database TLS", () => {
  it("selects only provider database hosts and rejects lookalike suffixes", () => {
    for (const host of ["db.project-ref.supabase.co", "aws-0-us-east-1.pooler.supabase.com", "AWS-1-EU-WEST-1.POOLER.SUPABASE.COM."]) expect(isSupabaseDatabaseHost(host)).toBe(true);
    for (const host of ["supabase.com", "api.supabase.co", "db.project.supabase.co.attacker.test", "evilpooler.supabase.com", "pooler.supabase.com", "127.0.0.1"]) expect(isSupabaseDatabaseHost(host)).toBe(false);
  });
  it("requires the embedded CA, chain verification and default hostname verification for hosted endpoints", () => {
    const options = databaseTlsOptions(endpoint, false) as ConnectionOptions;
    expect(options).toMatchObject({ ca: SUPABASE_DATABASE_CA, rejectUnauthorized: true, servername: "aws-0-test.pooler.supabase.com" });
    expect(typeof options.checkServerIdentity).toBe("function");
    expect(new X509Certificate(SUPABASE_DATABASE_CA).fingerprint256.replaceAll(":", "").toLowerCase()).toBe("807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa");
  });
  it("preserves local and non-Supabase SSL mode choices", () => {
    expect(databaseTlsOptions("postgres://test@localhost/test", false)).toBe(false);
    expect(databaseTlsOptions("postgres://test@127.0.0.1/test", false)).toBe(false);
    expect(databaseTlsOptions("postgres://test@other.example/test", "require")).toBe("require");
    expect(databaseTlsOptions("postgres://test@other.example/test", "verify-full")).toBe("verify-full");
    expect(databaseTlsOptions("postgres://test@other.example/test", false)).toBe(false);
  });
  it("passes strict options at the shared runtime factory without changing pool or preparation settings", () => {
    runtimeSql({ databaseUrl: endpoint, ssl: runtimeDatabaseSsl(endpoint, "disable") });
    expect(mocks.postgres).toHaveBeenCalledWith(endpoint, expect.objectContaining({ ...RUNTIME_POOL_OPTIONS, prepare: false, ssl: expect.objectContaining({ rejectUnauthorized: true, ca: SUPABASE_DATABASE_CA, servername: "aws-0-test.pooler.supabase.com" }) }));
  });
  it("rejects a server certificate not signed by the configured Supabase CA", async () => {
    const error = await tlsHandshake(databaseTlsOptions(endpoint, "require") as ConnectionOptions);
    expect(error).toBeInstanceOf(Error);
    expect((error as NodeJS.ErrnoException).code).toMatch(/SELF_SIGNED|VERIFY|CERT/);
  });
  it("accepts the isolated fixture only with its CA and matching hostname, and rejects a different hostname", async () => {
    const options = databaseTlsOptions(endpoint, "require") as ConnectionOptions;
    expect(await tlsHandshake({ ...options, ca: fixture.certificate })).toBeUndefined();
    const error = await tlsHandshake({ ...options, ca: fixture.certificate, servername: "db.different-project.supabase.co" });
    expect(error).toBeInstanceOf(Error);
    expect((error as NodeJS.ErrnoException).code).toBe("ERR_TLS_CERT_ALTNAME_INVALID");
  });
});
