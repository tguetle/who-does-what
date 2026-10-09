"use strict";

const DATA_URL = "./data/organigramm.json";
const TEMPLATE_URL = "./data/template.json";
// The path keeps projects on one GitHub Pages domain apart.
const STORAGE_PREFIX = `who-does-what:${window.location.pathname}`;
const STORAGE_KEY = `${STORAGE_PREFIX}-v2`;
const BASE_HASH_KEY = `${STORAGE_PREFIX}-basis`;
// Decrypted data of an encrypted organigram lives only in this tab's sessionStorage.
const SESSION_KEY = `${STORAGE_PREFIX}-sitzung`;
const MIN_PASSPHRASE_LENGTH = 16;

// Presentation mode only – the JSON file itself stays publicly readable.
const INTERNAL_MODE = new URLSearchParams(window.location.search).has(
  "intern"
);

let data = null;
let showingLocalVersion = false;
let repositoryHash = "";
let encryptedSession = false;
let passphraseResolve = null;
let passphraseSetMode = false;
let currentView = "organigramm";
let statusFilter = "all";
let personSort = "count";
let personLayout = "cards";
let competenceMode = "table";

const VIEW_IDS = [
  "organigramm",
  "baum",
  "persons",
  "contacts",
  "join",
  "competencies",
  "risks"
];
const INTERNAL_VIEW_IDS = ["competencies", "risks"];

const STATUS_LABELS = {
  official: "Offiziell benannt",
  vacant: "Vakant",
  unclear: "Kompetenz unklar",
  proposed: "Vorschlag",
  external: "Extern",
  partner: "Partner"
};
const PUBLIC_STATUSES = ["vacant", "external", "partner"];
const STATUS_FILTERS = {
  all: null,
  action: ["vacant", "unclear", "proposed"],
  vacant: ["vacant"],
  unclear: ["unclear"],
  proposed: ["proposed"]
};

const DEFAULT_TERMS = {
  topOrgan: "Mitgliederversammlung",
  board: "Vorstand",
  boardRole: "Vorstandsamt",
  portfolio: "Ressort"
};

function getTerm(key) {
  if (key === "topOrgan") return data?.root?.title || t(DEFAULT_TERMS.topOrgan);
  if (key === "board") return data?.organization?.boardTitle || t(DEFAULT_TERMS.board);
  return data?.organization?.terms?.[key] || t(DEFAULT_TERMS[key]);
}

function hasTopOrgan() {
  return data?.organization?.hasTopOrgan !== false;
}

function hasBoard() {
  return data?.organization?.hasBoard !== false;
}

function isAssemblySection(section) {
  return section.type === "assembly" && hasTopOrgan();
}

function isAppointmentAvailable(value) {
  if (value === "elected") return hasTopOrgan();
  if (value === "appointed") return hasBoard();
  return true;
}

function fillTerms(template) {
  return template.replace(/\{(\w+)\}/g, (_, key) => getTerm(key));
}

function applyTerms() {
  document.querySelectorAll("[data-term-text]").forEach((element) => {
    element.textContent = fillTerms(t(element.dataset.termText));
  });
  document.querySelectorAll("[data-term-placeholder]").forEach((element) => {
    element.placeholder = fillTerms(t(element.dataset.termPlaceholder));
  });
  refreshTermOptions();
}

function getAppointmentLabels() {
  return {
    elected: t("Gewählt von: {topOrgan}", { topOrgan: getTerm("topOrgan") }),
    appointed: t("Berufen von: {board}", { board: getTerm("board") }),
    informal: t("Informell, ohne förmliche Bestellung"),
    external: t("Extern / vertraglich")
  };
}

const DECISION_AREAS = [
  ["budget", "Ausgaben"],
  ["contracts", "Verträge"],
  ["staff", "Trainer & Personal"],
  ["sport", "Spielbetrieb"],
  ["facility", "Anlage & Anschaffungen"],
  ["communication", "Öffentlichkeit"]
];
function getDecisionLabels() {
  return {
    self: t("Entscheidet selbst"),
    board: t("{board} stimmt zu", { board: getTerm("board") })
  };
}

