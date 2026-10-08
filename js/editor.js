"use strict";

// People typed into a picker are only added to data.people when the dialog is saved.
const pendingPeople = new Map();
const pickers = {};
let editingPersonPhoto = "";
let editingOrganizationLogo = "";

function setupEditor() {
  const byId = (id) => document.getElementById(id);

  Object.assign(elements, {
    addRoleButton: byId("add-role-button"),
    addSectionButton: byId("add-section-button"),
    addPersonButton: byId("add-person-button"),

    roleDialog: byId("role-dialog"),
    roleForm: byId("role-form"),
    roleDialogTitle: byId("role-dialog-title"),
    roleId: byId("role-id"),
    roleSection: byId("role-section"),
    roleStatus: byId("role-status"),
    roleReportsTo: byId("role-reports-to"),
    roleTitle: byId("role-title"),
    rolePersonNote: byId("role-person-note"),
    roleAppointment: byId("role-appointment"),
    roleTermUntil: byId("role-term-until"),
    roleEmail: byId("role-email"),
    roleSpendingLimit: byId("role-spending-limit"),
    roleTasks: byId("role-tasks"),
    roleAutonomy: byId("role-autonomy"),
    roleApproval: byId("role-approval"),
    roleEffort: byId("role-effort"),
    roleSeeking: byId("role-seeking"),
    roleTopics: byId("role-topics"),
    roleNote: byId("role-note"),
    roleSource: byId("role-source"),

    sectionDialog: byId("section-dialog"),
    sectionForm: byId("section-form"),
    sectionDialogTitle: byId("section-dialog-title"),
    sectionId: byId("section-id"),
    sectionTitle: byId("section-title"),
    sectionIcon: byId("section-icon"),
    sectionType: byId("section-type"),
    sectionEmail: byId("section-email"),
    sectionBoardMember: byId("section-board-member"),
    sectionDescription: byId("section-description"),
    sectionDeleteButton: byId("section-delete-button"),
    sectionSubmitButton: byId("section-submit-button"),

    boardDialog: byId("board-dialog"),
    boardForm: byId("board-form"),
    boardDialogTitle: byId("board-dialog-title"),
    boardId: byId("board-id"),
    boardTitle: byId("board-title"),
    boardAppointment: byId("board-appointment"),
    boardTermUntil: byId("board-term-until"),
    boardEmail: byId("board-email"),
    boardSource: byId("board-source"),
    boardDeleteButton: byId("board-delete-button"),

    personDialog: byId("person-dialog"),
    personForm: byId("person-form"),
    personDialogTitle: byId("person-dialog-title"),
    personId: byId("person-id"),
    personName: byId("person-name"),
    personEmail: byId("person-email"),
    personPhone: byId("person-phone"),
    personPhoto: byId("person-photo"),
    personPhotoFile: byId("person-photo-file"),
    personPhotoPreview: byId("person-photo-preview"),
    personPhotoRemove: byId("person-photo-remove"),
    personConsent: byId("person-consent"),
    personNote: byId("person-note"),
    personFunctions: byId("person-functions"),
    personDeleteButton: byId("person-delete-button"),

    organizationButton: byId("organization-button"),
    organizationDialog: byId("organization-dialog"),
    organizationForm: byId("organization-form"),
    organizationName: byId("organization-name"),
    organizationVersion: byId("organization-version"),
    organizationRootTitle: byId("organization-root-title"),
    organizationRootDescription: byId("organization-root-description"),
    organizationBoardTitle: byId("organization-board-title"),
    organizationBoardDescription: byId("organization-board-description"),
    organizationTermBoardRole: byId("organization-term-board-role"),
    organizationTermPortfolio: byId("organization-term-portfolio"),
    organizationHasTopOrgan: byId("organization-has-top-organ"),
    organizationHasBoard: byId("organization-has-board"),
    organizationLogo: byId("organization-logo"),
    organizationLogoPreview: byId("organization-logo-preview"),
    organizationLogoFile: byId("organization-logo-file"),
    organizationLogoRemove: byId("organization-logo-remove")
  });

  pickers.rolePeople = createPersonPicker(
    byId("role-people-picker"),
    "Personen",
    true
  );
  pickers.roleDeputies = createPersonPicker(
    byId("role-deputy-picker"),
    "Stellvertretung"
  );
  pickers.boardPeople = createPersonPicker(
    byId("board-people-picker"),
    "Personen"
  );

  fillAppointmentSelect(elements.roleAppointment);
  fillAppointmentSelect(elements.boardAppointment);

  elements.roleDecisionSelects = {};

  DECISION_AREAS.forEach(([key, label]) => {
    const select = document.createElement("select");
    fillDecisionSelect(select);

    const wrapper = createElement("label", "", t(label));
    wrapper.append(select);
    byId("role-decisions").append(wrapper);
    elements.roleDecisionSelects[key] = select;
  });

  elements.addRoleButton.addEventListener("click", () => openRoleDialog());
  elements.addSectionButton.addEventListener("click", () =>
    openSectionDialog()
  );
  elements.addPersonButton.addEventListener("click", () => openPersonEditor());
  elements.organizationButton.addEventListener("click", openOrganizationDialog);

  elements.roleForm.addEventListener("submit", saveRole);
  elements.sectionForm.addEventListener("submit", saveSection);
  elements.boardForm.addEventListener("submit", saveBoardEntry);
  elements.personForm.addEventListener("submit", savePerson);
  elements.organizationForm.addEventListener("submit", saveOrganization);

  elements.roleSection.addEventListener("change", () => {
    populateReportsToSelect(elements.roleSection.value, elements.roleId.value);
  });

  elements.sectionDeleteButton.addEventListener("click", deleteSection);
  elements.boardDeleteButton.addEventListener("click", deleteBoardEntry);
  elements.personDeleteButton.addEventListener("click", deletePerson);

  elements.personName.addEventListener("input", updatePhotoPreview);
  elements.personPhoto.addEventListener("input", () => {
    editingPersonPhoto = elements.personPhoto.value.trim();
    updatePhotoPreview();
  });
  elements.personPhotoFile.addEventListener("change", handlePhotoUpload);
  elements.organizationLogo.addEventListener("input", () => {
    editingOrganizationLogo = elements.organizationLogo.value.trim();
    updateLogoPreview();
  });
  elements.organizationLogoFile.addEventListener("change", handleLogoUpload);
  elements.organizationLogoRemove.addEventListener("click", () => {
    editingOrganizationLogo = "";
    elements.organizationLogo.value = "";
    updateLogoPreview();
  });
  elements.personPhotoRemove.addEventListener("click", () => {
    editingPersonPhoto = "";
    elements.personPhoto.value = "";
    updatePhotoPreview();
  });
}

