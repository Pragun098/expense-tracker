import { createServer } from "node:http";
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const scrypt = promisify(scryptCallback);
const port = Number(process.env.API_PORT || 3001);
const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "expense-tracker.json");
const sessions = new Map();
let writeQueue = Promise.resolve();

const defaults = () => ({ transactions: [], budgets: {}, theme: "dark", currency: "$" });
const publicUser = ({ id, name, email }) => ({ id, name, email });

async function readStore() {
  try {
    return JSON.parse(await readFile(dataFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { users: [], data: {} };
  }
}

async function updateStore(update) {
  const operation = writeQueue.then(async () => {
    const store = await readStore();
    const result = await update(store);
    const temporaryFile = `${dataFile}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(store, null, 2));
    await rename(temporaryFile, dataFile);
    return result;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 1_000_000) throw new HttpError(413, "Request body is too large.");
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

function sessionUser(request) {
  const cookie = request.headers.cookie || "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("session="))?.slice(8);
  const userId = token && sessions.get(token);
  if (!userId) throw new HttpError(401, "Please log in to continue.");
  return userId;
}

function setSession(response, userId) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, userId);
  response.setHeader("Set-Cookie", `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
}

function clearSession(request, response) {
  const cookie = request.headers.cookie || "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("session="))?.slice(8);
  if (token) sessions.delete(token);
  response.setHeader("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
}

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = await scrypt(password, salt, 64);
  return { salt, hash: hash.toString("hex") };
}

async function handle(request, response) {
  const url = new URL(request.url, "http://localhost");
  const method = request.method;

  if (url.pathname === "/api/auth/me" && method === "GET") {
    const cookie = request.headers.cookie || "";
    const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("session="))?.slice(8);
    const userId = token && sessions.get(token);
    if (!userId) return sendJson(response, 200, { user: null });
    const store = await readStore();
    const user = store.users.find((item) => item.id === userId);
    return sendJson(response, 200, { user: user ? publicUser(user) : null });
  }

  if (url.pathname === "/api/auth/signup" && method === "POST") {
    const { email: submittedEmail, password } = await readBody(request);
    const email = typeof submittedEmail === "string" ? submittedEmail.trim().toLowerCase() : "";
    if (!email.includes("@") || typeof password !== "string" || password.length < 4) {
      throw new HttpError(400, "Enter a valid email and a password of 4+ characters.");
    }
    const user = await updateStore(async (store) => {
      if (store.users.some((item) => item.email === email)) throw new HttpError(409, "That email is already registered. Log in instead.");
      const credentials = await hashPassword(password);
      const account = { id: randomUUID(), name: email.split("@")[0], email, ...credentials };
      store.users.push(account);
      store.data[account.id] = defaults();
      return publicUser(account);
    });
    setSession(response, user.id);
    return sendJson(response, 201, { user });
  }

  if (url.pathname === "/api/auth/login" && method === "POST") {
    const { email: submittedEmail, password } = await readBody(request);
    const email = typeof submittedEmail === "string" ? submittedEmail.trim().toLowerCase() : "";
    const store = await readStore();
    const user = store.users.find((item) => item.email === email);
    if (!user || typeof password !== "string") throw new HttpError(401, "Email or password is incorrect.");
    const candidate = await hashPassword(password, user.salt);
    if (!timingSafeEqual(Buffer.from(candidate.hash, "hex"), Buffer.from(user.hash, "hex"))) {
      throw new HttpError(401, "Email or password is incorrect.");
    }
    setSession(response, user.id);
    return sendJson(response, 200, { user: publicUser(user) });
  }

  if (url.pathname === "/api/auth/guest" && method === "POST") {
    const user = await updateStore((store) => {
      let guest = store.users.find((item) => item.email === "guest@demo.app");
      if (!guest) {
        guest = { id: randomUUID(), name: "Guest", email: "guest@demo.app" };
        store.users.push(guest);
        store.data[guest.id] = defaults();
      }
      return publicUser(guest);
    });
    setSession(response, user.id);
    return sendJson(response, 200, { user });
  }

  if (url.pathname === "/api/auth/logout" && method === "POST") {
    clearSession(request, response);
    return sendJson(response, 200, { ok: true });
  }

  const userId = sessionUser(request);
  if (url.pathname === "/api/data" && method === "GET") {
    const store = await readStore();
    return sendJson(response, 200, store.data[userId] || defaults());
  }

  if (url.pathname === "/api/data" && method === "PATCH") {
    const changes = await readBody(request);
    const allowed = new Set(["budgets", "theme", "currency"]);
    if (Object.keys(changes).some((key) => !allowed.has(key))) throw new HttpError(400, "Unsupported data field.");
    if ("budgets" in changes && (!changes.budgets || typeof changes.budgets !== "object" || Array.isArray(changes.budgets))) throw new HttpError(400, "Budgets must be an object.");
    if ("theme" in changes && !["dark", "light"].includes(changes.theme)) throw new HttpError(400, "Invalid theme.");
    if ("currency" in changes && !["$", "₹", "€", "£"].includes(changes.currency)) throw new HttpError(400, "Invalid currency.");
    const data = await updateStore((store) => {
      store.data[userId] = { ...defaults(), ...store.data[userId], ...changes };
      return store.data[userId];
    });
    return sendJson(response, 200, data);
  }

  if (url.pathname === "/api/transactions" && method === "GET") {
    const store = await readStore();
    return sendJson(response, 200, (store.data[userId] || defaults()).transactions);
  }

  if (url.pathname === "/api/transactions" && method === "POST") {
    const transaction = await readBody(request);
    if (!transaction || typeof transaction !== "object" || typeof transaction.amount !== "number" || !Number.isFinite(transaction.amount)) {
      throw new HttpError(400, "Transaction amount must be a valid number.");
    }
    const created = {
      ...transaction,
      id: randomUUID(),
      date: typeof transaction.date === "string" ? transaction.date : new Date().toLocaleDateString(),
    };
    await updateStore((store) => {
      const data = { ...defaults(), ...store.data[userId] };
      data.transactions = [created, ...data.transactions];
      store.data[userId] = data;
    });
    return sendJson(response, 201, created);
  }

  if (url.pathname === "/api/transactions" && method === "DELETE") {
    await updateStore((store) => {
      const data = { ...defaults(), ...store.data[userId] };
      data.transactions = [];
      store.data[userId] = data;
    });
    return sendJson(response, 200, { ok: true });
  }

  const transactionMatch = url.pathname.match(/^\/api\/transactions\/([^/]+)$/);
  if (transactionMatch && ["PUT", "DELETE"].includes(method)) {
    const transactionId = decodeURIComponent(transactionMatch[1]);
    const changes = method === "PUT" ? await readBody(request) : null;
    if (method === "PUT" && (!changes || typeof changes !== "object" || Array.isArray(changes))) {
      throw new HttpError(400, "Transaction changes must be an object.");
    }
    let updated;
    await updateStore((store) => {
      const data = { ...defaults(), ...store.data[userId] };
      const index = data.transactions.findIndex((item) => item.id === transactionId);
      if (index < 0) throw new HttpError(404, "Transaction not found.");
      if (method === "DELETE") data.transactions.splice(index, 1);
      else {
        data.transactions[index] = { ...data.transactions[index], ...changes, id: transactionId };
        updated = data.transactions[index];
      }
      store.data[userId] = data;
    });
    if (method === "DELETE") return sendJson(response, 200, { ok: true });
    return sendJson(response, 200, updated);
  }

  throw new HttpError(404, "API route not found.");
}

const server = createServer(async (request, response) => {
  try {
    if (!request.url.startsWith("/api/")) throw new HttpError(404, "Route not found.");
    await handle(request, response);
  } catch (error) {
    if (response.headersSent) return response.end();
    sendJson(response, error.status || 500, { error: error.status ? error.message : "Internal server error." });
  }
});

await mkdir(dataDirectory, { recursive: true });
server.listen(port, () => console.log(`Expense Tracker API listening on http://localhost:${port}`));
