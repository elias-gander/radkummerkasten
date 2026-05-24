-- PostgreSQL Seed: 10.000 issues
-- Voraussetzung:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO issues (
  issue_type_id,
  description,
  name,
  email,
  upvotes,
  latitude,
  longitude
)
SELECT
  issue_types[(floor(random() * array_length(issue_types, 1)) + 1)::int]::issue_type_id_enum,

  descriptions[(floor(random() * array_length(descriptions, 1)) + 1)::int],

  first_names[(floor(random() * array_length(first_names, 1)) + 1)::int],

  lower(
    replace(
      first_names[(floor(random() * array_length(first_names, 1)) + 1)::int],
      ' ',
      ''
    )
  ) || gs || '@example.com',

  floor(random() * 51)::int,

  -- Wien Bounding Box
  round((48.1150 + random() * (48.3250 - 48.1150))::numeric, 6),

  round((16.1820 + random() * (16.5770 - 16.1820))::numeric, 6)

FROM generate_series(1, 10000) gs,

LATERAL (
  SELECT
    ARRAY[
      'gefahrenstelle',
      'lueckenschluss',
      'einbahn-oeffnen',
      'radbuegel',
      'markierung-schild',
      'ampel',
      'hindernis',
      'anderes'
    ] AS issue_types,

    ARRAY[
      'Starke Kfz-Berührung an Kreuzung',
      'Radweg endet unvermittelt',
      'Einbahnstraße wirkt für Radfahrende unnötig',
      'Fehlende Fahrradständer',
      'Markierung kaum sichtbar',
      'Ampelschaltung benachteiligt Radverkehr',
      'Poller blockiert Durchfahrt',
      'Schlechter Straßenbelag',
      'Zu enge Radspur',
      'Autos parken auf Radweg',
      'Unübersichtliche Kreuzung',
      'Fehlende Beschilderung',
      'Baustelle blockiert Radweg',
      'Gefährliche Straßenbahnschienen',
      'Schlechter Übergang bei Kreuzung',
      'Radweg plötzlich unterbrochen',
      'Sichtbehinderung durch parkende Autos',
      'Zu kurze Grünphase',
      'Fehlende Bodenmarkierung',
      'Hindernis auf dem Radweg'
    ] AS descriptions,

    ARRAY[
      'Anna',
      'Jonas',
      'Lena',
      'Markus',
      'Sara',
      'Paul',
      'Julia',
      'David',
      'Miriam',
      'Tobias',
      'Lisa',
      'Michael',
      'Eva',
      'Florian',
      'Nina',
      'Stefan',
      'Katharina',
      'Daniel',
      'Sophie',
      'Alexander'
    ] AS first_names
) data;