function fillAppointmentSelect(select, selected = select.value) {
  const options = [new Option(t("nicht angegeben"), "")];

  Object.entries(getAppointmentLabels()).forEach(([value, label]) => {
    if (isAppointmentAvailable(value) || value === selected) {
      options.push(new Option(label, value));
    }
  });

  select.replaceChildren(...options);
  select.value = selected;
}

function fillDecisionSelect(select, selected = select.value) {
  const labels = getDecisionLabels();
  const options = [
    new Option(t("nicht festgelegt"), ""),
    new Option(labels.self, "self")
  ];

  if (hasBoard() || selected === "board") {
    options.push(new Option(labels.board, "board"));
  }

  select.replaceChildren(...options);
  select.value = selected;
}

function refreshTermOptions() {
  if (!elements.roleAppointment) {
    return;
  }

  fillAppointmentSelect(elements.roleAppointment);
  fillAppointmentSelect(elements.boardAppointment);
  Object.values(elements.roleDecisionSelects).forEach((select) =>
    fillDecisionSelect(select)
  );
}

/* Personenauswahl */

function createPersonPicker(container, label, withLabels = false) {
  let selectedIds = [];
  let labels = {};
  let matches = [];
  let activeIndex = -1;

  const listId = `${container.id}-suggestions`;
  const chips = createElement("div", "picker-chips");
  const row = createElement("div", "picker-row");
  const input = createElement("input");
  const suggestions = createElement("ul", "picker-suggestions");

  input.type = "text";
  input.autocomplete = "off";
  input.placeholder = t("Name eingeben oder auswählen");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-label", t("{label}: Name eingeben oder auswählen", { label: t(label) }));

  suggestions.id = listId;
  suggestions.hidden = true;
  suggestions.setAttribute("role", "listbox");
  // Keeps the focus in the input so the click on a suggestion still counts.
  suggestions.addEventListener("mousedown", (event) => event.preventDefault());

  const renderChips = () => {
    chips.replaceChildren();

    selectedIds.forEach((id) => {
      const person = getPerson(id) || pendingPeople.get(id);

      if (!person) {
        return;
      }

      const chip = createElement("span", "picker-chip");
      chip.append(
        createAvatar(person, "avatar avatar-small"),
        createElement("span", "", person.name)
      );

      if (withLabels) {
        const labelInput = createElement("input", "picker-label");
        labelInput.type = "text";
        labelInput.placeholder = t("Funktion, z. B. Co-Trainer");
        labelInput.value = labels[id] || "";
        labelInput.setAttribute("aria-label", t("Funktion von {name}", { name: person.name }));
        labelInput.addEventListener("input", () => {
          labels[id] = labelInput.value.trim();
        });
        labelInput.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
          }
        });
        chip.append(labelInput);
      }

      chip.append(
        createActionButton(
          "×",
          () => {
            selectedIds = selectedIds.filter((candidate) => candidate !== id);
            renderChips();
          },
          t("{name} entfernen", { name: person.name }),
          "picker-remove"
        )
      );

      chips.append(chip);
    });
  };

  const closeSuggestions = () => {
    suggestions.hidden = true;
    activeIndex = -1;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  };

  const selectPerson = (person) => {
    if (!selectedIds.includes(person.id)) {
      selectedIds.push(person.id);
    }

    input.value = "";
    closeSuggestions();
    renderChips();
  };

  const addTypedPerson = () => {
    const name = input.value.trim();

    if (name) {
      selectPerson(findOrCreatePendingPerson(name));
    }
  };

  const renderSuggestions = () => {
    const query = normalize(input.value);
    const typed = input.value.trim();
    const candidates = [...data.people, ...pendingPeople.values()]
      .filter(
        (person) =>
          !selectedIds.includes(person.id) &&
          (!query || normalize(person.name).includes(query))
      )
      .sort(compareByLastName);

    matches = candidates.map((person) => ({
      text: person.name,
      choose: () => selectPerson(person)
    }));

    if (
      typed &&
      !candidates.some((person) => personKey(person.name) === personKey(typed))
    ) {
      matches.push({
        text: t("„{name}“ als neue Person anlegen", { name: typed }),
        choose: addTypedPerson,
        isNew: true
      });
    }

    suggestions.replaceChildren(
      ...matches.map((match, index) => {
        const option = createElement(
          "li",
          match.isNew ? "picker-option picker-option-new" : "picker-option",
          match.text
        );

        option.id = `${listId}-${index}`;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(index === activeIndex));
        option.addEventListener("click", match.choose);
        return option;
      })
    );

    suggestions.hidden = matches.length === 0;
    input.setAttribute("aria-expanded", String(!suggestions.hidden));

    if (activeIndex >= 0) {
      input.setAttribute("aria-activedescendant", `${listId}-${activeIndex}`);
      suggestions.children[activeIndex]?.scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  };

  input.addEventListener("focus", renderSuggestions);
  input.addEventListener("blur", closeSuggestions);
  input.addEventListener("input", () => {
    activeIndex = -1;
    renderSuggestions();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      renderSuggestions();

      if (matches.length > 0) {
        const step = event.key === "ArrowDown" ? 1 : -1;
        activeIndex = (activeIndex + step + matches.length) % matches.length;
        renderSuggestions();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();

      if (matches[activeIndex] && !suggestions.hidden) {
        matches[activeIndex].choose();
      } else {
        addTypedPerson();
      }
    } else if (event.key === "Escape" && !suggestions.hidden) {
      // Close only the suggestion list, not the whole dialog.
      event.preventDefault();
      closeSuggestions();
    }
  });

  row.append(input, createActionButton(t("Hinzufügen"), addTypedPerson));
  container.replaceChildren(chips, row, suggestions);

  return {
    get ids() {
      return [...selectedIds];
    },
    get labels() {
      return Object.fromEntries(
        selectedIds.filter((id) => labels[id]).map((id) => [id, labels[id]])
      );
    },
    set(ids, initialLabels) {
      selectedIds = [...(ids || [])];
      labels = { ...(initialLabels || {}) };
      input.value = "";
      renderChips();
    },
    commitInput: addTypedPerson
  };
}

