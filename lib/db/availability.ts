import net from "node:net";

const localDatabaseHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const cacheTtlMs = 60_000;

let cachedKey: string | null = null;
let cachedReachable: boolean | null = null;
let cachedAt = 0;
let pendingProbe: Promise<boolean> | null = null;

function isLocalDatabaseUrl(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl);

    if (!["postgresql:", "postgres:"].includes(parsed.protocol)) {
      return null;
    }

    const host = parsed.hostname.toLowerCase();
    const port = parsed.port ? Number(parsed.port) : 5432;

    if (!(localDatabaseHosts.has(host) && Number.isFinite(port))) {
      return null;
    }

    return { host, port };
  } catch {
    return null;
  }
}

function probePort(host: string, port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port });

    const finish = (reachable: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(reachable);
    };

    socket.setTimeout(350);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

export function canReachConfiguredDatabase() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return false;
  }

  const localDatabase = isLocalDatabaseUrl(databaseUrl);

  if (!localDatabase) {
    return true;
  }

  const cacheKey = `${localDatabase.host}:${localDatabase.port}`;
  const now = Date.now();

  if (
    cachedKey === cacheKey &&
    cachedReachable !== null &&
    now - cachedAt < cacheTtlMs
  ) {
    return cachedReachable;
  }

  if (cachedKey === cacheKey && pendingProbe) {
    return pendingProbe;
  }

  cachedKey = cacheKey;
  pendingProbe = probePort(localDatabase.host, localDatabase.port).then(
    (reachable) => {
      cachedReachable = reachable;
      cachedAt = Date.now();
      pendingProbe = null;
      return reachable;
    }
  );

  return pendingProbe;
}