const EMAIL_PATTERN = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const EMPTY_RESULT_TEXT =
  "Für Suche und Filter wurden keine passenden Einträge gefunden.";

const openRoleIds = new Set();
const elements = {};

document.addEventListener("DOMContentLoaded", init);

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

// js/build-info.js is written by the Pages workflow and stays null in local runs.
async function loadAppVersion() {
  const versionElement = document.getElementById("app-version");
  const buildElement = document.getElementById("app-build");
  const build = window.BUILD_INFO;

  if (build) {
    versionElement.textContent = build.version;
    buildElement.textContent = t("nicht getaggt");
    buildElement.hidden = build.tagged;
    return;
  }

  try {
    versionElement.textContent = (await fetchJson("./package.json")).version;
  } catch {
    versionElement.textContent = t("unbekannt");
  }

  buildElement.textContent = t("nicht getaggt (lokal)");
  buildElement.hidden = false;
}

async function init() {
  document.body.classList.toggle("is-internal", INTERNAL_MODE);
  initLanguage();
  loadAppVersion();
  cacheElements();
  bindEvents();
  setupEditor();
  elements.internalViewButton.hidden = INTERNAL_MODE;

  const hashView = window.location.hash.slice(1);

  if (isViewAvailable(hashView)) {
    currentView = hashView;
  }

  let repositoryData = null;
  let loadError = null;

  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        t("JSON-Datei konnte nicht geladen werden: HTTP {status}", { status: response.status })
      );
    }

    const repositoryText = await response.text();
    const repositoryValue = JSON.parse(repositoryText);

    if (isEncryptedEnvelope(repositoryValue)) {
      encryptedSession = true;
      repositoryHash = "";
      repositoryData =
        loadSessionData() || (await unlockEnvelope(repositoryValue));

      if (!repositoryData) {
        throw new Error(t("Das Organigramm wurde nicht entsperrt."));
      }
    } else {
      repositoryHash = hashText(repositoryText);
      repositoryData = prepareData(repositoryValue);
    }
  } catch (error) {
    console.error(error);
    loadError = error;
  }

  data = encryptedSession ? repositoryData : loadLocalData() || repositoryData;

  if (!data) {
    showLoadError(loadError);
    return;
  }

  render();
  updateStatus();
  updateOrganizationName();
  updateRepositoryWarning();

  if (loadError) {
    showMessage(
      t("Die Datei data/organigramm.json konnte nicht geladen werden – angezeigt wird die im Browser gespeicherte Version.")
    );
  }
}

function loadLocalData() {
  const locallySaved = localStorage.getItem(STORAGE_KEY);

  if (!locallySaved) {
    return null;
  }

  try {
    const value = prepareData(JSON.parse(locallySaved));
    showingLocalVersion = true;
    return value;
  } catch (error) {
    console.warn("Lokale Daten waren ungültig:", error);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BASE_HASH_KEY);
    return null;
  }
}