function findOrCreatePendingPerson(name) {
  const key = personKey(name);
  const existing = [...data.people, ...pendingPeople.values()].find(
    (person) => personKey(person.name) === key
  );

  if (existing) {
    return existing;
  }

  const person = { id: createId("person"), name };
  pendingPeople.set(person.id, person);
  return person;
}

function commitPendingPeople(ids) {
  ids.forEach((id) => {
    if (pendingPeople.has(id) && !getPerson(id)) {
      data.people.push(pendingPeople.get(id));
    }
  });

  pendingPeople.clear();
}

// Drops empty values so the exported JSON stays readable.
function compact(object, keep = []) {
  const isEmpty = (value) =>
    value === "" ||
    value === null ||
    value === false ||
    (typeof value === "object" && Object.keys(value).length === 0);

  return Object.fromEntries(
    Object.entries(object).filter(
      ([key, value]) => keep.includes(key) || !isEmpty(value)
    )
  );
}

function readYear(input) {
  return input.value === "" ? null : Number(input.value);
}

/* Rollen */

function openRoleDialog(sectionId = "", roleId = "") {
  pendingPeople.clear();
  populateSectionSelect();

  const section = getSection(sectionId);
  const role = section?.roles.find((candidate) => candidate.id === roleId);
  const value = role || {};

  elements.roleForm.reset();
  elements.roleId.value = role ? role.id : "";
  elements.roleDialogTitle.textContent = role
    ? t("Rolle bearbeiten")
    : t("Neue Rolle hinzufügen");

  if (section) {
    elements.roleSection.value = section.id;
  }

  populateReportsToSelect(elements.roleSection.value, value.id || "");

  elements.roleReportsTo.value = value.reportsTo || "";
  elements.roleStatus.value = value.status || "";
  elements.roleTitle.value = value.title || "";
  pickers.rolePeople.set(value.personIds, value.personLabels);
  pickers.roleDeputies.set(value.deputyIds);
  elements.rolePersonNote.value = value.personNote || "";
  fillAppointmentSelect(elements.roleAppointment, value.appointment || "");
  elements.roleTermUntil.value = value.termUntil || "";
  elements.roleEmail.value = value.email || "";
  elements.roleSpendingLimit.value = value.spendingLimit ?? "";
  elements.roleTasks.value = value.tasks || "";
  elements.roleAutonomy.value = value.autonomy || "";
  elements.roleApproval.value = value.approval || "";
  elements.roleEffort.value = value.effort || "";
  elements.roleSeeking.checked = Boolean(value.seeking);
  elements.roleTopics.value = (value.topics || []).join("\n");
  elements.roleNote.value = value.note || "";
  elements.roleSource.value = value.source || "";

  DECISION_AREAS.forEach(([key]) => {
    fillDecisionSelect(
      elements.roleDecisionSelects[key],
      value.decisions?.[key] || ""
    );
  });

  showDialog(elements.roleDialog);
  elements.roleTitle.focus();
}

