"use strict";

const SECTION_CLASSES = {
  partner: "org-section partner-section",
  assembly: "org-section assembly-section"
};

/* Organigramm (Karten) */

function renderOrganigrammView(query) {
  const sections = getVisibleSections(query);
  const assemblySections = sections.filter(({ section }) =>
    isAssemblySection(section)
  );
  const showRoot =
    hasTopOrgan() &&
    (INTERNAL_MODE ||
      Boolean(data.root.title || data.root.description) ||
      assemblySections.length > 0);
  const showBoard =
    hasBoard() &&
    (INTERNAL_MODE ||
      data.board.length > 0 ||
      Boolean(data.organization.boardTitle));

  if (showRoot) {
    renderRoot(assemblySections);
    renderConnector();
  }

  if (showBoard) {
    renderBoard(query);
    renderConnector();
  }

  renderSections(
    sections.filter(({ section }) => !isAssemblySection(section)),
    sections.length === 0
  );
}

function renderRoot(assemblySections) {
  const level = createElement("div", "root-level");
  const column = createElement("div", "root-column");
  const card = createElement("article", "root-card");

  card.append(
    createElement("h2", "", data.root.title || getTerm("topOrgan")),
    createElement("p", "", data.root.description || "")
  );

  if (INTERNAL_MODE) {
    card.append(
      createActionButton(
        t("Bearbeiten"),
        openOrganizationDialog,
        t("{topOrgan} bearbeiten", { topOrgan: getTerm("topOrgan") }),
        "link-button board-edit"
      )
    );
  }

  column.append(card, createElement("div", "line-fill"));
  level.append(column);

  if (assemblySections.length > 0) {
    const group = createElement("div", "assembly-group");

    assemblySections.forEach(({ section, roles }) => {
      group.append(renderSection(section, roles));
    });

    level.append(group);
  }

  elements.organigramm.append(level);
}

function renderConnector() {
  elements.organigramm.append(createElement("div", "vertical-connector"));
}

function renderBoard(query) {
  const level = createElement("section", "board-level");
  const heading = createElement("div", "level-heading");

  heading.append(
    createElement("h2", "", data.organization.boardTitle || getTerm("board")),
    createElement(
      "p",
      "",
      data.organization.boardDescription ||
        t("Gesamtverantwortung, Ziele, Rahmenbedingungen und Budgets")
    )
  );

  const boardGrid = createElement("div", "board-grid");
  const boardEntries = data.board.filter((entry) =>
    matchesQuery(entry, query)
  );

  boardEntries.forEach((entry) => {
    boardGrid.append(renderBoardCard(entry));
  });

  if (boardEntries.length === 0) {
    boardGrid.append(
      createElement(
        "p",
        "empty-section",
        t("Keine Treffer in „{board}“.", { board: getTerm("board") })
      )
    );
  }

  level.append(heading, boardGrid);

  if (INTERNAL_MODE) {
    const actions = createElement("div", "board-actions");
    actions.append(
      createActionButton(
        t("+ {boardRole}", { boardRole: getTerm("boardRole") }),
        () => openBoardDialog()
      ),
      createActionButton(t("Titel und Texte bearbeiten"), openOrganizationDialog)
    );
    level.append(actions);
  }

  elements.organigramm.append(level);
}

function renderBoardCard(entry) {
  const card = createElement("article", "board-card");

  card.append(
    createElement("div", "role-title", entry.title || ""),
    renderPersonNames(entry, "person-name")
  );

  const appointment = formatAppointment(entry);

  if (appointment) {
    card.append(createElement("div", "board-meta", appointment));
  }

  const ressorts = data.sections.filter(
    (section) => section.boardMemberId === entry.id
  );

  if (ressorts.length > 0) {
    card.append(
      createElement(
        "div",
        "board-meta",
        t("{portfolio}: {sections}", {
          portfolio: getTerm("portfolio"),
          sections: ressorts.map((section) => getSectionLabel(section)).join(", ")
        })
      )
    );
  }

  const mail = createMailLink(entry.email);

  if (mail) {
    card.append(mail);
  }

  if (INTERNAL_MODE) {
    card.append(
      createActionButton(
        t("Bearbeiten"),
        () => openBoardDialog(entry.id),
        t("{title} bearbeiten", { title: entry.title }),
        "link-button board-edit"
      )
    );
  }

  return card;
}

function renderSections(sections, showEmpty) {
  const wrapper = createElement("section", "sections-level");
  const grid = createElement("div", "sections-grid");

  sections.forEach(({ section, roles }) => {
    grid.append(renderSection(section, roles));
  });

  if (showEmpty) {
    grid.append(createElement("p", "empty-section", t(EMPTY_RESULT_TEXT)));
  }

  wrapper.append(
    createHeading(
      t("Verantwortungsbereiche und Abteilungen"),
      t("Operative Verantwortung innerhalb der Rahmenbedingungen von „{board}“", { board: getTerm("board") })
    ),
    grid
  );

  if (INTERNAL_MODE) {
    const actions = createElement("div", "sections-actions");
    actions.append(createActionButton(t("+ Bereich"), () => openSectionDialog()));
    wrapper.append(actions);
  }

  elements.organigramm.append(wrapper);
}

