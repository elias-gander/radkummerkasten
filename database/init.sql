CREATE TYPE issue_type_id_enum AS ENUM (
  'gefahrenstelle',
  'lueckenschluss',
  'einbahn-oeffnen',
  'radbuegel',
  'markierung-schild',
  'ampel',
  'hindernis',
  'anderes'
);

CREATE TABLE issues (
  id serial PRIMARY KEY,
  issue_type_id issue_type_id_enum NOT NULL,
  beschreibung text NOT NULL,
  name text NOT NULL,
  email text,
  upvotes integer NOT NULL DEFAULT 0,
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id serial PRIMARY KEY,
  issue_id integer NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id serial PRIMARY KEY,
  issue_id integer NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(issue_id, email)
);

CREATE TABLE photos (
  id serial PRIMARY KEY,
  comment_id integer REFERENCES comments(id) ON DELETE CASCADE,
  issue_id integer REFERENCES issues(id) ON DELETE CASCADE,
  url text NOT NULL
);

CREATE TABLE pending_submissions (
  id serial PRIMARY KEY,
  token text NOT NULL UNIQUE,
  type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_issues_lat_lng ON issues(latitude, longitude);
CREATE INDEX idx_issues_type_id ON issues(issue_type_id);
CREATE INDEX idx_subscriptions_issue_id ON subscriptions(issue_id);
CREATE INDEX idx_subscriptions_email ON subscriptions(email);

INSERT INTO issues (issue_type_id, beschreibung, name, email, upvotes, latitude, longitude)
VALUES
  ('gefahrenstelle', 'Starke Kfz-Berührung an Kreuzung', 'Anna', 'anna@example.com', 12, 48.2085, 16.3738),
  ('lueckenschluss', 'Radweg endet unvermittelt', 'Jonas', 'jonas@example.com', 7, 48.2111, 16.3772),
  ('einbahn-oeffnen', 'Einbahnstraße wirkt für Radfahrende unnötig', 'Lena', 'lena@example.com', 4, 48.2068, 16.3654),
  ('radbuegel', 'Fehlen von Fahrradständern am Markt', 'Markus', 'markus@example.com', 5, 48.2049, 16.3700),
  ('ampel', 'Ampelschaltung lässt Radfahrer lange warten', 'Sara', 'sara@example.com', 9, 48.2103, 16.3691);