function loadSessionData() {
  const saved = sessionStorage.getItem(SESSION_KEY);

  if (!saved) {
    return null;
  }

  try {
    const value = prepareData(JSON.parse(saved));
    showingLocalVersion = true;
    return value;
  } catch (error) {
    console.warn("Sitzungsdaten waren ungültig:", error);
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function cacheElements() {
  const byId = (id) => document.getElementById(id);

  Object.assign(elements, {
    organigramm: byId("organigramm"),
    dataStatus: byId("data-status"),
    orgName: byId("org-name"),
    orgLogo: byId("org-logo"),
    printStatus: byId("print-status"),
    message: byId("message"),
    repositoryWarning: byId("repository-warning"),
    loadRepositoryButton: byId("load-repository-button"),
    dismissWarningButton: byId("dismiss-warning-button"),
    searchInput: byId("search-input"),
    viewButtons: document.querySelectorAll("[data-view]"),
    filterButtons: document.querySelectorAll("[data-filter]"),

    detailDialog: byId("detail-dialog"),
    detailTitle: byId("detail-title"),
    detailContent: byId("detail-content"),

    exportButton: byId("export-button"),
    encryptedExportButton: byId("encrypted-export-button"),
    importInput: byId("import-input"),
    passphraseDialog: byId("passphrase-dialog"),
    passphraseDialogTitle: byId("passphrase-dialog-title"),
    passphraseMessage: byId("passphrase-message"),
    passphraseForm: byId("passphrase-form"),
    passphraseInput: byId("passphrase-input"),
    passphraseConfirmField: byId("passphrase-confirm-field"),
    passphraseConfirm: byId("passphrase-confirm"),
    passphraseGenerateButton: byId("passphrase-generate-button"),
    printButton: byId("print-button"),
    printDialog: byId("print-dialog"),
    printForm: byId("print-form"),
    publicPreviewButton: byId("public-preview-button"),
    internalViewButton: byId("internal-view-button"),
    newOrganizationButton: byId("new-organization-button"),
    resetButton: byId("reset-button")
  });
}

function bindEvents() {
  elements.searchInput.addEventListener("input", render);

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.view;
      history.replaceState(null, "", `#${currentView}`);
      render();
    });
  });

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      statusFilter = button.dataset.filter;
      render();
    });
  });

  elements.exportButton.addEventListener("click", exportJSON);
  elements.encryptedExportButton.addEventListener("click", exportEncryptedJSON);
  elements.passphraseDialog.addEventListener("close", resolvePassphrase);
  elements.passphraseForm.addEventListener("submit", checkPassphraseMatch);
  elements.passphraseInput.addEventListener("input", clearPassphraseMismatch);
  elements.passphraseConfirm.addEventListener("input", clearPassphraseMismatch);
  elements.passphraseGenerateButton.addEventListener("click", fillGeneratedPassphrase);
  elements.importInput.addEventListener("change", importJSON);
  elements.printButton.addEventListener("click", () => showDialog(elements.printDialog));
  elements.printForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startPrint();
  });
  elements.resetButton.addEventListener("click", resetLocalData);
  elements.newOrganizationButton.addEventListener("click", createNewOrganization);
  elements.loadRepositoryButton.addEventListener("click", resetLocalData);

  elements.dismissWarningButton.addEventListener("click", () => {
    localStorage.setItem(BASE_HASH_KEY, repositoryHash);
    updateRepositoryWarning();
  });

  elements.publicPreviewButton.addEventListener("click", () => {
    window.location.assign(
      `${window.location.pathname}${window.location.hash}`
    );
  });

  elements.internalViewButton.addEventListener("click", () => {
    window.location.assign(
      `${window.location.pathname}?intern${window.location.hash}`
    );
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  // Print shows cards as they are on screen; the class lets the organigram be measured in its print layout.
  window.addEventListener("beforeprint", () => {
    document.documentElement.classList.add("is-printing");
    fitForPrint();
  });

  window.addEventListener("afterprint", () => {
    document.documentElement.classList.remove("is-printing", "print-poster");
    restorePrintSections();
    document.getElementById("print-page-style")?.remove();
    elements.organigramm.style.width = "";
    elements.organigramm.style.removeProperty("--print-zoom");
  });
}

function prepareData(value) {
  validateData(value);
  migrateLegacyData(value);

  value.people.forEach((person) => {
    if (!person.id || !person.name) {
      throw new Error(t("Jede Person benötigt „id“ und „name“."));
    }
  });

  return value;
}

// Older files stored people as free text in "person"; convert them into the people list.
function migrateLegacyData(value) {
  value.people ||= [];

  const peopleByKey = new Map(
    value.people.map((person) => [personKey(person.name), person])
  );

  const migrateEntry = (entry) => {
    if (typeof entry.person === "string" && !entry.personIds) {
      const people = parsePersons(entry.person);

      entry.personIds = people.map(({ name, label }) => {
        const key = personKey(name);

        if (!peopleByKey.has(key)) {
          const person = { id: createId("person"), name };
          value.people.push(person);
          peopleByKey.set(key, person);
        }

        const personId = peopleByKey.get(key).id;

        if (label) {
          entry.personLabels ||= {};
          entry.personLabels[personId] = label;
        }

        return personId;
      });

      if (people.length === 0) {
        entry.personNote = entry.person;
      }
    }

    delete entry.person;
    entry.personIds ||= [];
  };

  value.board.forEach(migrateEntry);
  value.sections.forEach((section) => section.roles.forEach(migrateEntry));
}

function parsePersons(text) {
  if (!text || /^(keine|vakant|externe?r?)\b/i.test(text.trim())) {
    return [];
  }

  // Segments like "Trainer: A, B; Co-Trainerin: C" give each name a label.
  return text.split(";").flatMap((segment) => {
    const match = segment.match(/^\s*([^:]+):\s*(.*)$/);
    const label = match ? match[1].trim() : "";

    return (match ? match[2] : segment)
      .split(",")
      .map((name) => ({ name: name.trim(), label }))
      .filter(({ name }) => name);
  });
}

function validateData(value) {
  if (!value || typeof value !== "object") {
    throw new Error(t("Die JSON-Wurzel muss ein Objekt sein."));
  }

  if (!value.organization || typeof value.organization !== "object") {
    throw new Error(t("Der Eintrag „organization“ fehlt."));
  }

  if (!value.root || typeof value.root !== "object") {
    throw new Error(t("Der Eintrag „root“ fehlt."));
  }

  if (!Array.isArray(value.board)) {
    throw new Error(t("Der Eintrag „board“ muss ein Array sein."));
  }

  if (!Array.isArray(value.sections)) {
    throw new Error(t("Der Eintrag „sections“ muss ein Array sein."));
  }

  if (value.people !== undefined && !Array.isArray(value.people)) {
    throw new Error(t("Der Eintrag „people“ muss ein Array sein."));
  }

  value.sections.forEach((section) => {
    if (!section.id || !section.title) {
      throw new Error(t("Jeder Bereich benötigt „id“ und „title“."));
    }

    if (!Array.isArray(section.roles)) {
      throw new Error(
        t("Der Bereich „{title}“ benötigt ein Rollen-Array.", { title: section.title })
      );
    }
  });
}

function render() {
  if (!data) {
    return;
  }

  applyTerms();

  const renderers = {
    organigramm: renderOrganigrammView,
    baum: renderTreeView,
    persons: renderPersonView,
    contacts: renderContactsView,
    join: renderJoinView,
    competencies: renderCompetenceView,
    risks: renderRiskView
  };

  updateControls();
  elements.organigramm.replaceChildren();
  renderers[currentView](normalize(elements.searchInput.value));
}

function isViewAvailable(view) {
  return (
    VIEW_IDS.includes(view) &&
    (INTERNAL_MODE || !INTERNAL_VIEW_IDS.includes(view))
  );
}

function updateControls() {
  const allRoles = data.sections.flatMap((section) => section.roles);

  elements.viewButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.view === currentView)
    );
  });

  elements.filterButtons.forEach((button) => {
    const statuses = STATUS_FILTERS[button.dataset.filter];
    const count = statuses
      ? allRoles.filter((role) => statuses.includes(role.status)).length
      : allRoles.length;

    button.setAttribute(
      "aria-pressed",
      String(button.dataset.filter === statusFilter)
    );
    button.querySelector(".chip-count").textContent = String(count);
  });
}