function renderSection(section, roles) {
  const sectionElement = createElement(
    "section",
    SECTION_CLASSES[section.type] || "org-section"
  );

  sectionElement.dataset.sectionId = section.id;

  const header = createElement("header", "org-section-header");
  const headingWrapper = createElement("div");

  headingWrapper.append(createElement("h3", "", getSectionLabel(section)));

  if (section.description) {
    headingWrapper.append(createElement("p", "", section.description));
  }

  const meta = renderSectionMeta(section);

  if (meta) {
    headingWrapper.append(meta);
  }

  if (INTERNAL_MODE) {
    const actions = createElement("div", "section-actions");
    actions.append(
      createActionButton(t("Bearbeiten"), () => openSectionDialog(section.id)),
      createActionButton(t("+ Rolle"), () => openRoleDialog(section.id)),
      createActionButton(
        "↑",
        () => moveSection(section.id, -1),
        t("Bereich nach oben")
      ),
      createActionButton(
        "↓",
        () => moveSection(section.id, 1),
        t("Bereich nach unten")
      )
    );
    headingWrapper.append(actions);
  }

  header.append(
    headingWrapper,
    createElement("span", "section-count", String(roles.length))
  );

  const roleList = createElement("div", "role-list");

  if (roles.length === 0) {
    roleList.append(
      createElement(
        "div",
        "empty-section",
        t("In diesem Bereich sind noch keine Rollen eingetragen.")
      )
    );
  } else {
    appendRoleTree(roleList, roles, (role) => renderRoleCard(section, role));
  }

  sectionElement.append(header, roleList);
  return sectionElement;
}

function renderSectionMeta(section) {
  const meta = createElement("div", "section-meta");
  const isInternalSection = !section.type || section.type === "internal";
  const ressort = getBoardEntry(section.boardMemberId);

  if (ressort) {
    meta.append(
      createElement(
        "span",
        "",
        t("{portfolio}: {title} ({person})", {
          portfolio: getTerm("portfolio"),
          title: ressort.title,
          person: getPersonLabel(ressort)
        })
      )
    );
  } else if (INTERNAL_MODE && isInternalSection) {
    meta.append(
      createElement(
        "span",
        "meta-missing",
        t("Kein {portfolio} zugeordnet", { portfolio: getTerm("portfolio") })
      )
    );
  }

  const mail = createMailLink(section.email);

  if (mail) {
    meta.append(mail);
  } else if (INTERNAL_MODE && section.type !== "partner") {
    meta.append(createElement("span", "meta-missing", t("Keine E-Mail-Adresse")));
  }

  return meta.children.length > 0 ? meta : null;
}

function appendRoleTree(container, roles, renderItem) {
  const visibleIds = new Set(roles.map((role) => role.id));
  const childrenByParent = new Map();

  roles.forEach((role) => {
    // Roles whose superior is hidden (e.g. by search) move to the top level.
    const parentId =
      role.reportsTo !== role.id && visibleIds.has(role.reportsTo)
        ? role.reportsTo
        : "";

    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, []);
    }

    childrenByParent.get(parentId).push(role);
  });

  const appendLevel = (parent, parentId) => {
    (childrenByParent.get(parentId) || []).forEach((role) => {
      const node = createElement("div", "role-node");
      node.append(renderItem(role));

      if (childrenByParent.has(role.id)) {
        const subordinates = createElement("div", "role-subordinates");
        appendLevel(subordinates, role.id);
        node.append(subordinates);
      }

      parent.append(node);
    });
  };

  appendLevel(container, "");
}

function renderRoleCard(section, role) {
  const card = createElement("details", "role-card");
  card.dataset.status = role.status || "";
  card.dataset.roleId = role.id;
  card.open = openRoleIds.has(role.id);

  card.addEventListener("toggle", () => {
    if (card.open) {
      openRoleIds.add(role.id);
    } else {
      openRoleIds.delete(role.id);
    }
  });

  const topLine = createElement("summary", "role-topline");
  const titleWrapper = createElement("div", "role-heading");

  titleWrapper.append(
    createElement("h4", "role-title", role.title || t("Unbenannte Rolle")),
    createElement("div", "role-person", getPersonLabel(role))
  );

  topLine.append(titleWrapper);

  const badge = createStatusBadge(role.status);

  if (badge) {
    topLine.append(badge);
  }

  const body = renderRoleBody(section, role);

  if (body.length === 0) {
    card.classList.add("is-empty");
  }

  // When open, the body lists the (clickable) names, so the header hides them.
  if (getPeople(role.personIds).length > 0) {
    card.classList.add("has-people");
  }

  card.append(topLine, ...body);
  return card;
}