function populateSectionSelect() {
  elements.roleSection.replaceChildren(
    ...data.sections.map(
      (section) => new Option(getSectionLabel(section), section.id)
    )
  );
}

function populateReportsToSelect(sectionId, roleId) {
  const section = getSection(sectionId);

  // A role must not report to itself or to one of its own subordinates.
  const excluded = new Set(roleId ? [roleId] : []);
  let added = true;

  while (added) {
    added = false;

    section?.roles.forEach((role) => {
      if (!excluded.has(role.id) && excluded.has(role.reportsTo)) {
        excluded.add(role.id);
        added = true;
      }
    });
  }

  elements.roleReportsTo.replaceChildren(
    new Option(t("Keine – oberste Ebene im Bereich"), "")
  );

  section?.roles.forEach((role) => {
    if (!excluded.has(role.id)) {
      elements.roleReportsTo.append(
        new Option(`${role.title} – ${getPersonLabel(role)}`, role.id)
      );
    }
  });
}

function saveRole(event) {
  event.preventDefault();

  const targetSection = getSection(elements.roleSection.value);

  if (!targetSection) {
    window.alert(t("Bitte zuerst einen Bereich anlegen."));
    return;
  }

  pickers.rolePeople.commitInput();
  pickers.roleDeputies.commitInput();

  const roleId = elements.roleId.value;
  const personIds = pickers.rolePeople.ids;
  const decisions = {};

  DECISION_AREAS.forEach(([key]) => {
    if (elements.roleDecisionSelects[key].value) {
      decisions[key] = elements.roleDecisionSelects[key].value;
    }
  });

  const roleData = compact(
    {
      id: roleId || createId("role"),
      title: elements.roleTitle.value.trim(),
      personIds,
      personLabels: pickers.rolePeople.labels,
      personNote: elements.rolePersonNote.value.trim(),
      deputyIds: pickers.roleDeputies.ids.filter(
        (id) => !personIds.includes(id)
      ),
      status: elements.roleStatus.value,
      reportsTo: elements.roleReportsTo.value,
      appointment: elements.roleAppointment.value,
      termUntil: readYear(elements.roleTermUntil),
      email: elements.roleEmail.value.trim(),
      spendingLimit:
        elements.roleSpendingLimit.value === ""
          ? null
          : Number(elements.roleSpendingLimit.value),
      tasks: elements.roleTasks.value.trim(),
      autonomy: elements.roleAutonomy.value.trim(),
      approval: elements.roleApproval.value.trim(),
      decisions,
      effort: elements.roleEffort.value.trim(),
      seeking: elements.roleSeeking.checked,
      topics: elements.roleTopics.value
        .split("\n")
        .map((topic) => topic.trim())
        .filter(Boolean),
      note: elements.roleNote.value.trim(),
      source: elements.roleSource.value.trim()
    },
    ["personIds"]
  );

  commitPendingPeople([...roleData.personIds, ...(roleData.deputyIds || [])]);

  const previous = roleId ? findRole(roleId) : null;

  if (previous?.section === targetSection) {
    targetSection.roles[targetSection.roles.indexOf(previous.role)] = roleData;
  } else {
    if (previous) {
      previous.section.roles.splice(
        previous.section.roles.indexOf(previous.role),
        1
      );
    }

    targetSection.roles.push(roleData);
  }

  persist();
  elements.roleDialog.close();
  render();
  showMessage(t("Rolle wurde gespeichert."));
}