function isRoleVisible(role, query) {
  const statuses = STATUS_FILTERS[statusFilter];

  if (!INTERNAL_MODE && role.status === "proposed") {
    return false;
  }

  return (
    matchesQuery(role, query) &&
    (!statuses || statuses.includes(role.status))
  );
}

function getVisibleSections(query) {
  const filtering =
    Boolean(query) || statusFilter !== "all" || !INTERNAL_MODE;

  return data.sections
    .map((section) => ({
      section,
      roles: section.roles.filter((role) => isRoleVisible(role, query))
    }))
    .filter(({ roles }) => !filtering || roles.length > 0);
}

function matchesQuery(entry, query, includePeople = true) {
  if (!query) {
    return true;
  }

  const values = [entry.title, entry.tasks, ...(entry.topics || [])];

  if (includePeople) {
    values.push(
      getPersonLabel(entry),
      ...getPeople(entry.deputyIds).map((person) => person.name)
    );
  }

  if (INTERNAL_MODE) {
    values.push(
      entry.status,
      entry.autonomy,
      entry.approval,
      entry.note,
      entry.source
    );
  }

  return normalize(values.filter(Boolean).join(" ")).includes(query);
}

/* Datenzugriff */

function getSection(sectionId) {
  return data.sections.find((section) => section.id === sectionId);
}