function renderRoleBody(section, role) {
  const parts = [];
  const facts = createElement("dl", "role-facts");

  if (getPeople(role.personIds).length > 0) {
    addFact(facts, t("Personen"), renderPersonNames(role));
  }

  if (getPeople(role.deputyIds).length > 0) {
    addFact(
      facts,
      t("Vertretung"),
      renderPersonNames({ personIds: role.deputyIds })
    );
  }

  addFact(facts, t("Bestellung"), formatAppointment(role));
  addFact(facts, t("Kontakt"), createMailLink(getContactEmail(role, section)));
  addFact(facts, t("Zeitaufwand"), role.effort);

  if (INTERNAL_MODE && role.spendingLimit) {
    addFact(
      facts,
      t("Freigabegrenze"),
      t("Ausgaben bis {amount} ohne {board}", {
        amount: formatEuro(role.spendingLimit),
        board: getTerm("board")
      })
    );
  }

  if (facts.children.length > 0) {
    parts.push(facts);
  }

  const details = createElement("div", "role-details");

  addDetailBox(details, t("Aufgaben"), role.tasks, "detail-tasks");

  if (INTERNAL_MODE) {
    addDetailBox(
      details,
      t("Darf selbst entscheiden"),
      role.autonomy,
      "detail-autonomy"
    );
    addDetailBox(
      details,
      t("{board} muss zustimmen bei", { board: getTerm("board") }),
      role.approval,
      "detail-approval"
    );
    addDetailBox(
      details,
      t("Entscheidungsbefugnisse"),
      formatDecisions(role),
      "detail-tasks"
    );
    addDetailBox(
      details,
      t("Organisatorischer Hinweis"),
      role.note,
      "detail-note"
    );
  }

  if (details.children.length > 0) {
    parts.push(details);
  }

  if (INTERNAL_MODE && role.source) {
    parts.push(
      createElement("div", "role-source", t("Quelle: {source}", { source: role.source }))
    );
  }

  if (INTERNAL_MODE) {
    const actions = createElement("div", "role-actions");
    actions.append(
      createActionButton(
        "↑",
        () => moveRole(section.id, role.id, -1),
        t("Rolle nach oben")
      ),
      createActionButton(
        "↓",
        () => moveRole(section.id, role.id, 1),
        t("Rolle nach unten")
      ),
      createActionButton(t("Bearbeiten"), () => {
        elements.detailDialog.close();
        openRoleDialog(section.id, role.id);
      }),
      createActionButton(
        t("Löschen"),
        () => deleteRole(section.id, role.id),
        "",
        "button button-danger"
      )
    );
    parts.push(actions);
  }

  return parts;
}

function addFact(list, label, value) {
  if (!value) {
    return;
  }

  const description = createElement("dd");
  description.append(value);
  list.append(createElement("dt", "", label), description);
}

function addDetailBox(parent, label, value, className) {
  if (!value) {
    return;
  }

  const box = createElement("div", `detail-box ${className}`);
  box.append(
    createElement("strong", "", label),
    createElement("span", "", value)
  );

  parent.append(box);
}

function formatDecisions(role) {
  const labels = getDecisionLabels();
  return DECISION_AREAS.filter(([key]) => labels[role.decisions?.[key]])
    .map(([key, label]) => `${label}: ${labels[role.decisions[key]]}`)
    .join(" · ");
}

function formatCount(count) {
  return count === 1 ? t("1 Funktion") : t("{count} Funktionen", { count });
}

function createStatusBadge(status) {
  if (!STATUS_LABELS[status]) {
    return null;
  }

  if (!INTERNAL_MODE && !PUBLIC_STATUSES.includes(status)) {
    return null;
  }

  return createElement("span", `badge badge-${status}`, t(STATUS_LABELS[status]));
}

function renderPersonNames(entry, className = "person-names") {
  const wrapper = createElement("div", className);
  const people = getPeople(entry.personIds);

  if (people.length === 0) {
    wrapper.append(getPersonLabel(entry));
    return wrapper;
  }

  people.forEach((person, index) => {
    if (index > 0) {
      wrapper.append(", ");
    }

    wrapper.append(
      createActionButton(
        person.name,
        () => openPersonDialog(person.id),
        "",
        "person-link"
      )
    );

    if (entry.personLabels?.[person.id]) {
      wrapper.append(` (${entry.personLabels[person.id]})`);
    }
  });

  return wrapper;
}

function renderFunctionList(functions) {
  const list = createElement("ul", "person-roles");

  functions.forEach(({ entry, section, deputy, label: personLabel }) => {
    const item = createElement("li");
    let open = null;

    if (section) {
      open = () => openDetailDialog(section, entry);
    } else if (INTERNAL_MODE) {
      open = () => openBoardDialog(entry.id);
    }

    const label = open
      ? createActionButton("", open, "", "person-role person-role-link")
      : createElement("div", "person-role");

    let title = entry.title || "";

    if (deputy) {
      title += ` (${t("Vertretung")})`;
    } else if (personLabel) {
      title += ` (${personLabel})`;
    }

    label.append(
      createElement("span", "person-role-title", title),
      createElement(
        "span",
        "person-role-context",
        section
          ? getSectionLabel(section)
          : data.organization.boardTitle || getTerm("board")
      )
    );

    item.append(label);

    if (section && entry.status !== "official") {
      const badge = createStatusBadge(entry.status);

      if (badge) {
        item.append(badge);
      }
    }

    list.append(item);
  });

  return list;
}

function openDetailDialog(section, role) {
  const meta = createElement("div", "detail-meta");

  if (getPeople(role.personIds).length === 0) {
    meta.append(createElement("span", "role-person", getPersonLabel(role)));
  }

  const badge = createStatusBadge(role.status);

  if (badge) {
    meta.append(badge);
  }

  elements.detailTitle.textContent = role.title || t("Unbenannte Rolle");
  elements.detailContent.replaceChildren(
    createElement("p", "detail-section", getSectionLabel(section)),
    meta,
    ...renderRoleBody(section, role)
  );

  showDialog(elements.detailDialog);
}

function openPersonDialog(personId) {
  if (INTERNAL_MODE) {
    elements.detailDialog.close();
    openPersonEditor(personId);
    return;
  }

  const person = getPerson(personId);

  if (!person) {
    return;
  }

  const profile = createElement("div", "person-profile");
  const info = createElement("div", "person-profile-info");

  if (canShowPrivate(person)) {
    [createMailLink(person.email), createPhoneLink(person.phone)]
      .filter(Boolean)
      .forEach((link) => info.append(link));
  }

  info.append(renderFunctionList(getVisibleFunctions(person.id)));
  profile.append(createAvatar(person, "avatar avatar-large"), info);

  elements.detailTitle.textContent = person.name;
  elements.detailContent.replaceChildren(profile);
  showDialog(elements.detailDialog);
}

