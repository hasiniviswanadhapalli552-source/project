/*
# Create app_config table for storing API keys

1. New Tables
- `app_config`
  - id (uuid, primary key)
  - key (text, unique) — config key name
  - value (text) — config value (API keys, etc.)
  - created_at (timestamptz)

2. Security
- Enable RLS on `app_config`.
- No policies: only the service role (used by edge functions) can access this table.
- The anon/authenticated roles have no access, keeping secrets safe.
*/

CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Insert the OpenRouter API key
INSERT INTO app_config (key, value) VALUES ('OPENROUTER_API_KEY', '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')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