function findRole(roleId) {
  for (const section of data.sections) {
    const role = section.roles.find((candidate) => candidate.id === roleId);

    if (role) {
      return { section, role };
    }
  }

  return null;
}

function getBoardEntry(entryId) {
  return data.board.find((entry) => entry.id === entryId);
}

function getPerson(personId) {
  return data.people.find((person) => person.id === personId);
}

function getPeople(personIds) {
  return (personIds || []).map(getPerson).filter(Boolean);
}

function getPersonLabel(entry) {
  const names = getPeople(entry.personIds).map((person) => {
    const label = entry.personLabels?.[person.id];
    return label ? `${person.name} (${label})` : person.name;
  });

  return names.length > 0
    ? names.join(", ")
    : entry.personNote || t("Keine Person benannt");
}

function getFunctionsOfPerson(personId) {
  const functions = [];

  data.board.forEach((entry) => {
    if ((entry.personIds || []).includes(personId)) {
      functions.push({ entry, section: null, deputy: false });
    }
  });

  data.sections.forEach((section) => {
    section.roles.forEach((role) => {
      if ((role.personIds || []).includes(personId)) {
        functions.push({
          entry: role,
          section,
          deputy: false,
          label: role.personLabels?.[personId] || ""
        });
      } else if ((role.deputyIds || []).includes(personId)) {
        functions.push({ entry: role, section, deputy: true });
      }
    });
  });

  return functions;
}

function getVisibleFunctions(personId) {
  return getFunctionsOfPerson(personId).filter(
    ({ entry, section }) =>
      INTERNAL_MODE || !section || entry.status !== "proposed"
  );
}

function getSectionLabel(section) {
  return `${section.icon || ""} ${section.title}`.trim();
}

function getContactEmail(role, section) {
  return role.email || section?.email || "";
}

function canShowPrivate(person) {
  return INTERNAL_MODE || person.consent === true;
}

function personKey(name) {
  return normalize(String(name || "").replace(/^(prof\.\s*)?(dr\.\s*)?/i, ""));
}

function compareByLastName(a, b) {
  const lastName = (person) => person.name.trim().split(/\s+/).pop();

  return (
    lastName(a).localeCompare(lastName(b), "de") ||
    a.name.localeCompare(b.name, "de")
  );
}

function formatAppointment(entry) {
  return [
    getAppointmentLabels()[entry.appointment],
    entry.termUntil ? t("Amtszeit bis {year}", { year: entry.termUntil }) : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

function formatEuro(value) {
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate || "")) {
    return t("unbekannt");
  }

  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(getLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  });
}

function createHeading(title, text) {
  const heading = createElement("div", "section-heading");
  heading.append(
    createElement("h2", "", title),
    createElement("p", "", text)
  );

  return heading;
}