/* Baumansicht */

function renderTreeView(query) {
  const sections = getVisibleSections(query);
  const tree = createElement("div", "tree");
  const rootRow = createElement("div", "tree-root-row");
  const rootColumn = createElement("div", "root-column");
  const rootBox = createElement("div", "tree-box tree-root");

  rootBox.append(
    createElement("strong", "", data.root.title || getTerm("topOrgan"))
  );

  if (INTERNAL_MODE) {
    rootBox.append(
      createActionButton(
        t("Bearbeiten"),
        openOrganizationDialog,
        t("{topOrgan} bearbeiten", { topOrgan: getTerm("topOrgan") }),
        "link-button board-edit"
      )
    );
  }
  rootColumn.append(rootBox, createElement("div", "line-fill"));
  rootRow.append(rootColumn);

  const assembly = sections.filter(({ section }) => isAssemblySection(section));

  if (assembly.length > 0) {
    const group = createElement("div", "tree-assembly");

    assembly.forEach(({ section, roles }) => {
      group.append(...renderTreeBranch(section, roles));
    });

    rootRow.append(group);
  }

  const boardBox = createElement("div", "tree-box tree-board");
  const boardList = createElement("ul", "tree-board-list");

  data.board.forEach((entry) => {
    const item = createElement("li");
    item.append(
      createElement("span", "tree-role", entry.title || ""),
      createElement("span", "tree-person", getPersonLabel(entry))
    );
    boardList.append(item);
  });

  boardBox.append(
    createElement("strong", "", data.organization.boardTitle || getTerm("board")),
    boardList
  );

  if (INTERNAL_MODE) {
    boardBox.append(
      createActionButton(
        t("Bearbeiten"),
        openOrganizationDialog,
        t("{board} bearbeiten", { board: getTerm("board") }),
        "link-button board-edit"
      )
    );
  }

  const branches = createElement("ul", "tree-branches");

  sections
    .filter(({ section }) => !isAssemblySection(section))
    .forEach(({ section, roles }) => {
      const classes = ["tree-branch"];

      if (section.type === "partner") {
        classes.push("tree-branch-partner");
      }

      // Long role lists are split into two columns when printing.
      if (roles.length > 10) {
        classes.push("tree-branch-wide");
      }

      const branch = createElement("li", classes.join(" "));

      branch.append(...renderTreeBranch(section, roles));
      branches.append(branch);
    });

  if (hasTopOrgan()) {
    tree.append(rootRow, createElement("div", "tree-line"));
  }

  if (hasBoard()) {
    tree.append(boardBox);
  }

  if (branches.children.length > 0) {
    if (hasBoard()) {
      tree.append(createElement("div", "tree-line"));
    }
    tree.append(branches);
  } else if (sections.length === 0) {
    tree.append(createElement("p", "empty-section", t(EMPTY_RESULT_TEXT)));
  }

  if (INTERNAL_MODE) {
    const actions = createElement("div", "tree-actions");
    actions.append(createActionButton(t("+ Bereich"), () => openSectionDialog()));
    tree.append(actions);
  }

  elements.organigramm.append(tree);
}

function renderTreeBranch(section, roles) {
  const header = createElement("div", "tree-box tree-section");
  header.append(createElement("span", "", getSectionLabel(section)));

  const mail = createMailLink(section.email);

  if (mail) {
    header.append(mail);
  }

  const roleList = createElement("div", "tree-roles");

  appendRoleTree(roleList, roles, (role) => {
    const box = createActionButton(
      "",
      () => openDetailDialog(section, role),
      "",
      "tree-role-box"
    );

    box.dataset.status = role.status || "";
    box.append(
      createElement("span", "tree-role", role.title || t("Unbenannte Rolle")),
      createElement("span", "tree-person", getPersonLabel(role))
    );

    return box;
  });

  return [header, roleList];
}

// Ressort cards in their screen order; kept so the screen layout can be restored after printing.
let printSections = null;

// Puts each Ressort into the currently shortest column and returns the tallest column height.
function layoutSectionsInColumns(grid, count) {
  printSections ??= { grid, items: [...grid.children] };

  const columns = Array.from({ length: count }, () => createElement("div", "print-column"));
  const heights = new Array(count).fill(0);
  grid.replaceChildren(...columns);
  grid.style.setProperty("--print-columns", count);

  printSections.items.forEach((item) => {
    const index = heights.indexOf(Math.min(...heights));
    columns[index].append(item);
    heights[index] = columns[index].getBoundingClientRect().height;
  });

  return Math.max(...heights);
}

// Picks the column count with the lowest tallest column, keeping columns wide enough to read.
function choosePrintColumns(grid) {
  const options = [2, 3, 4, 5, 6];
  const minColumnWidth = 200;
  const gridWidth = grid.getBoundingClientRect().width;
  let best = { count: 4, height: Infinity };

  options.forEach((count) => {
    const columnWidth = (gridWidth - (count - 1) * 8) / count;

    if (columnWidth < minColumnWidth) {
      return;
    }

    const height = layoutSectionsInColumns(grid, count);

    // Fewer columns win ties.
    if (height < best.height - 1) {
      best = { count, height };
    }
  });

  layoutSectionsInColumns(grid, best.count);
}

