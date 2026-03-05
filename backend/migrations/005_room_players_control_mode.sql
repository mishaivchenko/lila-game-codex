ALTER TABLE room_players
  ADD COLUMN IF NOT EXISTS control_mode TEXT NOT NULL DEFAULT 'self'
  CHECK (control_mode IN ('self', 'host'));

