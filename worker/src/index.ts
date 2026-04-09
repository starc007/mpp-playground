import { Hono } from "hono";
import { cors } from "hono/cors";
import { Mppx, tempo } from "mppx/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  DB: D1Database;
  MPP_SECRET_KEY: string;
  RECIPIENT_ADDRESS: string;
  RPC_URL: string;
}

interface ScheduledTx {
  id: string;
  owner: string;
  tx_bytes: string;
  valid_after: number;
  valid_before: number | null;
  status: string;
  tx_hash: string | null;
  error: string | null;
  created_at: number;
  memo: string | null;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*",
    exposeHeaders: ["WWW-Authenticate", "Payment-Receipt"],
  }),
);

// Health check
app.get("/", (c) =>
  c.json({
    service: "mpp-tx-scheduler",
    status: "ok",
    docs: "POST /schedule to submit a signed Tempo tx for timed broadcast",
  }),
);

// ---------------------------------------------------------------------------
// POST /schedule — MPP-gated ($0.10 per schedule)
// ---------------------------------------------------------------------------

app.post("/schedule", async (c) => {
  const mppx = Mppx.create({
    secretKey: c.env.MPP_SECRET_KEY,
    methods: [
      tempo.charge({
        currency: "0x20c0000000000000000000000000000000000000",
        recipient: c.env.RECIPIENT_ADDRESS as `0x${string}`,
        testnet: true,
        html: true,
      }),
    ],
  });

  const result = await mppx.charge({
    amount: "0.10",
    description: "Schedule a transaction for timed broadcast",
  })(c.req.raw);

  // If not paid yet, return the 402 challenge (or HTML payment page).
  if (result.status === 402) return result.challenge;

  // Paid — parse the schedule request.
  const body = await c.req.json<{
    txBytes: string;
    validAfter: number;
    validBefore?: number;
    owner: string;
    memo?: string;
  }>();

  if (!body.txBytes || !body.validAfter || !body.owner) {
    return c.json(
      { error: "txBytes, validAfter, and owner are required" },
      400,
    );
  }

  if (!body.txBytes.startsWith("0x")) {
    return c.json({ error: "txBytes must be hex-encoded (0x prefix)" }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  if (body.validAfter <= now) {
    return c.json(
      { error: "validAfter must be in the future" },
      400,
    );
  }

  if (body.validBefore && body.validBefore <= body.validAfter) {
    return c.json(
      { error: "validBefore must be after validAfter" },
      400,
    );
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO scheduled_txs (id, owner, tx_bytes, valid_after, valid_before, status, created_at, memo)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
  )
    .bind(
      id,
      body.owner.toLowerCase(),
      body.txBytes,
      body.validAfter,
      body.validBefore ?? null,
      now,
      body.memo ?? null,
    )
    .run();

  return result.withReceipt(
    c.json({
      id,
      status: "pending",
      validAfter: body.validAfter,
      validBefore: body.validBefore ?? null,
      estimatedBroadcast: new Date(body.validAfter * 1000).toISOString(),
    }),
  );
});

// ---------------------------------------------------------------------------
// GET /schedule/:id — check status (free)
// ---------------------------------------------------------------------------

app.get("/schedule/:id", async (c) => {
  const { id } = c.req.param();
  const row = await c.env.DB.prepare(
    "SELECT * FROM scheduled_txs WHERE id = ?",
  )
    .bind(id)
    .first<ScheduledTx>();

  if (!row) return c.json({ error: "Not found" }, 404);

  return c.json({
    id: row.id,
    owner: row.owner,
    status: row.status,
    validAfter: row.valid_after,
    validBefore: row.valid_before,
    txHash: row.tx_hash,
    error: row.error,
    createdAt: row.created_at,
    memo: row.memo,
  });
});

// ---------------------------------------------------------------------------
// GET /schedule?owner=0x — list all txs for an address (free)
// ---------------------------------------------------------------------------

app.get("/schedule", async (c) => {
  const owner = c.req.query("owner");
  if (!owner) return c.json({ error: "owner query param required" }, 400);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM scheduled_txs WHERE owner = ? ORDER BY created_at DESC LIMIT 50",
  )
    .bind(owner.toLowerCase())
    .all<ScheduledTx>();

  return c.json(
    (results ?? []).map((row) => ({
      id: row.id,
      status: row.status,
      validAfter: row.valid_after,
      validBefore: row.valid_before,
      txHash: row.tx_hash,
      error: row.error,
      createdAt: row.created_at,
      memo: row.memo,
    })),
  );
});

// ---------------------------------------------------------------------------
// DELETE /schedule/:id — cancel or delete a tx (owner only)
// ?action=delete  → hard delete (removes record)
// default         → soft cancel (sets status to 'cancelled', pending only)
// ---------------------------------------------------------------------------

app.delete("/schedule/:id", async (c) => {
  const { id } = c.req.param();
  const action = c.req.query("action");
  const ownerHeader = c.req.header("x-owner");
  if (!ownerHeader) {
    return c.json({ error: "x-owner header required" }, 401);
  }

  const row = await c.env.DB.prepare(
    "SELECT * FROM scheduled_txs WHERE id = ?",
  )
    .bind(id)
    .first<ScheduledTx>();

  if (!row) return c.json({ error: "Not found" }, 404);
  if (row.owner !== ownerHeader.toLowerCase()) {
    return c.json({ error: "Not authorized" }, 403);
  }

  // Hard delete — remove the record entirely
  if (action === "delete") {
    await c.env.DB.prepare("DELETE FROM scheduled_txs WHERE id = ?")
      .bind(id)
      .run();
    return c.json({ id, status: "deleted" });
  }

  // Soft cancel — only for pending txs
  if (row.status !== "pending") {
    return c.json({ error: `Cannot cancel: status is ${row.status}` }, 400);
  }

  await c.env.DB.prepare(
    "UPDATE scheduled_txs SET status = 'cancelled' WHERE id = ?",
  )
    .bind(id)
    .run();

  return c.json({ id, status: "cancelled" });
});

// ---------------------------------------------------------------------------
// Cron — broadcast pending txs every minute
// ---------------------------------------------------------------------------

async function handleCron(env: Env) {
  const now = Math.floor(Date.now() / 1000);

  // Find pending txs whose validAfter has arrived.
  const { results: pending } = await env.DB.prepare(
    `SELECT * FROM scheduled_txs
     WHERE status = 'pending'
       AND valid_after <= ?
       AND (valid_before IS NULL OR valid_before >= ?)
     LIMIT 50`,
  )
    .bind(now, now)
    .all<ScheduledTx>();

  for (const row of pending ?? []) {
    try {
      const res = await fetch(env.RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_sendRawTransaction",
          params: [row.tx_bytes],
          id: 1,
        }),
      });

      const data = (await res.json()) as {
        result?: string;
        error?: { message?: string };
      };

      if (data.result) {
        await env.DB.prepare(
          "UPDATE scheduled_txs SET status = 'submitted', tx_hash = ? WHERE id = ?",
        )
          .bind(data.result, row.id)
          .run();
      } else {
        const errMsg = data.error?.message ?? "Unknown RPC error";
        await env.DB.prepare(
          "UPDATE scheduled_txs SET status = 'failed', error = ? WHERE id = ?",
        )
          .bind(errMsg, row.id)
          .run();
      }
    } catch (e) {
      // Retry on next cron tick.
      console.error(`Failed to broadcast ${row.id}:`, e);
    }
  }

  // Expire txs whose validBefore has passed.
  await env.DB.prepare(
    "UPDATE scheduled_txs SET status = 'expired' WHERE status = 'pending' AND valid_before < ?",
  )
    .bind(now)
    .run();
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default {
  fetch: app.fetch,
  scheduled: (
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    ctx.waitUntil(handleCron(env));
  },
};
