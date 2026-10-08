import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATUSES = ["official", "vacant", "unclear", "proposed", "external", "partner"];
const APPOINTMENTS = ["elected", "appointed", "informal", "external"];
const SECTION_TYPES = ["assembly", "internal", "partner"];
const DECISION_AREAS = ["budget", "contracts", "staff", "sport", "facility", "communication"];
const DECISION_VALUES = ["self", "board"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const examplesDir = path.join(root, "examples");
const files = [
  path.join(root, "data", "organigramm.json"),
  path.join(root, "data", "template.json"),
  ...(await readdir(examplesDir))
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(examplesDir, name)),
];

function assertEmail(value, where) {
  if (value === undefined) return;
  assert.match(value, EMAIL_PATTERN, `${where}: ungültige E-Mail "${value}"`);
}

function assertKnown(value, allowed, where) {
  if (value === undefined) return;
  assert.ok(allowed.includes(value), `${where}: unbekannter Wert "${value}"`);
}

function assertPersonRefs(ids, personIds, where) {
  if (ids === undefined) return;
  assert.ok(Array.isArray(ids), `${where}: muss ein Array sein`);
  for (const id of ids) {
    assert.ok(personIds.has(id), `${where}: unbekannte Person "${id}"`);
  }
}

function assertUnique(ids, where) {
  const seen = new Set();
  for (const id of ids) {
    assert.ok(!seen.has(id), `${where}: doppelte ID "${id}"`);
    seen.add(id);
  }
}

for (const file of files) {
  const label = path.relative(root, file);

  test(`${label} ist konsistent`, async () => {
    const data = JSON.parse(await readFile(file, "utf8"));

    assert.ok(data.organization?.name, "organization.name fehlt");
    if (data.organization.logo !== undefined) {
      assert.equal(typeof data.organization.logo, "string", "organization.logo muss ein Pfad oder eine Data-URL sein");
      if (!/^(data:|https?:)/i.test(data.organization.logo)) {
        assert.ok(existsSync(path.join(root, data.organization.logo)), `organization.logo: Datei fehlt (${data.organization.logo})`);
      }
    }
    if (data.organization.version !== undefined) {
      assert.match(data.organization.version, /^\d+\.\d+\.\d+$/, "organization.version muss x.y.z sein");
    }
    assert.ok(data.root?.title, "root.title fehlt");
    assert.ok(Array.isArray(data.board), "board muss ein Array sein");
    assert.ok(Array.isArray(data.sections), "sections muss ein Array sein");
    assert.ok(Array.isArray(data.people), "people muss ein Array sein");

    // People
    for (const person of data.people) {
      assert.ok(person.id && person.name, `Person ohne id/name: ${JSON.stringify(person)}`);
      assertEmail(person.email, `Person ${person.id}`);
      if (person.consent !== undefined) {
        assert.equal(typeof person.consent, "boolean", `Person ${person.id}: consent muss boolean sein`);
      }
    }
    assertUnique(data.people.map((p) => p.id), "people");
    const personIds = new Set(data.people.map((p) => p.id));

    // Board
    for (const entry of data.board) {
      assert.ok(entry.id && entry.title, `Vorstandseintrag ohne id/title: ${JSON.stringify(entry)}`);
      assertPersonRefs(entry.personIds, personIds, `Vorstand ${entry.id}`);
      assertEmail(entry.email, `Vorstand ${entry.id}`);
    }
    assertUnique(data.board.map((b) => b.id), "board");
    const boardIds = new Set(data.board.map((b) => b.id));

    // Sections and roles
    assertUnique(data.sections.map((s) => s.id), "sections");
    const roleIds = [];

    for (const section of data.sections) {
      const where = `Bereich ${section.id}`;
      assert.ok(section.id && section.title, `${where}: id/title fehlt`);
      assert.ok(Array.isArray(section.roles), `${where}: roles muss ein Array sein`);
      assertKnown(section.type, SECTION_TYPES, `${where} type`);
      assertEmail(section.email, where);

      if (section.boardMemberId !== undefined && section.boardMemberId !== "") {
        assert.ok(boardIds.has(section.boardMemberId), `${where}: unbekanntes boardMemberId "${section.boardMemberId}"`);
      }

      const sectionRoleIds = new Set(section.roles.map((r) => r.id));
      assertUnique(section.roles.map((r) => r.id), `${where} roles`);

      for (const role of section.roles) {
        const roleWhere = `Rolle ${role.id}`;
        assert.ok(role.id && role.title, `${roleWhere}: id/title fehlt`);
        roleIds.push(role.id);
        assertKnown(role.status, STATUSES, `${roleWhere} status`);
        assertKnown(role.appointment, APPOINTMENTS, `${roleWhere} appointment`);
        assertEmail(role.email, roleWhere);
        assertPersonRefs(role.personIds, personIds, roleWhere);
        assertPersonRefs(role.deputyIds, personIds, `${roleWhere} deputyIds`);

        if (role.personLabels !== undefined) {
          for (const id of Object.keys(role.personLabels)) {
            assert.ok(personIds.has(id), `${roleWhere}: personLabels verweist auf unbekannte Person "${id}"`);
          }
        }

        if (role.reportsTo !== undefined && role.reportsTo !== "") {
          assert.ok(
            sectionRoleIds.has(role.reportsTo),
            `${roleWhere}: reportsTo "${role.reportsTo}" muss eine Rolle im selben Bereich sein`,
          );
          assert.notEqual(role.reportsTo, role.id, `${roleWhere}: reportsTo verweist auf sich selbst`);
        }

        if (role.spendingLimit !== undefined) {
          assert.ok(Number.isFinite(role.spendingLimit) && role.spendingLimit >= 0, `${roleWhere}: spendingLimit ungültig`);
        }

        if (role.decisions !== undefined) {
          for (const [area, value] of Object.entries(role.decisions)) {
            assert.ok(DECISION_AREAS.includes(area), `${roleWhere}: unbekannter Entscheidungsbereich "${area}"`);
            assert.ok(DECISION_VALUES.includes(value), `${roleWhere}: unbekannter Entscheidungswert "${value}"`);
          }
        }
      }
    }

    assertUnique(roleIds, "Rollen-IDs (global)");
  });
}