function deleteRole(sectionId, roleId) {
  const section = getSection(sectionId);
  const role = section?.roles.find((candidate) => candidate.id === roleId);

  if (
    !role ||
    !window.confirm(t("Soll die Rolle „{title}“ wirklich gelöscht werden?", { title: role.title }))
  ) {
    return;
  }

  section.roles = section.roles.filter((candidate) => candidate !== role);

  elements.detailDialog.close();
  persist();
  render();
  showMessage(t("Rolle wurde gelöscht."));
}

function moveRole(sectionId, roleId, delta) {
  const roles = getSection(sectionId)?.roles || [];
  const index = roles.findIndex((role) => role.id === roleId);

  if (index === -1) {
    return;
  }

  // Swap with the next role on the same hierarchy level so the move is visible.
  const parentId = roles[index].reportsTo || "";
  let target = index + delta;

  while (roles[target] && (roles[target].reportsTo || "") !== parentId) {
    target += delta;
  }

  if (!roles[target]) {
    return;
  }

  [roles[index], roles[target]] = [roles[target], roles[index]];
  persist();
  render();
}

/* Bereiche */

function openSectionDialog(sectionId = "") {
  const section = getSection(sectionId);

  elements.sectionForm.reset();
  populateBoardSelect(elements.sectionBoardMember);
  elements.sectionType.querySelector('option[value="assembly"]').disabled =
    !hasTopOrgan();

  elements.sectionId.value = section?.id || "";
  elements.sectionDialogTitle.textContent = section
    ? t("Bereich bearbeiten")
    : t("Bereich anlegen");
  elements.sectionSubmitButton.textContent = section
    ? t("Speichern")
    : t("Bereich anlegen");
  elements.sectionDeleteButton.hidden = !section;

  if (section) {
    elements.sectionTitle.value = section.title || "";
    elements.sectionIcon.value = section.icon || "";
    elements.sectionType.value = section.type || "internal";
    elements.sectionEmail.value = section.email || "";
    elements.sectionBoardMember.value = section.boardMemberId || "";
    elements.sectionDescription.value = section.description || "";
  }

  showDialog(elements.sectionDialog);
  elements.sectionTitle.focus();
}

