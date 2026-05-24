# Radkummerkasten

Neuimplementierung des Radlobby Wien Radkummerkastens mit modernem Technologiestack und einer für mobile Endgeräte ausgelegten Oberfläche.

## Ordnerstruktur

- `frontend/` — Vue-3, Vite und Maplibre Website. Verwendet Cloudflare Captcha gegen Spam.
- `backend/` — Fastify (Node.js) REST-API. Abindung an Cloudflare für Fotouploads.
- `database/` — Postgres-Schema und Docker-Compose-Setup. `seed.sql` befüllt die Datenbank mit 10.000 zufällig lokalisierten Problemstellen.

## Einrichtung

1. Datenbank starten:

```bash
docker compose -f database/docker-compose.yml up -d
```

2. Backend-Abhängigkeiten installieren:

```bash
cd backend
npm install
```

3. Frontend-Abhängigkeiten installieren:

```bash
cd ../frontend
npm install
```

5. Backend und Frontend starten:

```bash
cd backend
npm run dev
```

```bash
cd ../frontend
npm run dev
```

6. `http://localhost:5173` öffnen.

## TODO

- Mailservice für E-Mail Verifizierung anbinden
- Accessibility

## Zu klären

- Abweichungen vom bestehenden Radkummerkasten:
  - Name statt getrenntem Vor- und Nachnamen
  - kein Geschlecht notwendig
  - Mailadresse optional (nur für Benachrichtigungen)
  - kein Newsletter opt-in
  - keine Zustimmung zur Datenschutzerklärung
  - kein Statistik-Tab
  - keine Möglichkeit nach Problemtypen zu filtern
- erledigte Problemstelle Status und Icon
- Ermitteln/Anzeigen von Adresse/Koordinaten notwendig?
