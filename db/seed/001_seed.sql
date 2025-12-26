-- Seed data for minimal environment
INSERT INTO sites (code, name, timezone, status)
VALUES ('US-EAST-01', 'Primary Site', 'America/New_York', 'active')
ON CONFLICT (code) DO NOTHING;