function persist() {
  data.organization.updated = new Date().toISOString().slice(0, 10);

  try {
    if (encryptedSession) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error(error);
    showMessage(
      t("Lokales Speichern fehlgeschlagen – vermutlich ist der Speicher voll (z. B. durch viele Fotos). Bitte JSON herunterladen."),
      true
    );
    return;
  }

  // Remember which repository version the local edits are based on.
  if (!encryptedSession && !showingLocalVersion) {
    localStorage.setItem(BASE_HASH_KEY, repositoryHash);
  }

  showingLocalVersion = true;
  updateStatus();
}

function updateStatus() {
  const updated = data.organization.updated || t("unbekannt");

  elements.dataStatus.textContent = showingLocalVersion
    ? t("Lokale bearbeitete Version · Datenstand {updated}", { updated })
    : t("Version aus dem GitHub-Repository · Datenstand {updated}", { updated });

  const version = data.organization.version
    ? t(" · Version {version}", { version: data.organization.version })
    : "";

  elements.printStatus.textContent =
    t("Stand: {date}", { date: formatDate(data.organization.updated) }) + version;
}

function updateOrganizationName() {
  const name = data.organization?.name || "Who Does What";
  const version = data.organization?.version;

  elements.orgName.textContent = version ? t("{name} · Version {version}", { name, version }) : name;

  const logo = safeImageUrl(data.organization?.logo);
  elements.orgLogo.onerror = () => {
    elements.orgLogo.hidden = true;
  };
  elements.orgLogo.hidden = !logo;
  if (logo) {
    elements.orgLogo.src = logo;
    elements.orgLogo.alt = t("Logo von {name}", { name });
  }
  document.title = t("Who Does What – {name}", { name });
  document.querySelector('meta[name="description"]').content =
    t("Organisations- und Kompetenzstruktur von {name}", { name });
}

function updateRepositoryWarning() {
  elements.repositoryWarning.hidden =
    !showingLocalVersion ||
    !repositoryHash ||
    localStorage.getItem(BASE_HASH_KEY) === repositoryHash;
}

function exportJSON() {
  downloadText(JSON.stringify(data, null, 2), "organigramm.json");

  showMessage(
    t("JSON wurde heruntergeladen. Ersetze damit bei Bedarf data/organigramm.json im Repository.")
  );
}

async function exportEncryptedJSON() {
  const passphrase = await askPassphrase({
    title: t("Verschlüsselt exportieren"),
    message: t("Mindestens {length} Zeichen. Die Passphrase wird nicht in der Datei gespeichert und muss auf einem anderen Weg weitergegeben werden.", { length: MIN_PASSPHRASE_LENGTH }),
    confirm: true
  });

  if (passphrase === null) {
    return;
  }

  const envelope = await encryptData(data, passphrase);
  downloadText(JSON.stringify(envelope, null, 2), "organigramm.enc.json");

  showMessage(t("Verschlüsselte Datei wurde heruntergeladen."));
}