function restorePrintSections() {
  if (!printSections) {
    return;
  }

  printSections.grid.replaceChildren(...printSections.items);
  printSections.grid.style.removeProperty("--print-columns");
  printSections = null;
}

function fitForPrint() {
  const container = elements.organigramm;
  const tree = container.querySelector(".tree");

  // Measure in the 1040 px layout width.
  container.style.width = "1040px";
  container.style.setProperty("--print-zoom", "1");

  const sectionsGrid = container.querySelector(".sections-grid");

  if (sectionsGrid) {
    choosePrintColumns(sectionsGrid);
  }

  const width = tree
    ? tree.querySelector(".tree-branches")?.scrollWidth || tree.scrollWidth
    : container.scrollWidth;

  const zoom = Number(Math.min(1, 1040 / width).toFixed(2));
  container.style.setProperty("--print-zoom", zoom);

  // The page is as large as the zoomed diagram plus the header and legend above it.
  const contentWidth = Math.max(width, 1040) * zoom;
  const contentBottom = document.querySelector("main").getBoundingClientRect().bottom + window.scrollY;
  applyPrintPage(contentWidth, contentBottom);
}

/* Personen */

function renderPersonView(query) {
  const statuses = STATUS_FILTERS[statusFilter];

  const entries = data.people
    .map((person) => {
      const nameMatches = !query || normalize(person.name).includes(query);
      const functions = getVisibleFunctions(person.id).filter(
        ({ entry, section }) =>
          (!statuses || (section && statuses.includes(entry.status))) &&
          (nameMatches || matchesQuery(entry, query, false))
      );

      return { person, functions, nameMatches };
    })
    // People without any function are only listed internally so they can be cleaned up.
    .filter(
      ({ functions, nameMatches }) =>
        functions.length > 0 || (INTERNAL_MODE && !statuses && nameMatches)
    );

  const countOf = ({ functions }) =>
    functions.filter(({ deputy }) => !deputy).length;

  entries.sort((a, b) =>
    personSort === "name"
      ? compareByLastName(a.person, b.person)
      : countOf(b) - countOf(a) || compareByLastName(a.person, b.person)
  );

  const unassigned = getVisibleSections(query).flatMap(({ section, roles }) =>
    roles
      .filter((role) => getPeople(role.personIds).length === 0)
      .map((role) => ({ entry: role, section, deputy: false }))
  );

  const options = createElement("div", "view-options-row");
  options.append(
    createSegmented(
      "Darstellung",
      [
        ["cards", "Karten"],
        ["table", "Tabelle"]
      ],
      personLayout,
      (value) => {
        personLayout = value;
      }
    ),
    createSegmented(
      "Sortieren nach",
      [
        ["count", "Anzahl Funktionen"],
        ["name", "Nachname"]
      ],
      personSort,
      (value) => {
        personSort = value;
      }
    )
  );

  let content;

  if (entries.length === 0 && unassigned.length === 0) {
    content = createElement("p", "empty-section", t(EMPTY_RESULT_TEXT));
  } else if (personLayout === "table") {
    content = renderPersonTable(entries, unassigned);
  } else {
    content = renderPersonGrid(entries, unassigned);
  }

  const wrapper = createElement("section");
  wrapper.append(
    createHeading(
      t("Personen und Funktionen"),
      t("Alle Personen mit ihren Funktionen im Verein")
    ),
    options,
    content
  );

  elements.organigramm.append(wrapper);
}

function renderPersonGrid(entries, unassigned) {
  const grid = createElement("div", "person-grid");

  entries.forEach(({ person, functions }) => {
    grid.append(renderPersonCard(person, functions));
  });

  if (unassigned.length > 0) {
    const card = createElement("article", "person-card person-card-unassigned");
    const header = createElement("header", "person-header");

    header.append(
      createElement("h3", "", t("Ohne benannte Person")),
      createElement("span", "section-count", formatCount(unassigned.length))
    );

    card.append(header, renderFunctionList(unassigned));
    grid.append(card);
  }

  return grid;
}

function renderPersonTable(entries, unassigned) {
  const columns = [
    t("Person"),
    t("Funktionen"),
    t("Anzahl"),
    t("E-Mail"),
    t("Telefon")
  ];

  if (INTERNAL_MODE) {
    columns.push(t("Einwilligung"), t("Foto"), t("Notiz"));
  }

  const cell = (content, className = "") => {
    const element = createElement("td", className);

    if (content) {
      element.append(content);
    } else {
      element.append(createElement("span", "decision-none", "–"));
    }

    return element;
  };

  const headRow = createElement("tr");

  columns.forEach((label) => {
    const header = createElement("th", "", label);
    header.scope = "col";
    headRow.append(header);
  });

  const head = createElement("thead");
  const body = createElement("tbody");
  head.append(headRow);

  entries.forEach(({ person, functions }) => {
    const row = createElement("tr");
    const nameButton = createActionButton(
      "",
      () => openPersonDialog(person.id),
      "",
      "person-card-name"
    );

    nameButton.append(
      createAvatar(person, "avatar avatar-small"),
      createElement("span", "", person.name)
    );

    const showPrivate = canShowPrivate(person);

    row.append(
      cell(nameButton, "person-table-name"),
      cell(functions.length > 0 ? renderFunctionList(functions) : null),
      cell(
        String(functions.filter(({ deputy }) => !deputy).length),
        "number-cell"
      ),
      cell(showPrivate ? createMailLink(person.email) : null),
      cell(showPrivate ? createPhoneLink(person.phone) : null)
    );

    if (INTERNAL_MODE) {
      row.append(
        cell(person.consent ? t("Ja") : null, "number-cell"),
        cell(safeImageUrl(person.photo) ? t("Ja") : null, "number-cell"),
        cell(person.note || null)
      );
    }

    body.append(row);
  });

  if (unassigned.length > 0) {
    const row = createElement("tr", "person-table-unassigned");
    const filler = createElement("td");
    filler.colSpan = columns.length - 3;

    row.append(
      cell(t("Ohne benannte Person"), "person-table-name"),
      cell(renderFunctionList(unassigned)),
      cell(String(unassigned.length), "number-cell"),
      filler
    );

    body.append(row);
  }

  const table = createElement("table", "competence-table person-table");
  table.append(head, body);

  const wrapper = createElement("div", "table-scroll");
  wrapper.append(table);
  return wrapper;
}

