"use strict";

// Quellsprache ist Deutsch: Die deutschen Texte stehen direkt in index.html und im Code.
// Neue Sprache ergänzen: einen Eintrag in LANGUAGES anlegen und "messages" füllen.
// "messages" ordnet jedem deutschen Originaltext (Leerzeichen normalisiert) seine
// Übersetzung zu. Fehlt ein Eintrag, bleibt der deutsche Text stehen.
// Platzhalter wie {board} bleiben in der Übersetzung erhalten.
const LANGUAGES = {
  de: {
    name: "Deutsch",
    locale: "de-DE",
    messages: {}
  },
  en: {
    name: "English",
    locale: "en-GB",
    messages: {
      // index.html
      "Interne Ansicht": "Internal view",
      "Organigramm durchsuchen": "Search organigram",
      "Werkzeuge": "Tools",
      "Sprache": "Language",
      "Rolle, Person oder Aufgabe suchen": "Search role, person or task",
      "Neue Organisation": "New organization",
      "Organisation": "Organization",
      "+ Rolle": "+ Role",
      "+ Bereich": "+ Section",
      "+ Person": "+ Person",
      "JSON herunterladen": "Download JSON",
      "JSON importieren": "Import JSON",
      "Drucken / PDF": "Print / PDF",
      "Öffentliche Vorschau": "Public preview",
      "Zur internen Ansicht": "Go to internal view",
      "Lokale Änderungen verwerfen": "Discard local changes",
      "Daten werden geladen …": "Loading data …",
      "Who Does What · App-Version": "Who Does What · App version",
      "Organigramm wird aus der JSON-Datei geladen …": "Loading organigram from JSON file …",
      "Ansicht und Filter": "View and filters",
      "Ansicht": "View",
      "Organigramm": "Organigram",
      "Baum": "Tree",
      "Personen": "People",
      "Wen frage ich?": "Who do I ask?",
      "Mitmachen": "Get involved",
      "Kompetenzen": "Competencies",
      "Risiken": "Risks",
      "Statusfilter": "Status filter",
      "Alle": "All",
      "Handlungsbedarf": "Action needed",
      "Vakant": "Vacant",
      "Kompetenz unklar": "Competence unclear",
      "Vorschlag": "Proposal",
      "Im Repository gibt es einen neueren Datenstand.": "The repository has a newer data version.",
      "Du siehst deine lokal bearbeitete Version. Änderungen, die inzwischen im Repository gemacht wurden, sind darin nicht enthalten.": "You see your locally edited version. Changes made in the repository in the meantime are not included.",
      "Repository-Version laden": "Load repository version",
      "Lokale Version behalten": "Keep local version",
      "Durchgezogene Zuordnung: organisatorischer Verantwortungsbereich. Förderverein und externe Stellen werden als eigenständige Partner dargestellt.": "Solid line: organizational area of responsibility. Support association and external bodies are shown as independent partners.",
      "Dialog schließen": "Close dialog",
      "Abbrechen": "Cancel",
      "Speichern": "Save",
      "Name": "Name",
      "E-Mail": "Email",
      "Telefon": "Phone",
      "Foto": "Photo",
      "Funktionen": "Functions",
      "Notiz": "Note",
      "Einwilligung": "Consent",
      "Version": "Version",
      "Logo": "Logo",
      "Beschreibung": "Description",
      "Quelle / Unterseite": "Source / subpage",
      "Sonstiges": "Other",
      "Status": "Status",
      "Bereich": "Section",
      "Stellvertretung": "Deputy",
      "Bestellung": "Appointment",
      "Aufgaben": "Tasks",
      "Zeitaufwand": "Time commitment",
      "Kontakt": "Contact",
      "Hinweis": "Note",
      "Funktion": "Function",
      "Person": "Person",
      "Anzahl": "Count",
      "Löschen": "Delete",
      "Details": "Details",
      "Ja": "Yes",
      "nein": "no",
      "ja": "yes",
      "Vorstandsamt": "Board position",
      "Ressort": "Portfolio",
      "Kein besonderer Status": "No special status",
      "Offiziell benannt": "Officially appointed",
      "Vorschlag / zu prüfen": "Proposal / to be checked",
      "Extern": "External",
      "Eigenständiger Partner": "Independent partner",
      "Interner Verantwortungsbereich": "Internal area of responsibility",
      "Direkt der {topOrgan} zugeordnet": "Directly assigned to the {topOrgan}",
      "Rolle bearbeiten": "Edit role",
      "Einordnung": "Classification",
      "Untergeordnet unter (vorgesetzte Rolle)": "Reports to (superior role)",
      "Funktion / Rolle": "Function / role",
      "Hinweis, wenn keine Person benannt ist": "Note if no person is named",
      "Bestellung und Kontakt": "Appointment and contact",
      "Amtszeit bis (Jahr)": "Term until (year)",
      "E-Mail der Funktion": "Email of function",
      "Freigabegrenze in €": "Approval limit in €",
      "Aufgaben und Kompetenzen": "Tasks and competencies",
      "Darf selbst entscheiden": "May decide independently",
      "{board} muss zustimmen bei": "{board} must approve",
      "{board} vorhanden": "{board} present",
      "Entscheidungsbefugnisse (Freigabe-Matrix)": "Decision authority (approval matrix)",
      "Mitmachen und „Wen frage ich?“": "Get involved and „Who do I ask?“",
      "Wir suchen Unterstützung": "We are looking for support",
      "Themen für „Wen frage ich?“ (eins pro Zeile)": "Topics for „Who do I ask?“ (one per line)",
      "Organisatorische Bemerkung": "Organizational note",
      "z. B. ca. 2 Stunden pro Woche": "e.g. about 2 hours per week",
      "leer = E-Mail des Bereichs": "empty = email of section",
      "z. B. 2027": "e.g. 2027",
      "z. B. /vorstandschaft-und-beiraete": "e.g. /board-and-advisory-councils",
      "z. B. Probetraining für mein Kind": "e.g. trial session for my child",
      "Ausgaben ohne {board} bis …": "Spending without {board} up to …",
      "z. B. Vakant – derzeit wahrgenommen von „{board}“": "e.g. Vacant – currently covered by „{board}“",
      "Bereich anlegen": "Create section",
      "Name des Bereichs": "Name of section",
      "Symbol": "Symbol",
      "Darstellungsart": "Display type",
      "E-Mail-Adresse des Bereichs": "Email address of section",
      "Bereich löschen": "Delete section",
      "z. B. Kommunikation und Medien": "e.g. Communication and media",
      "Vorstandsamt bearbeiten": "Edit board position",
      "Amt": "Position",
      "z. B. 2. Vorsitzender": "e.g. 2nd chairperson",
      "Amt löschen": "Delete position",
      "E-Mail des Amts": "Email of position",
      "Person bearbeiten": "Edit person",
      "Alles, was hier eingetragen wird, landet in der JSON-Datei. Ist die Seite oder das Repository öffentlich, kann jeder diese Daten abrufen – auch wenn die öffentliche Ansicht sie ausblendet. Bitte nur Daten mit Einwilligung der Person eintragen.": "Everything entered here ends up in the JSON file. If the page or repository is public, anyone can retrieve this data – even if the public view hides it. Please only enter data with the person's consent.",
      "Bild-URL oder Pfad, z. B. images/personen/name.jpg": "Image URL or path, e.g. images/people/name.jpg",
      "Bild-URL oder Pfad": "Image URL or path",
      "Bild hochladen": "Upload image",
      "Bild entfernen": "Remove image",
      "Hochgeladene Bilder werden auf max. 256 px verkleinert und direkt in der JSON-Datei gespeichert.": "Uploaded images are scaled down to max. 256 px and saved directly in the JSON file.",
      "Einwilligung liegt vor: Kontaktdaten und Foto dürfen öffentlich angezeigt werden": "Consent given: contact details and photo may be shown publicly",
      "Interne Notiz": "Internal note",
      "Person löschen": "Delete person",
      "Organisation bearbeiten": "Edit organization",
      "z. B. Musikverein Harmonie e.V.": "e.g. Musikverein Harmonie e.V.",
      "Format x.y.z, z. B. 1.2.0": "Format x.y.z, e.g. 1.2.0",
      "z. B. 1.2.0": "e.g. 1.2.0",
      "Oberstes Organ vorhanden": "Top organ present",
      "Oberstes Organ: Titel": "Top organ: title",
      "z. B. Mitgliederversammlung": "e.g. general assembly",
      "Oberstes Organ: Beschreibung": "Top organ: description",
      "{board}: Titel": "{board}: title",
      "z. B. Vorstand": "e.g. board",
      "{board}: Beschreibung": "{board}: description",
      "Begriffe": "Terms",
      "Leer lassen, um den Standardbegriff zu verwenden.": "Leave empty to use the default term.",
      "Bezeichnung Vorstandsamt": "Label board position",
      "Bezeichnung Ressort": "Label portfolio",
      "Bild-URL oder Pfad, z. B. data/logo.png": "Image URL or path, e.g. data/logo.png",
      "Logo-URL oder Pfad": "Logo URL or path",
      "Logo hochladen": "Upload logo",
      "Logo entfernen": "Remove logo",
      "Hochgeladene Logos werden auf max. 512 px verkleinert und direkt in der JSON-Datei gespeichert.": "Uploaded logos are scaled down to max. 512 px and saved directly in the JSON file.",
      "Diese Seite benötigt JavaScript, um die Daten aus der JSON-Datei darzustellen.": "This page needs JavaScript to display the data from the JSON file.",

      // Begriffe und Standardwerte
      "Mitgliederversammlung": "General assembly",
      "Vorstand": "Board",
      "{board} stimmt zu": "{board} agrees",
      "Entscheidet selbst": "Decides independently",
      "Gewählt von: {topOrgan}": "Elected by: {topOrgan}",
      "Berufen von: {board}": "Appointed by: {board}",
      "Informell, ohne förmliche Bestellung": "Informal, without formal appointment",
      "Extern / vertraglich": "External / contractual",
      "nicht angegeben": "not specified",
      "nicht festgelegt": "not defined",
      "Amtszeit bis {year}": "Term until {year}",
      "Ausgaben": "Spending",
      "Verträge": "Contracts",
      "Trainer & Personal": "Coaches & staff",
      "Spielbetrieb": "Sports operations",
      "Anlage & Anschaffungen": "Facilities & purchases",
      "Öffentlichkeit": "Public relations",
      "Freigabegrenze": "Approval limit",
      "selbst": "self",
      "Keine Person benannt": "No person named",
      "Unbenannte Rolle": "Unnamed role",
      "Ohne benannte Person": "Without named person",
      "Keiner Funktion zugeordnet": "No function assigned",
      "1 Funktion": "1 function",
      "{count} Funktionen": "{count} functions",

      // Status
      "Partner": "Partner",
      "Gesamtverantwortung, Ziele, Rahmenbedingungen und Budgets": "Overall responsibility, goals, framework conditions and budgets",
      "Keine Treffer in „{board}“.": "No matches in „{board}“.",
      "Titel und Texte bearbeiten": "Edit title and texts",
      "+ {boardRole}": "+ {boardRole}",
      "{title} bearbeiten": "Edit {title}",
      "{topOrgan} bearbeiten": "Edit {topOrgan}",
      "{board} bearbeiten": "Edit {board}",
      "Bearbeiten": "Edit",
      "Bereich nach oben": "Section up",
      "Bereich nach unten": "Section down",
      "Rolle nach oben": "Role up",
      "Rolle nach unten": "Role down",
      "In diesem Bereich sind noch keine Rollen eingetragen.": "No roles have been entered in this section yet.",
      "Verantwortungsbereiche und Abteilungen": "Areas of responsibility and departments",
      "Operative Verantwortung innerhalb der Rahmenbedingungen von „{board}“": "Operational responsibility within the framework set by „{board}“",
      "{portfolio}: {title} ({person})": "{portfolio}: {title} ({person})",
      "{portfolio}: {sections}": "{portfolio}: {sections}",
      "Kein {portfolio} zugeordnet": "No {portfolio} assigned",
      "kein {portfolio} zugeordnet": "no {portfolio} assigned",
      "Keine E-Mail-Adresse": "No email address",
      "Vertretung": "Deputy",
      "Ausgaben bis {amount} ohne {board}": "Spending up to {amount} without {board}",
      "Entscheidungsbefugnisse": "Decision authority",
      "Organisatorischer Hinweis": "Organizational note",
      "Quelle: {source}": "Source: {source}",
      "{area}: {value}": "{area}: {value}",
      "Funktion unbesetzt": "Position vacant",
      "Unterstützung gesucht": "Support wanted",
      "Zeitaufwand: {effort}": "Time commitment: {effort}",
      "Interesse? Schreib an": "Interested? Write to",
      "Interesse? Sprich {person} ({title}) an.": "Interested? Get in touch with {person} ({title}).",
      "Interesse? Wende dich an „{board}“.": "Interested? Get in touch with „{board}“.",
      "Derzeit sind alle Funktionen besetzt. Wer mithelfen möchte, ist trotzdem jederzeit willkommen!": "All positions are currently filled. Anyone who would like to help is still very welcome!",
      "Hier sucht der Verein derzeit Unterstützung": "The association is currently looking for support",
      "Die richtige Ansprechperson für häufige Anliegen": "The right contact person for common requests",
      "Noch keine Themen hinterlegt – in der jeweiligen Rolle unter „Themen“ ergänzen.": "No topics yet – add them in the respective role under „Topics“.",
      "Derzeit nicht besetzt – bitte an {title} ({person}) wenden.": "Currently vacant – please contact {title} ({person}).",
      "Derzeit nicht besetzt – bitte an „{board}“ wenden.": "Currently vacant – please contact „{board}“.",
      "Personen und Funktionen": "People and functions",
      "Alle Personen mit ihren Funktionen im Verein": "All people with their functions in the association",
      "Karten": "Cards",
      "Tabelle": "Table",
      "Sortieren nach": "Sort by",
      "Anzahl Funktionen": "Number of functions",
      "Nachname": "Last name",
      "Darstellung": "Display",
      "Kompetenzübersicht": "Competence overview",
      "Was darf jede Funktion selbst entscheiden – und wo muss „{board}“ zustimmen?": "What may each function decide independently – and where must „{board}“ approve?",
      "Freigabe-Matrix": "Approval matrix",
      "Noch keine Entscheidungsbefugnisse hinterlegt – in der jeweiligen Rolle unter „Entscheidungsbefugnisse“ pflegen.": "No decision authority entered yet – maintain it in the respective role under „Decision authority“.",
      "nicht geregelt": "not regulated",
      "Risiken und Lücken": "Risks and gaps",
      "Wo der Verein von Einzelnen abhängt oder Angaben fehlen": "Where the association depends on individuals or information is missing",
      "Viele Funktionen bei einer Person": "Many functions held by one person",
      "Fällt die Person aus, sind mehrere Bereiche gleichzeitig betroffen.": "If this person is unavailable, several areas are affected at once.",
      "{name} – {count} Funktionen": "{name} – {count} functions",
      "Funktionen ohne benannte Person": "Functions without named person",
      "Hier ist unklar, wer die Aufgabe tatsächlich wahrnimmt.": "It is unclear who actually performs the task.",
      "Ohne Stellvertretung": "Without deputy",
      "Nur eine Person benannt und keine Vertretung eingetragen.": "Only one person named and no deputy entered.",
      "Amtszeit endet bald": "Term ends soon",
      "Amtszeit endet spätestens {year} – Nachfolge rechtzeitig planen.": "Term ends by {year} at the latest – plan succession in time.",
      "Bereiche mit fehlenden Angaben": "Sections with missing information",
      "Ohne E-Mail-Adresse oder ohne zugeordnetes {portfolio}.": "Without email address or without assigned {portfolio}.",
      "E-Mail fehlt": "Email missing",
      "{portfolio} fehlt": "{portfolio} missing",
      "Keine Einträge.": "No entries.",
      "Für Suche und Filter wurden keine passenden Einträge gefunden.": "No matching entries were found for the search and filters.",
      "(bis {year})": "(until {year})",
      "Keine – oberste Ebene im Bereich": "None – top level in section",
      "Neue Rolle hinzufügen": "Add new role",
      "Bereich bearbeiten": "Edit section",
      "Bereich wurde gespeichert.": "Section saved.",
      "Bereich wurde angelegt.": "Section created.",
      "Bereich wurde gelöscht.": "Section deleted.",
      "Soll der Bereich „{title}“ mit {count} Rollen wirklich gelöscht werden?": "Really delete section „{title}“ with {count} roles?",
      "Soll der Bereich „{title}“ wirklich gelöscht werden?": "Really delete section „{title}“?",
      "Bitte zuerst einen Bereich anlegen.": "Please create a section first.",
      "Rolle wurde gespeichert.": "Role saved.",
      "Rolle wurde gelöscht.": "Role deleted.",
      "Soll die Rolle „{title}“ wirklich gelöscht werden?": "Really delete role „{title}“?",
      "{boardRole} bearbeiten": "Edit {boardRole}",
      "Neu: {boardRole}": "New: {boardRole}",
      "{boardRole} wurde gespeichert.": "{boardRole} saved.",
      "{boardRole} wurde gelöscht.": "{boardRole} deleted.",
      "Soll der Eintrag „{title}“ wirklich gelöscht werden?": "Really delete entry „{title}“?",
      "Organisation wurde gespeichert.": "Organization saved.",
      "Das Logo konnte nicht gelesen werden.": "The logo could not be read.",
      "Das Bild konnte nicht gelesen werden.": "The image could not be read.",
      "Es gibt bereits eine Person „{name}“. Trotzdem speichern?": "A person „{name}“ already exists. Save anyway?",
      "Person wurde gespeichert.": "Person saved.",
      "Person wurde gelöscht.": "Person deleted.",
      "Soll „{name}“ gelöscht und aus {count} Funktionen entfernt werden?": "Delete „{name}“ and remove from {count} functions?",
      "Soll „{name}“ wirklich gelöscht werden?": "Really delete „{name}“?",
      "Neue Person": "New person",
      "Funktionen werden in der jeweiligen Rolle bzw. unter {boardRole} zugeordnet.": "Functions are assigned in the respective role or under {boardRole}.",
      "Neu: {title}": "New: {title}",
      "Name eingeben oder auswählen": "Enter or select name",
      "{label}: Name eingeben oder auswählen": "{label}: enter or select name",
      "Funktion, z. B. Co-Trainer": "Function, e.g. assistant coach",
      "Funktion von {name}": "Function of {name}",
      "{name} entfernen": "Remove {name}",
      "Hinzufügen": "Add",
      "„{name}“ als neue Person anlegen": "Create new person „{name}“",

      // Hinweise und Fehler
      "Lokales Speichern fehlgeschlagen – vermutlich ist der Speicher voll (z. B. durch viele Fotos). Bitte JSON herunterladen.": "Local save failed – storage is probably full (e.g. because of many photos). Please download the JSON.",
      "Verschlüsselt exportieren": "Export encrypted",
      "Organigramm entsperren": "Unlock organigram",
      "Diese Datei ist verschlüsselt. Bitte die Passphrase eingeben.": "This file is encrypted. Please enter the passphrase.",
      "Passphrase falsch oder Datei beschädigt. Bitte erneut eingeben.": "Wrong passphrase or damaged file. Please try again.",
      "Passphrase": "Passphrase",
      "Passphrase wiederholen": "Repeat passphrase",
      "Zufalls-Passphrase erzeugen": "Generate random passphrase",
      "Weiter": "Continue",
      "Die Passphrasen stimmen nicht überein.": "The passphrases do not match.",
      "Mindestens {length} Zeichen. Die Passphrase wird nicht in der Datei gespeichert und muss auf einem anderen Weg weitergegeben werden.": "At least {length} characters. The passphrase is not stored in the file and must be shared through a separate channel.",
      "Das Organigramm wurde nicht entsperrt.": "The organigram was not unlocked.",
      "Verschlüsselte Datei wurde heruntergeladen.": "Encrypted file downloaded.",
      "Lokale bearbeitete Version · Datenstand {updated}": "Locally edited version · data status {updated}",
      "Version aus dem GitHub-Repository · Datenstand {updated}": "Version from the GitHub repository · data status {updated}",
      " · Version {version}": " · Version {version}",
      "{name} · Version {version}": "{name} · Version {version}",
      "Stand: {date}": "Status: {date}",
      "unbekannt": "unknown",
      "nicht getaggt": "not tagged",
      "nicht getaggt (lokal)": "not tagged (local)",
      "Logo von {name}": "Logo of {name}",
      "Organisations- und Kompetenzstruktur von {name}": "Organization and competence structure of {name}",
      "JSON-Datei konnte nicht geladen werden: HTTP {status}": "JSON file could not be loaded: HTTP {status}",
      "Die Datei data/organigramm.json konnte nicht geladen werden – angezeigt wird die im Browser gespeicherte Version.": "The file data/organigramm.json could not be loaded – the version saved in this browser is shown.",
      "JSON wurde heruntergeladen. Ersetze damit bei Bedarf data/organigramm.json im Repository.": "JSON downloaded. If needed, replace data/organigramm.json in the repository with it.",
      "JSON-Datei wurde erfolgreich importiert.": "JSON file imported successfully.",
      "Import fehlgeschlagen: {message}": "Import failed: {message}",
      "Sollen alle lokal gespeicherten Änderungen verworfen und die JSON-Datei aus dem Repository neu geladen werden?": "Discard all locally saved changes and reload the JSON file from the repository?",
      "Eine neue Organisation anlegen? Die aktuell angezeigte Version wird dabei ersetzt. Vorher ggf. JSON herunterladen.": "Create a new organization? The currently shown version will be replaced. Download the JSON first if needed.",
      "Vorlage konnte nicht geladen werden: HTTP {status}": "Template could not be loaded: HTTP {status}",
      "Neue Organisation angelegt. Name, Version und Logo lassen sich über „Organisation bearbeiten“ ändern.": "New organization created. Name, version and logo can be changed via „Edit organization“.",
      "Anlegen fehlgeschlagen: {message}": "Creating failed: {message}",
      "Jede Person benötigt „id“ und „name“.": "Each person needs „id“ and „name“.",
      "Die JSON-Wurzel muss ein Objekt sein.": "The JSON root must be an object.",
      "Der Eintrag „organization“ fehlt.": "The entry „organization“ is missing.",
      "Der Eintrag „root“ fehlt.": "The entry „root“ is missing.",
      "Der Eintrag „board“ muss ein Array sein.": "The entry „board“ must be an array.",
      "Der Eintrag „sections“ muss ein Array sein.": "The entry „sections“ must be an array.",
      "Der Eintrag „people“ muss ein Array sein.": "The entry „people“ must be an array.",
      "Jeder Bereich benötigt „id“ und „title“.": "Each section needs „id“ and „title“.",
      "Der Bereich „{title}“ benötigt ein Rollen-Array.": "The section „{title}“ needs a roles array.",
      "Fehler beim Laden der Daten": "Error loading data",
      "Das Organigramm konnte nicht geladen werden.": "The organigram could not be loaded.",
      "Die Seite wurde direkt als Datei geöffnet. Der Browser erlaubt dann kein automatisches Laden von data/organigramm.json. Wähle die Datei einmal aus – sie bleibt danach in diesem Browser gespeichert.": "The page was opened directly as a file. The browser then does not allow loading data/organigramm.json automatically. Select the file once – it stays saved in this browser afterwards.",
      "Prüfe, ob die Datei data/organigramm.json vorhanden und gültig ist.": "Check whether the file data/organigramm.json exists and is valid.",
      "JSON-Datei auswählen": "Select JSON file",
      "Technischer Hinweis: {message}": "Technical note: {message}",
      "Drucken einrichten": "Print settings",
      "Umfang": "Scope",
      "Vollständig (mit Aufgaben und Details)": "Complete (with tasks and details)",
      "Aushang (oberste Ebenen, ohne Details)": "Notice board (top levels, without details)",

      // impressum.html
      "Impressum · Who Does What": "Legal notice · Who Does What",
      "Rechtliches": "Legal",
      "Impressum": "Legal notice",
      "Herkunft des Projekts": "Origin of the project",
      "Who Does What ist eine generische Webanwendung zur Darstellung von Organisations- und Kompetenzstrukturen. Der Quellcode ist öffentlich verfügbar unter": "Who Does What is a generic web application for displaying organizational and competence structures. The source code is publicly available at",
      "Live-Version:": "Live version:",
      "Lizenz": "License",
      "Copyright © 2026 tguetle. Dieses Projekt steht unter der": "Copyright © 2026 tguetle. This project is licensed under the",
      "(AGPL-3.0). Du darfst den Code kopieren, verändern und nutzen. Wenn du ihn veränderst und die veränderte Version weitergibst oder als Webdienst anbietest, musst du sie unter derselben Lizenz veröffentlichen und den Quellcode den Nutzern zugänglich machen.": "(AGPL-3.0). You may copy, modify and use the code. If you modify it and distribute the modified version or offer it as a web service, you must publish it under the same license and make the source code available to users.",
      "Den vollständigen Lizenztext findest du in der": "You can find the full license text in the",
      "Datei LICENSE": "LICENSE file",
      "Haftungsausschluss": "Disclaimer",
      "Die Inhalte dieser Seite wurden mit Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen. Die Organisationsdaten stammen von den jeweils verantwortlichen Stellen.": "The content of this page was prepared with care. No warranty is given for the accuracy, completeness or currency of the content. The organization data comes from the respective responsible bodies.",
      "Zurück zur Organigramm-Ansicht": "Back to organigram view",
    }
  }
};