function populateBoardSelect(select) {
  select.replaceChildren(
    new Option(t("kein {portfolio} zugeordnet", { portfolio: getTerm("portfolio") }), ""),
    ...data.board.map(
      (entry) =>
        new Option(`${entry.title} – ${getPersonLabel(entry)}`, entry.id)
    )
  );
}

function saveSection(event) {
  event.preventDefault();

  const section = getSection(elements.sectionId.value);
  const values = {
    title: elements.sectionTitle.value.trim(),
    icon: elements.sectionIcon.value.trim(),
    type: elements.sectionType.value,
    description: elements.sectionDescription.value.trim(),
    email: elements.sectionEmail.value.trim(),
    boardMemberId: elements.sectionBoardMember.value
  };

  if (section) {
    Object.assign(section, values);
  } else {
    data.sections.push({ id: createId("section"), ...values, roles: [] });
  }

  persist();
  elements.sectionDialog.close();
  render();
  showMessage(section ? t("Bereich wurde gespeichert.") : t("Bereich wurde angelegt."));
}

function deleteSection() {
  const section = getSection(elements.sectionId.value);

  if (!section) {
    return;
  }

  const question =
    section.roles.length > 0
      ? t("Soll der Bereich „{title}“ mit {count} Rollen wirklich gelöscht werden?", { title: section.title, count: section.roles.length })
      : t("Soll der Bereich „{title}“ wirklich gelöscht werden?", { title: section.title });

  if (!window.confirm(question)) {
    return;
  }

  data.sections = data.sections.filter((candidate) => candidate !== section);

  persist();
  elements.sectionDialog.close();
  render();
  showMessage(t("Bereich wurde gelöscht."));
}

function moveSection(sectionId, delta) {
  const index = data.sections.findIndex((section) => section.id === sectionId);
  const target = index + delta;

  if (index === -1 || !data.sections[target]) {
    return;
  }

  [data.sections[index], data.sections[target]] = [
    data.sections[target],
    data.sections[index]
  ];

  persist();
  render();
}

/* Vorstand */

function openBoardDialog(entryId = "") {
  pendingPeople.clear();

  const entry = getBoardEntry(entryId);

  elements.boardForm.reset();
  elements.boardId.value = entry?.id || "";
  elements.boardDialogTitle.textContent = entry
    ? t("{boardRole} bearbeiten", { boardRole: getTerm("boardRole") })
    : t("Neu: {boardRole}", { boardRole: getTerm("boardRole") });
  elements.boardDeleteButton.hidden = !entry;

  elements.boardTitle.value = entry?.title || "";
  pickers.boardPeople.set(entry?.personIds);
  fillAppointmentSelect(elements.boardAppointment, entry?.appointment || "");
  elements.boardTermUntil.value = entry?.termUntil || "";
  elements.boardEmail.value = entry?.email || "";
  elements.boardSource.value = entry?.source || "";

  showDialog(elements.boardDialog);
  elements.boardTitle.focus();
}

function saveBoardEntry(event) {
  event.preventDefault();
  pickers.boardPeople.commitInput();

  const entryId = elements.boardId.value;
  const entryData = compact(
    {
      id: entryId || createId("board"),
      title: elements.boardTitle.value.trim(),
      personIds: pickers.boardPeople.ids,
      appointment: elements.boardAppointment.value,
      termUntil: readYear(elements.boardTermUntil),
      email: elements.boardEmail.value.trim(),
      source: elements.boardSource.value.trim()
    },
    ["personIds"]
  );

  commitPendingPeople(entryData.personIds);

  const index = data.board.findIndex((entry) => entry.id === entryId);

  if (index === -1) {
    data.board.push(entryData);
  } else {
    data.board[index] = entryData;
  }

  persist();
  elements.boardDialog.close();
  render();
  showMessage(t("{boardRole} wurde gespeichert.", { boardRole: getTerm("boardRole") }));
}