function renderPersonCard(person, functions) {
  const card = createElement("article", "person-card");
  const header = createElement("header", "person-header");
  const heading = createElement("h3");
  const nameButton = createActionButton(
    "",
    () => openPersonDialog(person.id),
    "",
    "person-card-name"
  );

  nameButton.append(createAvatar(person), createElement("span", "", person.name));
  heading.append(nameButton);

  header.append(
    heading,
    createElement(
      "span",
      "section-count",
      formatCount(functions.filter(({ deputy }) => !deputy).length)
    )
  );

  card.append(header);

  if (canShowPrivate(person)) {
    const contact = createElement("div", "person-contact");

    [createMailLink(person.email), createPhoneLink(person.phone)]
      .filter(Boolean)
      .forEach((link) => contact.append(link));

    if (contact.children.length > 0) {
      card.append(contact);
    }
  }

  card.append(
    functions.length > 0
      ? renderFunctionList(functions)
      : createElement("p", "meta-missing", t("Keiner Funktion zugeordnet"))
  );

  return card;
}

function createSegmented(label, options, current, onSelect) {
  const container = createElement("div", "view-options");
  const group = createElement("div", "segmented");

  group.setAttribute("role", "group");
  group.setAttribute("aria-label", t(label));

  options.forEach(([value, text]) => {
    const button = createActionButton(
      t(text),
      () => {
        onSelect(value);
        render();
        elements.organigramm
          .querySelector(`[aria-label="${t(label)}"] [data-option="${value}"]`)
          ?.focus();
      },
      "",
      ""
    );

    button.dataset.option = value;
    button.setAttribute("aria-pressed", String(value === current));
    group.append(button);
  });

  container.append(createElement("span", "", t(label)), group);
  return container;
}

/* Wen frage ich? */

function renderContactsView(query) {
  const topics = [];

  data.sections.forEach((section) => {
    section.roles.forEach((role) => {
      if (!isRoleVisible(role, "")) {
        return;
      }

      (role.topics || []).forEach((topic) => {
        if (
          !query ||
          normalize(topic).includes(query) ||
          matchesQuery(role, query)
        ) {
          topics.push({ topic, role, section });
        }
      });
    });
  });

  topics.sort((a, b) => a.topic.localeCompare(b.topic, "de"));

  const grid = createElement("div", "contact-grid");

  topics.forEach(({ topic, role, section }) => {
    grid.append(renderContactCard(topic, role, section));
  });

  if (topics.length === 0) {
    grid.append(
      createElement(
        "p",
        "empty-section",
        query
          ? t(EMPTY_RESULT_TEXT)
          : t("Noch keine Themen hinterlegt – in der jeweiligen Rolle unter „Themen“ ergänzen.")
      )
    );
  }

  const wrapper = createElement("section");
  wrapper.append(
    createHeading(
      t("Wen frage ich?"),
      t("Die richtige Ansprechperson für häufige Anliegen")
    ),
    grid
  );

  elements.organigramm.append(wrapper);
}

function renderContactCard(topic, role, section) {
  const card = createElement("article", "contact-card");

  card.append(
    createElement("h3", "", topic),
    createActionButton(
      `${role.title} · ${getSectionLabel(section)}`,
      () => openDetailDialog(section, role),
      "",
      "link-button contact-role"
    )
  );

  const people = getPeople(role.personIds);

  if (people.length > 0) {
    const list = createElement("ul", "contact-people");

    people.forEach((person) => {
      const item = createElement("li");
      const chip = createActionButton(
        "",
        () => openPersonDialog(person.id),
        "",
        "person-chip"
      );

      chip.append(
        createAvatar(person, "avatar avatar-small"),
        createElement("span", "", person.name)
      );
      item.append(chip);

      if (canShowPrivate(person)) {
        [createMailLink(person.email), createPhoneLink(person.phone)]
          .filter(Boolean)
          .forEach((link) => item.append(link));
      }

      list.append(item);
    });

    card.append(list);
  } else {
    const ressort = getBoardEntry(section.boardMemberId);

    card.append(
      createElement(
        "p",
        "contact-fallback",
        ressort
          ? t("Derzeit nicht besetzt – bitte an {title} ({person}) wenden.", {
              title: ressort.title,
              person: getPersonLabel(ressort)
            })
          : t("Derzeit nicht besetzt – bitte an „{board}“ wenden.", { board: getTerm("board") })
      )
    );
  }

  const mail = createMailLink(getContactEmail(role, section));

  if (mail) {
    const row = createElement("p", "contact-mail");
    row.append(`${t("E-Mail")}: `, mail);
    card.append(row);
  }

  return card;
}

/* Mitmachen */

