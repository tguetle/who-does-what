import { test, expect } from "@playwright/test";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoPath = path.join(root, "data", "organigramm.json");
const demoText = await readFile(demoPath, "utf8");
const demo = JSON.parse(demoText);
const examplesDir = path.join(root, "examples");
const exampleFiles = (await readdir(examplesDir))
  .filter((name) => name.endsWith(".json"))
  .map((name) => path.join(examplesDir, name));

const allRoles = demo.sections.flatMap((section) => section.roles);

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

test.describe("Start und Darstellung", () => {
  test("laedt ohne JavaScript-Fehler", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    await expect(page.locator("#organigramm")).not.toBeEmpty();

    expect(errors).toEqual([]);
  });

  test("zeigt den Organisationsnamen aus der JSON", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#org-name")).toContainText(demo.organization.name);
    await expect(page).toHaveTitle(new RegExp(demo.organization.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test("zeigt die Versionsnummer aus der JSON und die App-Version", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#org-name")).toContainText(`Version ${demo.organization.version}`);
    await expect(page.locator("#app-version")).toHaveText(/^\d+\.\d+\.\d+$/);
  });

  test("zeigt kein Logo, wenn keines in der JSON steht", async ({ page }) => {
    test.skip(!!demo.organization.logo, "Demo-JSON enthaelt ein Logo");

    await page.goto("/");

    await expect(page.locator("#org-logo")).toBeHidden();
  });

  test("zeigt ein Logo aus der JSON", async ({ page }) => {
    const json = structuredClone(demo);
    json.organization.logo =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    await page.goto("/?intern");
    await page.setInputFiles("#import-input", {
      name: "logo.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(json)),
    });

    await expect(page.locator("#org-logo")).toBeVisible();
    await expect(page.locator("#org-logo")).toHaveAttribute("src", json.organization.logo);
  });

  test("zeigt das Logo aus der Demo-JSON", async ({ page }) => {
    test.skip(!demo.organization.logo, "Demo-JSON ohne Logo");

    await page.goto("/");

    await expect(page.locator("#org-logo")).toBeVisible();
    await expect
      .poll(() => page.locator("#org-logo").evaluate((img) => img.naturalWidth))
      .toBeGreaterThan(0);
  });

  test("bearbeitet Name und Version im Organisations-Dialog", async ({ page }) => {
    await page.goto("/?intern");
    await page.click("#organization-button");
    await page.fill("#organization-name", "Testverein Musterdorf");
    await page.fill("#organization-version", "2.0.0");
    await page.click("#organization-submit-button");

    await expect(page.locator("#org-name")).toContainText("Testverein Musterdorf");
    await expect(page.locator("#org-name")).toContainText("Version 2.0.0");
  });

  test("oeffentliche Ansichten wechseln und rendern Inhalt", async ({ page }) => {
    await page.goto("/");

    for (const view of ["organigramm", "baum", "persons"]) {
      const button = page.locator(`[data-view="${view}"]`);
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("#organigramm")).not.toBeEmpty();
    }
  });

  test("Ansicht ueber Hash-Link wird geoeffnet", async ({ page }) => {
    await page.goto("/#persons");

    await expect(page.locator('[data-view="persons"]')).toHaveAttribute("aria-pressed", "true");
  });

  test("interne Ansichten sind oeffentlich ausgeblendet", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('[data-view="competencies"]')).toBeHidden();
    await expect(page.locator('[data-view="risks"]')).toBeHidden();
  });

  test("interne Ansichten sind mit ?intern sichtbar", async ({ page }) => {
    await page.goto("/?intern");

    await expect(page.locator('[data-view="competencies"]')).toBeVisible();
    await expect(page.locator('[data-view="risks"]')).toBeVisible();
  });
});

test.describe("Suche", () => {
  test("filtert und zeigt leeren Hinweis bei keinem Treffer", async ({ page }) => {
    await page.goto("/");

    await page.fill("#search-input", "zzz-kein-treffer-zzz");
    await expect(page.locator("#organigramm")).toContainText("keine passenden Einträge gefunden");
  });

  test("findet eine vorhandene Rolle", async ({ page }) => {
    const role = allRoles.find((r) => r.status !== "proposed");
    test.skip(!role, "keine oeffentlich sichtbare Rolle in den Daten");

    await page.goto("/");
    await page.fill("#search-input", role.title);

    await expect(page.locator("#organigramm")).toContainText(role.title);
  });
});

test.describe("Datenschutz im oeffentlichen Modus", () => {
  test("E-Mail ohne Einwilligung wird nicht angezeigt", async ({ page }) => {
    const hiddenCandidates = demo.people.filter(
      (person) =>
        person.consent !== true &&
        person.email &&
        countOccurrences(demoText, person.email) === 1,
    );
    test.skip(hiddenCandidates.length === 0, "keine Person ohne Einwilligung mit eindeutiger E-Mail");

    await page.goto("/");
    await page.locator('[data-view="persons"]').click();

    for (const person of hiddenCandidates) {
      await expect(page.locator("body")).not.toContainText(person.email);
    }
  });
});

test.describe("Import", () => {
  for (const file of exampleFiles) {
    const name = path.basename(file);

    test(`importiert ${name}`, async ({ page }) => {
      const json = JSON.parse(await readFile(file, "utf8"));

      await page.goto("/?intern");
      await page.setInputFiles("#import-input", file);

      await expect(page.locator("#org-name")).toContainText(json.organization.name);
      await expect(page.locator("#message")).toBeVisible();
      await expect(page.locator("#message")).not.toHaveClass(/message-error/);
      await expect(page.locator("#organigramm")).not.toBeEmpty();
    });
  }

  test("lehnt ungueltige JSON-Datei ab", async ({ page }) => {
    await page.goto("/?intern");
    await page.setInputFiles("#import-input", {
      name: "kaputt.json",
      mimeType: "application/json",
      buffer: Buffer.from("{ das ist kein json"),
    });

    await expect(page.locator("#message")).toBeVisible();
    await expect(page.locator("#message")).toHaveClass(/message-error/);
  });
});