function deleteBoardEntry() {
  const entry = getBoardEntry(elements.boardId.value);

  if (
    !entry ||
    !window.confirm(
      t("Soll der Eintrag „{title}“ wirklich gelöscht werden?", { title: entry.title })
    )
  ) {
    return;
  }

  data.board = data.board.filter((candidate) => candidate !== entry);

  data.sections.forEach((section) => {
    if (section.boardMemberId === entry.id) {
      section.boardMemberId = "";
    }
  });

  persist();
  elements.boardDialog.close();
  render();
  showMessage(t("{boardRole} wurde gelöscht.", { boardRole: getTerm("boardRole") }));
}

/* Organisation */

function openOrganizationDialog() {
  const organization = data.organization;

  elements.organizationForm.reset();
  elements.organizationName.value = organization.name || "";
  elements.organizationVersion.value = organization.version || "";
  elements.organizationRootTitle.value = data.root.title || "";
  elements.organizationRootDescription.value = data.root.description || "";
  elements.organizationBoardTitle.value = organization.boardTitle || "";
  elements.organizationBoardDescription.value = organization.boardDescription || "";
  elements.organizationTermBoardRole.value = organization.terms?.boardRole || "";
  elements.organizationTermPortfolio.value = organization.terms?.portfolio || "";
  elements.organizationHasTopOrgan.value = String(hasTopOrgan());
  elements.organizationHasBoard.value = String(hasBoard());

  editingOrganizationLogo = organization.logo || "";
  elements.organizationLogo.value = editingOrganizationLogo.startsWith("data:")
    ? ""
    : editingOrganizationLogo;
  updateLogoPreview();

  showDialog(elements.organizationDialog);
  elements.organizationName.focus();
}

function updateLogoPreview() {
  const url = safeImageUrl(editingOrganizationLogo);
  const preview = elements.organizationLogoPreview;

  preview.hidden = !url;

  if (url) {
    preview.src = url;
  } else {
    preview.removeAttribute("src");
  }
}

async function handleLogoUpload() {
  const file = elements.organizationLogoFile.files?.[0];

  if (!file) {
    return;
  }

  try {
    editingOrganizationLogo = await resizeImage(file, 512, "image/png");
    elements.organizationLogo.value = "";
    updateLogoPreview();
  } catch (error) {
    console.error(error);
    window.alert(t("Das Logo konnte nicht gelesen werden."));
  } finally {
    elements.organizationLogoFile.value = "";
  }
}

function saveOrganization(event) {
  event.preventDefault();

  const organization = data.organization;

  organization.name = elements.organizationName.value.trim();
  setOptional(organization, "version", elements.organizationVersion.value.trim());
  setOptional(data.root, "title", elements.organizationRootTitle.value.trim());
  setOptional(data.root, "description", elements.organizationRootDescription.value.trim());
  setOptional(organization, "boardTitle", elements.organizationBoardTitle.value.trim());
  setOptional(organization, "boardDescription", elements.organizationBoardDescription.value.trim());
  setFlag(organization, "hasTopOrgan", elements.organizationHasTopOrgan.value === "true");
  setFlag(organization, "hasBoard", elements.organizationHasBoard.value === "true");

  const terms = {};
  setOptional(terms, "boardRole", elements.organizationTermBoardRole.value.trim());
  setOptional(terms, "portfolio", elements.organizationTermPortfolio.value.trim());
  setOptional(organization, "terms", Object.keys(terms).length > 0 ? terms : null);
  setOptional(organization, "logo", safeImageUrl(editingOrganizationLogo));

  persist();
  elements.organizationDialog.close();
  updateOrganizationName();
  render();
  showMessage(t("Organisation wurde gespeichert."));
}

function setOptional(object, key, value) {
  if (value) {
    object[key] = value;
  } else {
    delete object[key];
  }
}