function renderJoinView(query) {
  const items = getVisibleSections(query).flatMap(({ section, roles }) =>
    roles
      .filter((role) => role.status === "vacant" || role.seeking)
      .map((role) => ({ section, role }))
  );

  const grid = createElement("div", "join-grid");

  items.forEach(({ section, role }) => {
    const card = createElement("article", "join-card");

    card.append(
      createElement(
        "span",
        "join-label",
        role.status === "vacant" ? t("Funktion unbesetzt") : t("Unterstützung gesucht")
      ),
      createElement("h3", "", role.title || ""),
      createElement("p", "join-section", getSectionLabel(section))
    );

    if (role.tasks) {
      card.append(createElement("p", "", role.tasks));
    }

    if (role.effort) {
      card.append(
        createElement("p", "join-effort", t("Zeitaufwand: {effort}", { effort: role.effort }))
      );
    }

    const contact = createElement("p", "join-contact");
    const mail = createMailLink(getContactEmail(role, section));
    const ressort = getBoardEntry(section.boardMemberId);

    if (mail) {
      contact.append(t("Interesse? Schreib an"), " ", mail);
    } else if (ressort) {
      contact.textContent = t("Interesse? Sprich {person} ({title}) an.", {
        person: getPersonLabel(ressort),
        title: ressort.title
      });
    } else {
      contact.textContent = t("Interesse? Wende dich an „{board}“.", { board: getTerm("board") });
    }

    card.append(
      contact,
      createActionButton(
        t("Details"),
        () => openDetailDialog(section, role),
        "",
        "link-button"
      )
    );

    grid.append(card);
  });

  if (items.length === 0) {
    grid.append(
      createElement(
        "p",
        "empty-section",
        query
          ? t(EMPTY_RESULT_TEXT)
          : t("Derzeit sind alle Funktionen besetzt. Wer mithelfen möchte, ist trotzdem jederzeit willkommen!")
      )
    );
  }

  const wrapper = createElement("section");
  wrapper.append(
    createHeading(
      t("Mitmachen"),
      t("Hier sucht der Verein derzeit Unterstützung")
    ),
    grid
  );

  elements.organigramm.append(wrapper);
}

/* Kompetenzen (intern) */

function renderCompetenceView(query) {
  const wrapper = createElement("section");
  const matrix = competenceMode === "matrix";

  wrapper.append(
    createHeading(
      t("Kompetenzübersicht"),
      t("Was darf jede Funktion selbst entscheiden – und wo muss „{board}“ zustimmen?", { board: getTerm("board") })
    ),
    createSegmented(
      "Darstellung",
      [
        ["table", "Tabelle"],
        ["matrix", "Freigabe-Matrix"]
      ],
      competenceMode,
      (value) => {
        competenceMode = value;
      }
    )
  );

  const sections = getVisibleSections(query);

  if (sections.length === 0) {
    wrapper.append(createElement("p", "empty-section", t(EMPTY_RESULT_TEXT)));
    elements.organigramm.append(wrapper);
    return;
  }

  const hasDecisions = sections.some(({ roles }) =>
    roles.some((role) => formatDecisions(role))
  );

  if (matrix && !hasDecisions) {
    wrapper.append(
      createElement(
        "p",
        "form-hint competence-hint",
        t("Noch keine Entscheidungsbefugnisse hinterlegt – in der jeweiligen Rolle unter „Entscheidungsbefugnisse“ pflegen.")
      )
    );
  }

  const columns = matrix
    ? [...DECISION_AREAS.map(([, label]) => t(label)), t("Freigabegrenze")]
    : [
        t("Darf selbst entscheiden"),
        t("{board} muss zustimmen bei", { board: getTerm("board") }),
        t("Freigabegrenze"),
        t("Hinweis")
      ];

  const table = createElement(
    "table",
    matrix ? "competence-table competence-matrix" : "competence-table"
  );
  const head = createElement("thead");
  const headRow = createElement("tr");

  [t("Funktion"), t("Person"), ...columns].forEach((label) => {
    const cell = createElement("th", "", label);
    cell.scope = "col";
    headRow.append(cell);
  });

  head.append(headRow);
  table.append(head);

  sections.forEach(({ section, roles }) => {
    const body = createElement("tbody");
    const sectionRow = createElement("tr", "competence-section");
    const sectionCell = createElement("th", "", getSectionLabel(section));

    sectionCell.colSpan = columns.length + 2;
    sectionCell.scope = "colgroup";
    sectionRow.append(sectionCell);
    body.append(sectionRow);

    const roleIds = new Set(section.roles.map((role) => role.id));

    roles.forEach((role) => {
      const row = createElement("tr");
      row.dataset.status = role.status || "";

      const isSubordinate =
        role.reportsTo !== role.id && roleIds.has(role.reportsTo);

      const titleCell = createElement(
        "td",
        isSubordinate ? "competence-role is-subordinate" : "competence-role"
      );

      titleCell.append(
        createActionButton(
          role.title || t("Unbenannte Rolle"),
          () => openDetailDialog(section, role),
          "",
          "link-button"
        )
      );

      if (role.status !== "official") {
        const badge = createStatusBadge(role.status);

        if (badge) {
          titleCell.append(badge);
        }
      }

      const limitCell = createElement(
        "td",
        "limit-cell",
        role.spendingLimit ? formatEuro(role.spendingLimit) : "–"
      );

      const cells = matrix
        ? [
            ...DECISION_AREAS.map(([key]) =>
              createDecisionCell(role.decisions?.[key])
            ),
            limitCell
          ]
        : [
            createElement(
              "td",
              role.autonomy ? "" : "competence-missing",
              role.autonomy || t("nicht geregelt")
            ),
            createElement(
              "td",
              role.approval ? "" : "competence-missing",
              role.approval || t("nicht geregelt")
            ),
            limitCell,
            createElement("td", "competence-note", role.note || "")
          ];

      row.append(
        titleCell,
        createElement("td", "", getPersonLabel(role)),
        ...cells
      );

      body.append(row);
    });

    table.append(body);
  });

  const tableWrapper = createElement("div", "table-scroll");
  tableWrapper.append(table);
  wrapper.append(tableWrapper);

  elements.organigramm.append(wrapper);
}