function downloadText(content, filename) {
  const blob = new Blob([content], {
    type: "application/json;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

async function importJSON(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    const value = JSON.parse(await file.text());
    const importedEncrypted = isEncryptedEnvelope(value);
    const importedData = importedEncrypted
      ? await unlockEnvelope(value)
      : prepareData(value);

    if (!importedData) {
      return;
    }

    data = importedData;
    encryptedSession = importedEncrypted;
    persist();
    render();
    updateOrganizationName();

    showMessage(t("JSON-Datei wurde erfolgreich importiert."));
  } catch (error) {
    console.error(error);
    showMessage(
      t("Import fehlgeschlagen: {message}", { message: error.message }),
      true
    );
  } finally {
    event.target.value = "";
  }
}

function resetLocalData() {
  const confirmed = window.confirm(
    t("Sollen alle lokal gespeicherten Änderungen verworfen und die JSON-Datei aus dem Repository neu geladen werden?")
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BASE_HASH_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

async function createNewOrganization() {
  const confirmed = window.confirm(
    t("Eine neue Organisation anlegen? Die aktuell angezeigte Version wird dabei ersetzt. Vorher ggf. JSON herunterladen.")
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${TEMPLATE_URL}?v=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(t("Vorlage konnte nicht geladen werden: HTTP {status}", { status: response.status }));
    }

    data = prepareData(await response.json());
    showingLocalVersion = true;
    localStorage.setItem(BASE_HASH_KEY, repositoryHash);
    persist();
    render();
    updateStatus();
    updateOrganizationName();
    updateRepositoryWarning();

    showMessage(t("Neue Organisation angelegt. Name, Version und Logo lassen sich über „Organisation bearbeiten“ ändern."));
  } catch (error) {
    console.error(error);
    showMessage(t("Anlegen fehlgeschlagen: {message}", { message: error.message }), true);
  }
}

// Cheap fingerprint to notice when the repository file changed.
function hashText(text) {
  let hash = 5381;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
    hash |= 0;
  }

  return String(hash >>> 0);
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function createId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function createElement(tagName, className = "", text = "") {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== "") {
    element.textContent = text;
  }

  return element;
}

function createActionButton(label, onClick, ariaLabel = "", className = "button") {
  const button = createElement("button", className, label);
  button.type = "button";

  if (ariaLabel) {
    button.setAttribute("aria-label", ariaLabel);
    button.title = ariaLabel;
  }

  button.addEventListener("click", onClick);
  return button;
}

function createMailLink(email) {
  const value = String(email || "").trim();

  if (!EMAIL_PATTERN.test(value)) {
    return null;
  }

  const link = createElement("a", "mail-link", value);
  link.href = `mailto:${value}`;
  return link;
}

function createPhoneLink(phone) {
  const value = String(phone || "").trim();
  const digits = value.replace(/[^\d+]/g, "");

  if (digits.length < 4) {
    return null;
  }

  const link = createElement("a", "phone-link", value);
  link.href = `tel:${digits}`;
  return link;
}

function safeImageUrl(url) {
  const value = String(url || "").trim();

  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Relative paths are fine; any other scheme (e.g. javascript:) is rejected.
  return value && !/^[a-z][a-z\d+.-]*:/i.test(value) ? value : "";
}

function createAvatar(person, className = "avatar") {
  const avatar = createElement("span", className);
  const photo = canShowPrivate(person) ? safeImageUrl(person.photo) : "";

  avatar.setAttribute("aria-hidden", "true");

  if (photo) {
    const image = document.createElement("img");
    image.src = photo;
    image.alt = "";
    image.loading = "lazy";
    avatar.append(image);
  } else {
    avatar.textContent = getInitials(person.name);
  }

  return avatar;
}

function getInitials(name) {
  const parts = String(name || "")
    .replace(/^(prof\.\s*)?(dr\.\s*)?/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const initials =
    (parts[0]?.[0] || "") + (parts.length > 1 ? parts.at(-1)[0] : "");

  return initials.toUpperCase() || "?";
}

// 10 mm margin per side in CSS px (96 dpi).
const PRINT_MARGIN_PX = (10 * 96) / 25.4;

function startPrint() {
  const data = new FormData(elements.printForm);
  const poster = data.get("print-scope") === "poster";

  document.documentElement.classList.toggle("print-poster", poster);

  elements.printDialog.close();
  window.print();
}

// @page cannot be set via classes, so the page size is injected as a style rule. Content size is given without margins.
function applyPrintPage(contentWidth, contentHeight) {
  let style = document.getElementById("print-page-style");

  if (!style) {
    style = document.createElement("style");
    style.id = "print-page-style";
    document.head.append(style);
  }

  const width = Math.ceil(contentWidth + 2 * PRINT_MARGIN_PX);
  const height = Math.ceil(contentHeight + 2 * PRINT_MARGIN_PX);
  style.textContent = `@page { size: ${width}px ${height}px; margin: 10mm; }`;
}

function showDialog(dialog) {
  if (!dialog.open) {
    dialog.showModal();
  }
}

// Resolves with the entered passphrase, or null if the dialog was cancelled.
function askPassphrase({ title, message, confirm = false }) {
  elements.passphraseDialogTitle.textContent = title;
  elements.passphraseMessage.textContent = message;
  elements.passphraseForm.reset();
  elements.passphraseDialog.returnValue = "";

  passphraseSetMode = confirm;
  elements.passphraseConfirmField.hidden = !confirm;
  elements.passphraseConfirm.required = confirm;
  elements.passphraseGenerateButton.hidden = !confirm;
  elements.passphraseInput.minLength = confirm ? MIN_PASSPHRASE_LENGTH : 0;
  // Shown in plain text when setting a passphrase, so a generated one can be noted down.
  elements.passphraseInput.type = confirm ? "text" : "password";
  elements.passphraseConfirm.type = elements.passphraseInput.type;

  return new Promise((resolve) => {
    passphraseResolve = resolve;
    showDialog(elements.passphraseDialog);
    elements.passphraseInput.focus();
  });
}

function resolvePassphrase() {
  const resolve = passphraseResolve;
  passphraseResolve = null;

  resolve?.(
    elements.passphraseDialog.returnValue === "ok"
      ? elements.passphraseInput.value
      : null
  );
}

function checkPassphraseMatch(event) {
  const mismatch =
    passphraseSetMode &&
    elements.passphraseInput.value !== elements.passphraseConfirm.value;

  if (mismatch) {
    event.preventDefault();
    elements.passphraseConfirm.setCustomValidity(
      t("Die Passphrasen stimmen nicht überein.")
    );
    elements.passphraseConfirm.reportValidity();
  }
}

function clearPassphraseMismatch() {
  elements.passphraseConfirm.setCustomValidity("");
}

function fillGeneratedPassphrase() {
  const passphrase = generatePassphrase();
  elements.passphraseInput.value = passphrase;
  elements.passphraseConfirm.value = passphrase;
}

// Asks for the passphrase until the envelope opens; null if the user gives up.
async function unlockEnvelope(envelope) {
  let message = t("Diese Datei ist verschlüsselt. Bitte die Passphrase eingeben.");

  for (;;) {
    const passphrase = await askPassphrase({
      title: t("Organigramm entsperren"),
      message
    });

    if (passphrase === null) {
      return null;
    }

    const value = await decryptData(envelope, passphrase);

    if (value) {
      return prepareData(value);
    }

    message = t("Passphrase falsch oder Datei beschädigt. Bitte erneut eingeben.");
  }
}

function showMessage(text, isError = false) {
  elements.message.textContent = text;
  elements.message.className = isError
    ? "message message-error"
    : "message";

  elements.message.hidden = false;

  window.clearTimeout(showMessage.timeout);

  showMessage.timeout = window.setTimeout(() => {
    elements.message.hidden = true;
  }, 5000);
}

function showLoadError(error) {
  elements.dataStatus.textContent = t("Fehler beim Laden der Daten");

  elements.organigramm.replaceChildren();

  const box = createElement("div", "message message-error");
  box.append(
    createElement(
      "strong",
      "",
      t("Das Organigramm konnte nicht geladen werden.")
    )
  );

  // Browsers block fetch() for pages opened directly from disk.
  if (window.location.protocol === "file:") {
    box.append(
      createElement(
        "p",
        "",
        t("Die Seite wurde direkt als Datei geöffnet. Der Browser erlaubt dann kein automatisches Laden von data/organigramm.json. Wähle die Datei einmal aus – sie bleibt danach in diesem Browser gespeichert.")
      )
    );
  } else {
    box.append(
      createElement(
        "p",
        "",
        t("Prüfe, ob die Datei data/organigramm.json vorhanden und gültig ist.")
      )
    );
  }

  const picker = createElement("label", "button file-button", t("JSON-Datei auswählen"));
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.addEventListener("change", importJSON);
  picker.append(input);

  box.append(
    picker,
    createElement("p", "", t("Technischer Hinweis: {message}", { message: error.message }))
  );

  elements.organigramm.append(box);
}