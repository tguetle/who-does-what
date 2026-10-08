# Who Does What

Statische Webseite zur Darstellung von Organisations- und Kompetenzstrukturen. Die App ist generisch: Der Code enthält keine Organisationsdaten, alle Inhalte stehen in einer JSON-Datei.

## Funktionen

- Organigramm, Baumansicht, Personenliste, Ansprechpartner, Mitmachen, Kompetenzen und Risiken
- Legende für Zuordnungen (durchgezogene Linie = organisatorischer Verantwortungsbereich)
- Bearbeitung im Browser über den internen Modus (`?intern`)
- Import und Export als JSON
- Neue Organisation aus einer Vorlage (`data/template.json`)
- Datenschutz: E-Mail, Telefon und Foto werden nur angezeigt, wenn `consent: true` gesetzt ist (im internen Modus immer)

## Projektstruktur

```
index.html            Einstiegspunkt
css/styles.css        Styles
js/app.js             Laden, Speichern, Validierung, Import/Export
js/views.js           Darstellung der Ansichten
js/editor.js          Bearbeitung im internen Modus
data/organigramm.json Demo-Daten
data/template.json    Vorlage für neue Organisationen
data/assets/          Logo und Demo-Fotos
examples/             Beispiel-Organisationen
tests/                Datentests (node --test) und End-to-End-Tests (Playwright)
```

## Lokal starten

Die App benötigt einen lokalen Webserver, da sie JSON-Dateien lädt. Mit Node.js:

```
npm install
npx http-server . -p 8080 -c-1
```

Danach im Browser `http://localhost:8080` öffnen. Interner Modus: `http://localhost:8080/?intern`.

## Daten

Die Organisation wird vollständig in einer JSON-Datei beschrieben. Wichtige Bereiche:

- `organization`: Name, Version, Bezeichnung und Beschreibung des Vorstands
- `organization.hasTopOrgan` und `organization.hasBoard` (optional, Standard: `true`): auf `false` setzen, wenn es kein oberstes Organ bzw. keinen Vorstand gibt. Der Block und die zugehörigen Optionen werden dann ausgeblendet; die Daten bleiben erhalten.
- `organization.terms` (optional): eigene Bezeichnungen für `boardRole` (Standard: `Vorstandsamt`) und `portfolio` (Standard: `Ressort`). Das oberste Organ und der Vorstand werden aus `root.title` bzw. `organization.boardTitle` übernommen.
  
  Die Begriffe werden ohne Anpassung von Artikeln und Beugung eingesetzt. Am besten funktionieren kurze Substantive ohne Artikel, z. B. `Gemeinderat` oder `Gremium`.
- `root`: oberstes Gremium (Titel und Beschreibung)
- `people`: Personen mit `id`, `name`, optional `photo`, `email`, `phone`, `consent`, `note`
- `board`: Vorstandsposten mit `id` und `title`
- `sections`: Bereiche mit `id`, `title`, `icon`, `type` (`assembly`, `internal` oder `partner`), `description` und `roles`

Jede Rolle enthält `id`, `title`, `personIds`, `status` (z. B. `official` oder `vacant`), optional `deputyIds`, `tasks`, `autonomy`, `approval`, `effort` und `termUntil`.

Die Referenz `reportsTo` muss auf eine Rollen-ID im selben Bereich zeigen.

Fotos und Logos werden als relative Pfade (z. B. `data/assets/demo-fotos/...`), als http(s)-URL oder als Base64-Data-URI (PNG, JPEG, WebP, GIF) angegeben. SVG-Data-URIs werden abgelehnt.

## Speicherung im Browser

Änderungen werden im `localStorage` des Browsers gespeichert. Die Schlüssel sind an den Pfad der Seite gebunden, damit mehrere GitHub-Pages-Projekte desselben Nutzers sich nicht gegenseitig überschreiben. Lokale Änderungen sind nur in diesem Browser sichtbar. Vor dem Zurücksetzen oder Wechsel des Pfads sollte exportiert werden.

## Tests

```
npm install
npx playwright install --with-deps chromium
npm test
```

- `npm run test:data`: prüft die JSON-Dateien (Daten, Vorlage, Beispiele)
- `npm run test:e2e`: Browser-Tests mit Playwright

Die CI-Pipeline (`.github/workflows/tests.yml`) führt dieselben Tests bei jedem Push aus.

## Veröffentlichung

Live-Version: https://tguetle.github.io/who-does-what/

Veröffentlicht wird der jeweils neueste Git-Tag (`v*`) über den Workflow `.github/workflows/pages.yml`. Deployments ohne Tag zeigen im Footer den Hinweis „nicht getaggt“.

Im Footer steht die Ausgabe von `git describe` (z. B. `v1.0.0-2-g3246de`). Lokal ohne Build-Info wird die Version aus `package.json` angezeigt. Ein neues Release entsteht so:

```
npm version patch   # oder minor / major
git push --follow-tags
```

`npm version` setzt die Version in `package.json`, legt den Commit und den Tag `vX.Y.Z` an.

Voraussetzung: unter Settings → Pages ist als Source „GitHub Actions“ eingestellt.

Alle Dateien im Repository sind öffentlich abrufbar, auch die JSON-Daten. Echte Personendaten gehören daher nicht ins Repository (siehe `.gitignore`).