function createDecisionCell(value) {
  const cell = createElement("td", "decision-cell");

  if (value === "self") {
    cell.append(createElement("span", "decision decision-self", t("selbst")));
  } else if (value === "board") {
    cell.append(createElement("span", "decision decision-board", getTerm("board")));
  } else {
    cell.append(createElement("span", "decision-none", "–"));
  }

  return cell;
}

/* Risiken (intern) */

function renderRiskView(query) {
  const roles = getVisibleSections(query).flatMap(({ section, roles }) =>
    roles.map((role) => ({ section, role }))
  );
  const latestYear = new Date().getFullYear() + 1;

  const busyPeople = data.people
    .map((person) => ({
      person,
      count: getFunctionsOfPerson(person.id).filter(({ deputy }) => !deputy)
        .length
    }))
    .filter(({ count }) => count >= 3)
    .sort((a, b) => b.count - a.count);

  const withoutPerson = roles.filter(
    ({ role }) => getPeople(role.personIds).length === 0
  );

  const withoutDeputy = roles.filter(
    ({ role }) =>
      getPeople(role.personIds).length === 1 &&
      getPeople(role.deputyIds).length === 0
  );

  const termsEnding = [
    ...data.board.map((entry) => ({ section: null, role: entry })),
    ...roles
  ].filter(({ role }) => role.termUntil && Number(role.termUntil) <= latestYear);

  const incompleteSections = data.sections
    .map((section) => {
      const missing = [];

      if (section.type !== "partner" && !section.email) {
        missing.push(t("E-Mail fehlt"));
      }

      if ((!section.type || section.type === "internal") && !section.boardMemberId) {
        missing.push(t("{portfolio} fehlt", { portfolio: getTerm("portfolio") }));
      }

      return { section, missing };
    })
    .filter(({ missing }) => missing.length > 0);

  const roleItem = ({ section, role }, suffix = "") =>
    createRiskItem(
      `${role.title}${suffix} · ${section ? getSectionLabel(section) : data.organization.boardTitle || getTerm("board")}`,
      () => (section ? openDetailDialog(section, role) : openBoardDialog(role.id))
    );

  const grid = createElement("div", "risk-grid");

  grid.append(
    renderRiskCard(
      t("Viele Funktionen bei einer Person"),
      t("Fällt die Person aus, sind mehrere Bereiche gleichzeitig betroffen."),
      busyPeople.map(({ person, count }) =>
        createRiskItem(t("{name} – {count} Funktionen", { name: person.name, count }), () =>
          openPersonDialog(person.id)
        )
      )
    ),
    renderRiskCard(
      t("Funktionen ohne benannte Person"),
      t("Hier ist unklar, wer die Aufgabe tatsächlich wahrnimmt."),
      withoutPerson.map((item) => roleItem(item))
    ),
    renderRiskCard(
      t("Ohne Stellvertretung"),
      t("Nur eine Person benannt und keine Vertretung eingetragen."),
      withoutDeputy.map((item) => roleItem(item))
    ),
    renderRiskCard(
      t("Amtszeit endet bald"),
      t("Amtszeit endet spätestens {year} – Nachfolge rechtzeitig planen.", { year: latestYear }),
      termsEnding.map((item) =>
        roleItem(item, ` ${t("(bis {year})", { year: item.role.termUntil })}`)
      )
    ),
    renderRiskCard(
      t("Bereiche mit fehlenden Angaben"),
      t("Ohne E-Mail-Adresse oder ohne zugeordnetes {portfolio}.", { portfolio: getTerm("portfolio") }),
      incompleteSections.map(({ section, missing }) =>
        createRiskItem(`${getSectionLabel(section)} – ${missing.join(", ")}`, () =>
          openSectionDialog(section.id)
        )
      )
    )
  );

  const wrapper = createElement("section");
  wrapper.append(
    createHeading(
      t("Risiken und Lücken"),
      t("Wo der Verein von Einzelnen abhängt oder Angaben fehlen")
    ),
    grid
  );

  elements.organigramm.append(wrapper);
}

function renderRiskCard(title, description, items) {
  const card = createElement("article", "risk-card");
  const header = createElement("header", "person-header");

  header.append(
    createElement("h3", "", title),
    createElement(
      "span",
      items.length > 0 ? "section-count risk-count" : "section-count",
      String(items.length)
    )
  );

  card.append(header, createElement("p", "risk-description", description));

  if (items.length > 0) {
    const list = createElement("ul", "risk-list");
    list.append(...items);
    card.append(list);
  } else {
    card.append(createElement("p", "risk-ok", t("Keine Einträge.")));
  }

  return card;
}

function createRiskItem(label, onClick) {
  const item = createElement("li");
  item.append(createActionButton(label, onClick, "", "link-button"));
  return item;
}
