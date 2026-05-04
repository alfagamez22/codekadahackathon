CREATE TABLE IF NOT EXISTS fuel_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL,
  current_price NUMERIC(8, 2) NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('scraped', 'community', 'admin')),
  confirmed_report_id TEXT,
  confirmation_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(station_id, fuel_type)
);

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL,
  old_price NUMERIC(8, 2),
  new_price NUMERIC(8, 2) NOT NULL,
  source_type TEXT NOT NULL,
  report_id TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_station ON price_history(station_id, fuel_type, changed_at DESC);

CREATE TABLE IF NOT EXISTS price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_url TEXT,
  brand TEXT,
  fuel_type TEXT NOT NULL,
  location_scope TEXT,
  price NUMERIC(8, 2) NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_scraped ON price_snapshots(scraped_at DESC);
