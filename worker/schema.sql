CREATE TABLE IF NOT EXISTS scheduled_txs (
  id          TEXT PRIMARY KEY,
  owner       TEXT NOT NULL,
  tx_bytes    TEXT NOT NULL,
  valid_after INTEGER NOT NULL,
  valid_before INTEGER,
  status      TEXT NOT NULL DEFAULT 'pending',
  tx_hash     TEXT,
  error       TEXT,
  created_at  INTEGER NOT NULL,
  memo        TEXT
);

CREATE INDEX IF NOT EXISTS idx_status_valid ON scheduled_txs (status, valid_after);
CREATE INDEX IF NOT EXISTS idx_owner ON scheduled_txs (owner);