function setFlag(object, key, enabled) {
  if (enabled) {
    delete object[key];
  } else {
    object[key] = false;
  }
}

/* Personen */

function openPersonEditor(personId = "") {
  const person = getPerson(personId);

  elements.personForm.reset();
  elements.personId.value = person?.id || "";
  elements.personDialogTitle.textContent = person
    ? t("Person bearbeiten")
    : t("Neue Person");
  elements.personDeleteButton.hidden = !person;

  elements.personName.value = person?.name || "";
  elements.personEmail.value = person?.email || "";
  elements.personPhone.value = person?.phone || "";
  elements.personConsent.checked = Boolean(person?.consent);
  elements.personNote.value = person?.note || "";

  editingPersonPhoto = person?.photo || "";
  elements.personPhoto.value = editingPersonPhoto.startsWith("data:")
    ? ""
    : editingPersonPhoto;
  updatePhotoPreview();

  const functions = person ? getFunctionsOfPerson(person.id) : [];

  elements.personFunctions.replaceChildren(
    functions.length > 0
      ? renderFunctionList(functions)
      : createElement(
          "p",
          "form-hint",
          t("Funktionen werden in der jeweiligen Rolle bzw. unter {boardRole} zugeordnet.", { boardRole: getTerm("boardRole") })
        )
  );

  showDialog(elements.personDialog);
  elements.personName.focus();
}

function updatePhotoPreview() {
  elements.personPhotoPreview.replaceChildren(
    createAvatar(
      { name: elements.personName.value, photo: editingPersonPhoto },
      "avatar avatar-large"
    )
  );
}

async function handlePhotoUpload() {
  const file = elements.personPhotoFile.files?.[0];

  if (!file) {
    return;
  }

  try {
    editingPersonPhoto = await resizeImage(file, 256);
    elements.personPhoto.value = "";
    updatePhotoPreview();
  } catch (error) {
    console.error(error);
    window.alert(t("Das Bild konnte nicht gelesen werden."));
  } finally {
    elements.personPhotoFile.value = "";
  }
}

async function resizeImage(file, maxSize, mimeType = "image/jpeg") {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL(mimeType, 0.85);
}

function savePerson(event) {
  event.preventDefault();

  const personId = elements.personId.value;
  const name = elements.personName.value.trim();
  const duplicate = data.people.find(
    (person) => person.id !== personId && personKey(person.name) === personKey(name)
  );

  if (
    duplicate &&
    !window.confirm(
      t("Es gibt bereits eine Person „{name}“. Trotzdem speichern?", { name: duplicate.name })
    )
  ) {
    return;
  }

  const personData = compact({
    id: personId || createId("person"),
    name,
    email: elements.personEmail.value.trim(),
    phone: elements.personPhone.value.trim(),
    photo: safeImageUrl(editingPersonPhoto),
    consent: elements.personConsent.checked,
    note: elements.personNote.value.trim()
  });

  const index = data.people.findIndex((person) => person.id === personId);

  if (index === -1) {
    data.people.push(personData);
  } else {
    data.people[index] = personData;
  }

  persist();
  elements.personDialog.close();
  render();
  showMessage(t("Person wurde gespeichert."));
}

function deletePerson() {
  const person = getPerson(elements.personId.value);

  if (!person) {
    return;
  }

  const count = getFunctionsOfPerson(person.id).length;
  const question =
    count > 0
      ? t("Soll „{name}“ gelöscht und aus {count} Funktionen entfernt werden?", { name: person.name, count })
      : t("Soll „{name}“ wirklich gelöscht werden?", { name: person.name });

  if (!window.confirm(question)) {
    return;
  }

  const removeFrom = (entry) => {
    entry.personIds = (entry.personIds || []).filter((id) => id !== person.id);

    if (entry.deputyIds) {
      entry.deputyIds = entry.deputyIds.filter((id) => id !== person.id);
    }

    if (entry.personLabels) {
      delete entry.personLabels[person.id];
    }
  };

  data.board.forEach(removeFrom);
  data.sections.forEach((section) => section.roles.forEach(removeFrom));
  data.people = data.people.filter((candidate) => candidate !== person);

  persist();
  elements.personDialog.close();
  render();
  showMessage(t("Person wurde gelöscht."));
}
