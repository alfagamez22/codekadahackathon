CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  address TEXT,
  barangay TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  location GEOMETRY(Point, 4326),
  fuel_types TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stations_location ON stations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_stations_city ON stations(city);
CREATE INDEX IF NOT EXISTS idx_stations_province ON stations(province);
CREATE INDEX IF NOT EXISTS idx_stations_brand ON stations(brand);
