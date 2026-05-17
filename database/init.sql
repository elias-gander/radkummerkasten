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
  description text NOT NULL,
  name text NOT NULL,
  email text,
  upvotes integer NOT NULL DEFAULT 0,
  photo_urls text[] DEFAULT '{}',
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id serial PRIMARY KEY,
  issue_id integer NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  name text NOT NULL,
  text text NOT NULL,
  photo_urls text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id serial PRIMARY KEY,
  issue_id integer NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(issue_id, email)
);

CREATE INDEX idx_issues_lat_lng ON issues(latitude, longitude);
CREATE INDEX idx_issues_type_id ON issues(issue_type_id);
CREATE INDEX idx_subscriptions_issue_id ON subscriptions(issue_id);
CREATE INDEX idx_subscriptions_email ON subscriptions(email);