const DEFAULT_LANGUAGE = "de";
const LANGUAGE_STORAGE_KEY = `who-does-what:${window.location.pathname}-language`;
let currentLanguage = DEFAULT_LANGUAGE;

function detectLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  return (
    [fromUrl, saved].find((code) => code && Object.hasOwn(LANGUAGES, code)) ||
    DEFAULT_LANGUAGE
  );
}

function getLocale() {
  return LANGUAGES[currentLanguage].locale;
}

// Übersetzt einen deutschen Originaltext; {name}-Platzhalter werden aus values gefüllt.
function t(text, values = {}) {
  const { messages } = LANGUAGES[currentLanguage];
  const translated = Object.hasOwn(messages, text) ? messages[text] : text;

  return translated.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : match
  );
}

function initLanguage() {
  currentLanguage = detectLanguage();
  document.documentElement.lang = currentLanguage;
  translateStaticDom();

  const select = document.getElementById("language-select");
  select.replaceChildren(
    ...Object.entries(LANGUAGES).map(
      ([code, { name }]) => new Option(name, code)
    )
  );
  select.value = currentLanguage;
  select.addEventListener("change", () => switchLanguage(select.value));

  document.querySelectorAll("a[data-keep-lang]").forEach((link) => {
    link.search = `?lang=${currentLanguage}`;
  });
}

// Reload instead of live switching: pickers and selects are built once during setup.
function switchLanguage(code) {
  const url = new URL(window.location.href);

  url.searchParams.set("lang", code);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  window.location.assign(url.href);
}

// Translates the texts and attributes that are already written in index.html.
function translateStaticDom() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    textNodes.push(node);
  }

  textNodes.forEach((node) => {
    const core = node.nodeValue.replace(/\s+/g, " ").trim();

    if (!core) {
      return;
    }

    const translated = t(core);

    if (translated !== core) {
      const leading = node.nodeValue.match(/^\s*/)[0];
      const trailing = node.nodeValue.match(/\s*$/)[0];
      node.nodeValue = leading + translated + trailing;
    }
  });

  document.querySelectorAll("[placeholder], [aria-label], [title]").forEach((element) => {
    ["placeholder", "aria-label", "title"].forEach((name) => {
      if (element.hasAttribute(name)) {
        element.setAttribute(name, t(element.getAttribute(name)));
      }
    });
  });
}
