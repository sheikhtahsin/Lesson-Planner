const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const periods = [
  { period: "P1", start: "8:50", end: "9:40", length: "50 minutes" },
  { period: "P2", start: "9:40", end: "10:25", length: "45 minutes" },
  { period: "P3", start: "10:25", end: "11:10", length: "45 minutes" },
  { period: "P4", start: "11:30", end: "12:15", length: "45 minutes" },
  { period: "P5", start: "12:15", end: "13:00", length: "45 minutes" },
  { period: "P6", start: "13:30", end: "14:25", length: "55 minutes" },
  { period: "P7", start: "14:25", end: "15:15", length: "50 minutes" }
];

const timetable = [
  { day: "Monday", period: "P1", className: "9.4" },
  { day: "Monday", period: "P2", className: "10" },
  { day: "Tuesday", period: "P1", className: "9.2" },
  { day: "Wednesday", period: "P4", className: "9.2" },
  { day: "Wednesday", period: "P5", className: "9.4" },
  { day: "Wednesday", period: "P6", className: "10", doubleGroup: "Year 10 double" },
  { day: "Wednesday", period: "P7", className: "10", doubleGroup: "Year 10 double" },
  { day: "Thursday", period: "P1", className: "9.4" },
  { day: "Thursday", period: "P2", className: "10" },
  { day: "Thursday", period: "P4", className: "9.2", doubleGroup: "Year 9.2 double" },
  { day: "Thursday", period: "P5", className: "9.2", doubleGroup: "Year 9.2 double" },
  { day: "Friday", period: "P1", className: "9.2" },
  { day: "Friday", period: "P4", className: "9.4", doubleGroup: "Year 9.4 double" },
  { day: "Friday", period: "P5", className: "9.4", doubleGroup: "Year 9.4 double" },
  { day: "Friday", period: "P6", className: "10" }
];

const storageKey = "economics-business-term2-plans-v1";
const weekPlansKey = "economics-business-week-plans-v1";
let plans = loadObject(storageKey);
let weekPlans = loadObject(weekPlansKey);
let selectedWeek = 3;
let activeFilter = "all";
let activeSlot = null;
let copiedLesson = null;

const calendar = document.querySelector("#calendar");
const weekSelect = document.querySelector("#weekSelect");
const lessonDialog = document.querySelector("#lessonDialog");
const lessonForm = document.querySelector("#lessonForm");
const toast = document.querySelector("#toast");

const formFields = [
  "learningArea",
  "gradeClass",
  "date",
  "time",
  "length",
  "apstFocus",
  "curriculum",
  "crossCurriculum",
  "generalCapabilities",
  "learningIntentions",
  "successCriteria",
  "managementDiversity",
  "notDiscussed",
  "coverageNotes",
  "introduction",
  "body",
  "conclusion",
  "resourcesStrategies",
  "differentiation",
  "assessmentFeedback",
  "mentorNotes"
];

const sectionMap = [
  { field: "learningArea", labels: ["learning area"] },
  { field: "gradeClass", labels: ["grade/class", "grade / class", "class"] },
  { field: "apstFocus", labels: ["apst focus areas", "apst"] },
  { field: "date", labels: ["date"] },
  { field: "time", labels: ["time"] },
  { field: "length", labels: ["length", "duration"] },
  { field: "curriculum", labels: ["curriculum content description", "syllabus outcome", "curriculum"] },
  { field: "crossCurriculum", labels: ["cross-curriculum priorities", "cross curriculum priorities"] },
  { field: "generalCapabilities", labels: ["general capabilities"] },
  { field: "learningIntentions", labels: ["learning intention(s)", "learning intentions", "learning intention"] },
  { field: "successCriteria", labels: ["success criteria"] },
  { field: "managementDiversity", labels: ["classroom management", "student diversity", "considerations"] },
  { field: "introduction", labels: ["introduction", "intro"] },
  { field: "body", labels: ["body", "main lesson", "learning activities", "teaching and learning activities"] },
  { field: "conclusion", labels: ["conclusion", "plenary", "wrap up", "wrap-up"] },
  { field: "resourcesStrategies", labels: ["resources and teaching strategies", "resources", "teaching strategies"] },
  { field: "differentiation", labels: ["plans for differentiation", "differentiation"] },
  { field: "assessmentFeedback", labels: ["assessment and feedback", "assessment", "feedback"] },
  { field: "notDiscussed", labels: ["areas we could not discuss", "not discussed", "areas not discussed", "missed content"] },
  { field: "coverageNotes", labels: ["coverage notes", "follow up notes", "follow-up notes"] },
  { field: "mentorNotes", labels: ["mentor teacher notes", "signature of mentor teacher", "mentor notes"] }
];

const week3CarryForwardOutcomes = [
  "Brought forward from Week 2:",
  "• Circular flow of income - overview (key participants and sectors)",
  "• Circular flow diagram - impact of injections and leakages",
  "• Circular flow diagram - Impacts on economic growth",
  "• Globalisation (in the economy)",
  "• Specialisation, Interdependence, Opportunity Cost, and Comparative Advantage"
].join("\n");

init();

function init() {
  enhanceRichEditors();
  bindRichToolbar();

  for (let week = 1; week <= 10; week += 1) {
    const option = document.createElement("option");
    option.value = String(week);
    option.textContent = `Week ${week}`;
    weekSelect.append(option);
  }
  weekSelect.value = String(selectedWeek);

  weekSelect.addEventListener("change", () => {
    selectedWeek = Number(weekSelect.value);
    render();
  });

  document.querySelector("#prevWeek").addEventListener("click", () => changeWeek(-1));
  document.querySelector("#nextWeek").addEventListener("click", () => changeWeek(1));
  document.querySelector("#saveWeekPlan").addEventListener("click", saveWeekPlan);
  ["weeklyOutcomes92", "weeklyOutcomes94", "weeklyOutcomes10"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("blur", () => {
      saveWeekPlan(false);
      renderOutcomeStatuses();
      renderSummary();
    });
  });
  document.querySelector("#populatePlan").addEventListener("click", populateFromPaste);
  document.querySelector("#clearPaste").addEventListener("click", () => {
    setPasteContent("");
  });
  document.querySelector("#savePlan").addEventListener("click", saveActivePlan);
  document.querySelector("#deletePlan").addEventListener("click", clearActivePlan);
  document.querySelector("#copyLesson").addEventListener("click", copyLessonFields);
  document.querySelector("#pasteLesson").addEventListener("click", pasteLessonFields);
  document.querySelector("#exportLessonPdf").addEventListener("click", exportActiveLessonPdf);
  document.querySelector("#copySummary").addEventListener("click", copySummary);
  document.querySelector("#clearCurrentWeek").addEventListener("click", clearCurrentWeek);
  document.querySelector("#clearEverything").addEventListener("click", clearEverything);

  document.querySelectorAll("[data-class-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.classFilter;
      document.querySelectorAll("[data-class-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderCalendar();
    });
  });

  render();
}

function changeWeek(direction) {
  selectedWeek = Math.min(10, Math.max(1, selectedWeek + direction));
  weekSelect.value = String(selectedWeek);
  render();
}

function render() {
  document.querySelector("#selectedWeekLabel").textContent = `Week ${selectedWeek}`;
  renderWeekPlanner();
  renderCalendar();
  renderSummary();
}

function renderWeekPlanner() {
  const weekPlan = getWeekPlan();
  document.querySelector("#weeklyOutcomes92").value = weekPlan.outcomesByClass["9.2"] || "";
  document.querySelector("#weeklyOutcomes94").value = weekPlan.outcomesByClass["9.4"] || "";
  document.querySelector("#weeklyOutcomes10").value = weekPlan.outcomesByClass["10"] || "";
  renderOutcomeStatuses();

  const list = document.querySelector("#availabilityList");
  list.innerHTML = "";
  timetable.forEach((slot) => {
    const period = getPeriod(slot.period);
    const key = slotBaseKey(slot);
    const row = document.createElement("label");
    row.className = "availability-row";
    row.innerHTML = `
      <input type="checkbox" data-availability-key="${key}" ${weekPlan.unavailable[key] ? "" : "checked"}>
      <span>Year ${slot.className} - ${slot.day} ${slot.period} (${period.start}-${period.end})${slot.doubleGroup ? ` - ${slot.doubleGroup}` : ""}</span>
    `;
    row.querySelector("input").addEventListener("change", (event) => {
      const current = getWeekPlan();
      current.unavailable[key] = !event.target.checked;
      saveWeekPlanObject(current);
      renderCalendar();
      renderSummary();
    });
    list.append(row);
  });
}

function renderOutcomeStatuses() {
  const weekPlan = getWeekPlan();
  [
    ["9.2", "outcomeStatus92"],
    ["9.4", "outcomeStatus94"],
    ["10", "outcomeStatus10"]
  ].forEach(([className, containerId]) => {
    syncOutcomeStatuses(className);
    const outcomes = parseOutcomeItems(weekPlan.outcomesByClass[className]);
    const container = document.querySelector(`#${containerId}`);
    container.innerHTML = "";

    const trackableOutcomes = outcomes.filter((outcome) => outcome.type === "outcome");
    if (!trackableOutcomes.length && !outcomes.length) {
      container.innerHTML = `<p class="empty-outcomes">No outcomes listed yet.</p>`;
      return;
    }

    outcomes.forEach((outcome) => {
      if (outcome.type === "section") {
        const heading = document.createElement("h4");
        heading.className = "outcome-section-heading";
        heading.textContent = outcome.text;
        container.append(heading);
        return;
      }
      const row = document.createElement("div");
      row.className = "outcome-status-row";
      row.innerHTML = `
        <div class="outcome-text">${escapeHtml(outcome.text)}</div>
        <select data-class="${className}" data-outcome-id="${outcome.id}" aria-label="Outcome status">
          <option value="not-started">Haven't started</option>
          <option value="partial">Partially completed</option>
          <option value="complete">Complete</option>
        </select>
      `;
      const select = row.querySelector("select");
      select.value = weekPlan.outcomeStatuses[className]?.[outcome.id] || "not-started";
      select.addEventListener("change", (event) => {
        const current = getWeekPlan();
        current.outcomeStatuses[className] ||= {};
        current.outcomeStatuses[className][outcome.id] = event.target.value;
        saveWeekPlanObject(current);
        renderSummary();
      });
      container.append(row);
    });
  });
}

function renderCalendar() {
  calendar.innerHTML = "";
  calendar.append(createHeaderCell("Period"));
  days.forEach((day) => calendar.append(createHeaderCell(day)));

  periods.forEach((period) => {
    const timeCell = document.createElement("div");
    timeCell.className = "calendar-cell time-cell";
    timeCell.innerHTML = `${period.period}<span class="period-time">${period.start}-${period.end}</span>`;
    calendar.append(timeCell);

    days.forEach((day) => {
      const cell = document.createElement("div");
      cell.className = "calendar-cell";
      timetable
        .filter((slot) => slot.day === day && slot.period === period.period)
        .forEach((slot) => cell.append(createLessonCard(slot)));
      calendar.append(cell);
    });
  });
}

function createHeaderCell(text) {
  const cell = document.createElement("div");
  cell.className = "calendar-cell day-head";
  cell.textContent = text;
  return cell;
}

function createLessonCard(slot) {
  const plan = getPlan(slot);
  const period = getPeriod(slot.period);
  const unavailable = isSlotUnavailable(slot);
  const hasPlan = isPlanStarted(plan);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `lesson-card class-${slot.className.replace(".", "-")}`;
  if (unavailable) button.classList.add("unavailable");
  if (activeFilter !== "all" && activeFilter !== slot.className) button.classList.add("hidden-card");
  button.innerHTML = `
    <span class="status-row">
      <strong>Year ${slot.className}</strong>
      <span class="pill">${unavailable ? "Unavailable" : hasPlan ? "Planned" : "Open"}</span>
    </span>
    <small>${slot.day} ${slot.period}, ${period.start}-${period.end}${slot.doubleGroup ? ` - ${slot.doubleGroup}` : ""}</small>
  `;
  button.addEventListener("click", () => openLesson(slot));
  return button;
}

function openLesson(slot) {
  activeSlot = slot;
  const period = getPeriod(slot.period);
  const merged = { ...defaultPlan(slot, period), ...getPlan(slot) };

  document.querySelector("#lessonMeta").textContent = `Week ${selectedWeek} - ${slot.day} - ${slot.period}`;
  document.querySelector("#lessonTitle").textContent = `Year ${slot.className} Lesson Plan`;
  setPasteContent("");
  document.querySelector("#populatorNote").textContent = `Week ${selectedWeek}, ${slot.day} ${slot.period}, Year ${slot.className}`;

  formFields.forEach((field) => {
    const input = getFormControl(field);
    if (!input) return;
    setControlValue(input, merged[field] || "");
  });

  lessonDialog.showModal();
}

function populateFromPaste() {
  if (!activeSlot) return;
  const text = getPasteText();
  if (!text) {
    showToast("Paste a lesson plan first");
    return;
  }

  const parsed = parseLessonPlan(text);
  const defaults = defaultPlan(activeSlot, getPeriod(activeSlot.period));
  let filled = 0;

  Object.entries({ ...defaults, ...parsed }).forEach(([field, value]) => {
    const input = getFormControl(field);
    if (!input || value === undefined || value === "") return;
    setControlValue(input, value);
    filled += 1;
  });

  showToast(`Populated ${filled} fields`);
}

function parseLessonPlan(text) {
  const clean = text.replace(/\r/g, "").trim();
  const sections = extractHeadingSections(clean);
  const parsed = {};

  sectionMap.forEach(({ field, labels }) => {
    const value = findSectionValue(sections, labels);
    if (value) parsed[field] = plainTextToHtml(value);
  });

  if (!parsed.introduction || !parsed.body || !parsed.conclusion) {
    const timed = splitTimedSequence(clean);
    parsed.introduction ||= plainTextToHtml(timed.introduction);
    parsed.body ||= plainTextToHtml(timed.body);
    parsed.conclusion ||= plainTextToHtml(timed.conclusion);
  }

  return parsed;
}

function extractHeadingSections(text) {
  const headings = sectionMap.flatMap((item) => item.labels).sort((a, b) => b.length - a.length);
  const escaped = headings.map(escapeRegex).join("|");
  const pattern = new RegExp(`(^|\\n)\\s*(${escaped})\\s*:?\\s*`, "gi");
  const matches = [...text.matchAll(pattern)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    return {
      label: normaliseLabel(match[2]),
      value: text.slice(start, end).trim()
    };
  });
}

function findSectionValue(sections, labels) {
  const wanted = labels.map(normaliseLabel);
  const match = sections.find((section) => wanted.includes(section.label));
  return match ? trimSectionValue(match.value) : "";
}

function splitTimedSequence(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const intro = [];
  const body = [];
  const conclusion = [];
  lines.forEach((line) => {
    if (/(\b0\s*-\s*10\b|\bintro|starter|hook|settle|attendance)/i.test(line)) intro.push(line);
    else if (/(\bconclusion|plenary|exit ticket|wrap|reflect|final\b)/i.test(line)) conclusion.push(line);
    else if (/(\bbody|activity|task|model|guided|independent|pair|group)/i.test(line)) body.push(line);
  });
  return {
    introduction: intro.join("\n"),
    body: body.join("\n"),
    conclusion: conclusion.join("\n")
  };
}

function trimSectionValue(value) {
  return value.replace(/\n{3,}/g, "\n\n").trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normaliseLabel(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function saveActivePlan() {
  if (!activeSlot) return;
  const plan = getFormPlan();
  plan.updatedAt = new Date().toISOString();
  plans[planKey(activeSlot)] = plan;
  persistPlans();
  lessonDialog.close();
  render();
  showToast("Lesson plan saved");
}

function clearActivePlan() {
  if (!activeSlot) return;
  delete plans[planKey(activeSlot)];
  persistPlans();
  lessonDialog.close();
  render();
  showToast("Lesson plan cleared");
}

function getFormPlan() {
  const plan = {};
  formFields.forEach((field) => {
    const input = getFormControl(field);
    if (!input) return;
    plan[field] = getControlValue(input);
  });
  return plan;
}

function getFormControl(field) {
  return lessonForm.querySelector(`[data-rich-name="${field}"]`) || lessonForm.elements.namedItem(field);
}

function enhanceRichEditors() {
  lessonForm.querySelectorAll("textarea").forEach((textarea) => {
    const editor = document.createElement("div");
    editor.className = "rich-editor";
    editor.contentEditable = "true";
    editor.setAttribute("role", "textbox");
    editor.setAttribute("aria-multiline", "true");
    if (textarea.name) editor.dataset.richName = textarea.name;
    if (textarea.id) editor.id = `${textarea.id}Editor`;
    if (textarea.placeholder) editor.dataset.placeholder = textarea.placeholder;
    if (textarea.rows) editor.style.minHeight = `${Math.max(120, Number(textarea.rows) * 28)}px`;
    textarea.classList.add("sr-hidden-textarea");
    textarea.insertAdjacentElement("afterend", editor);
  });
}

function bindRichToolbar() {
  document.querySelectorAll(".rich-toolbar button").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.dataset.command;
      const block = button.dataset.block;
      if (block) document.execCommand("formatBlock", false, block);
      if (command) document.execCommand(command, false, null);
    });
  });
}

function getControlValue(control) {
  if (control.type === "checkbox") return control.checked;
  if (control.classList?.contains("rich-editor")) return control.innerHTML.trim();
  return control.value.trim();
}

function setControlValue(control, value) {
  if (control.type === "checkbox") {
    control.checked = Boolean(value);
    return;
  }
  if (control.classList?.contains("rich-editor")) {
    control.innerHTML = richValueToHtml(value);
    return;
  }
  control.value = htmlToPlainText(value || "");
}

function getPasteEditor() {
  return document.querySelector("#planPasteEditor") || document.querySelector("#planPaste");
}

function getPasteText() {
  const pasteBox = getPasteEditor();
  return (pasteBox.innerText || pasteBox.value || "").trim();
}

function setPasteContent(value) {
  const pasteBox = getPasteEditor();
  if (pasteBox.classList?.contains("rich-editor")) pasteBox.innerHTML = value;
  else pasteBox.value = value;
}

function richValueToHtml(value) {
  if (!value) return "";
  const text = String(value);
  return looksLikeHtml(text) ? text : plainTextToHtml(text);
}

function looksLikeHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function plainTextToHtml(value) {
  const lines = String(value || "").replace(/\r/g, "").split("\n");
  const html = [];
  let inList = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      return;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    if (bullet) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${formatInlineText(bullet[1])}</li>`);
      return;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    const heading = trimmed.match(/^#{1,4}\s+(.+)/);
    if (heading || /^[A-Z][A-Za-z /&()'-]{2,40}:$/.test(trimmed)) {
      html.push(`<h3>${formatInlineText(heading ? heading[1] : trimmed.replace(/:$/, ""))}</h3>`);
    } else {
      html.push(`<p>${formatInlineText(trimmed)}</p>`);
    }
  });

  if (inList) html.push("</ul>");
  return html.join("");
}

function formatInlineText(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlToPlainText(value) {
  const container = document.createElement("div");
  container.innerHTML = String(value || "");
  return (container.innerText || container.textContent || "").trim();
}

function copyLessonFields() {
  if (!activeSlot) return;
  copiedLesson = getFormPlan();
  copiedLesson.copiedAt = new Date().toISOString();
  copiedLesson.source = `Week ${selectedWeek}, Year ${activeSlot.className}, ${activeSlot.day} ${activeSlot.period}`;
  showToast("Lesson copied");
}

function pasteLessonFields() {
  if (!activeSlot || !copiedLesson) {
    showToast("Copy a lesson first");
    return;
  }
  const period = getPeriod(activeSlot.period);
  const keepTargetFields = defaultPlan(activeSlot, period);
  const pasted = {
    ...copiedLesson,
    ...keepTargetFields,
    date: getFormControl("date")?.value || "",
    coverageNotes: copiedLesson.coverageNotes || `Copied from ${copiedLesson.source || "another lesson"}`
  };
  delete pasted.updatedAt;
  delete pasted.copiedAt;
  delete pasted.source;

  formFields.forEach((field) => {
    const input = getFormControl(field);
    if (!input || pasted[field] === undefined) return;
    setControlValue(input, pasted[field] || "");
  });
  showToast("Lesson pasted into form");
}

function exportActiveLessonPdf() {
  if (!activeSlot) return;
  const plan = getFormPlan();
  const period = getPeriod(activeSlot.period);
  const defaults = defaultPlan(activeSlot, period);
  const exportPlan = { ...defaults, ...plan };
  const weeklyOutcomes = getWeekPlan().outcomesByClass?.[activeSlot.className] || "";
  const title = `Week ${selectedWeek} Year ${activeSlot.className} ${activeSlot.day} ${activeSlot.period}`;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showToast("Allow pop-ups to export PDF");
    return;
  }

  printWindow.document.write(buildLessonPrintHtml(title, exportPlan, weeklyOutcomes));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 300);
}

function buildLessonPrintHtml(title, plan, weeklyOutcomes) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { margin: 0; color: #182028; font-family: Arial, Helvetica, sans-serif; line-height: 1.42; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    h2 { margin: 18px 0 8px; font-size: 16px; border-bottom: 1px solid #cfd7df; padding-bottom: 4px; }
    h3 { margin: 12px 0 6px; font-size: 14px; }
    p { margin: 0 0 8px; }
    ul, ol { margin-top: 0; padding-left: 22px; }
    .meta { color: #5d6975; font-size: 12px; margin-bottom: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
    .box { border: 1px solid #d7dde3; border-radius: 6px; padding: 9px; min-height: 28px; }
    .label { color: #5d6975; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .full { grid-column: 1 / -1; }
    .checklist { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 14px; }
    .check { font-size: 13px; }
    .section { break-inside: avoid; }
    .rich h2, .rich h3, .rich h4 { margin-top: 10px; }
    .signature { margin-top: 28px; display: grid; grid-template-columns: 1fr 180px; gap: 24px; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>Southern Cross University Lesson Plan</h1>
  <div class="meta">${escapeHtml(title)} | Exported ${new Date().toLocaleString()}</div>

  <div class="grid">
    ${printBox("Learning Area", plan.learningArea)}
    ${printBox("Grade / Class", plan.gradeClass)}
    ${printBox("Date", plan.date)}
    ${printBox("Time", plan.time)}
    ${printBox("Length", plan.length)}
    ${printBox("APST Focus Areas", plan.apstFocus, "full")}
    ${printBox("Weekly Outcomes", weeklyOutcomes, "full")}
    ${printBox("Curriculum Content Description / Syllabus Outcome", plan.curriculum, "full")}
    ${printBox("Cross-curriculum Priorities", plan.crossCurriculum)}
    ${printBox("General Capabilities", plan.generalCapabilities)}
    ${printBox("Learning Intention(s)", plan.learningIntentions)}
    ${printBox("Success Criteria", plan.successCriteria)}
    ${printBox("Classroom Management and Student Diversity", plan.managementDiversity, "full")}
  </div>

  <h2>After-Class Notes</h2>
  ${printSection("Areas We Could Not Discuss", plan.notDiscussed)}
  ${printSection("Follow-up / Reteaching Notes", plan.coverageNotes)}

  <h2>Lesson Sequence</h2>
  ${printSection("Introduction", plan.introduction)}
  ${printSection("Body", plan.body)}
  ${printSection("Conclusion", plan.conclusion)}

  <h2>Resources, Differentiation, Assessment</h2>
  ${printSection("Resources and Teaching Strategies", plan.resourcesStrategies)}
  ${printSection("Plans for Differentiation", plan.differentiation)}
  ${printSection("Assessment and Feedback", plan.assessmentFeedback)}
  ${printSection("Mentor Teacher Notes / Signature", plan.mentorNotes)}

  <div class="signature">
    <div>Signature of mentor teacher: _______________________________</div>
    <div>Date: _______________</div>
  </div>
</body>
</html>`;
}

function printBox(label, value, extraClass = "") {
  return `<div class="box ${extraClass}"><div class="label">${escapeHtml(label)}</div><div class="rich">${safeRichHtml(value)}</div></div>`;
}

function printSection(label, value) {
  return `<div class="section">${printBox(label, value, "full")}</div>`;
}

function safeRichHtml(value) {
  if (!value) return "";
  const html = richValueToHtml(value);
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name)) node.removeAttribute(attr.name);
    });
  });
  return template.innerHTML;
}

function clearCurrentWeek() {
  const ok = window.confirm(`Clear all lesson plans and weekly outcomes for Week ${selectedWeek}?`);
  if (!ok) return;
  const prefix = `week-${selectedWeek}|`;
  Object.keys(plans).forEach((key) => {
    if (key.startsWith(prefix)) delete plans[key];
  });
  delete weekPlans[`week-${selectedWeek}`];
  persistPlans();
  localStorage.setItem(weekPlansKey, JSON.stringify(weekPlans));
  render();
  showToast(`Week ${selectedWeek} cleared`);
}

function clearEverything() {
  const ok = window.confirm("Clear all saved weeks, lesson plans, outcomes and availability settings?");
  if (!ok) return;
  plans = {};
  weekPlans = {};
  localStorage.removeItem(storageKey);
  localStorage.removeItem(weekPlansKey);
  localStorage.removeItem("economics-business-source-notes-v1");
  render();
  showToast("Everything cleared");
}

function saveWeekPlan(showMessage = true) {
  const current = getWeekPlan();
  current.outcomesByClass = {
    "9.2": document.querySelector("#weeklyOutcomes92").value.trim(),
    "9.4": document.querySelector("#weeklyOutcomes94").value.trim(),
    "10": document.querySelector("#weeklyOutcomes10").value.trim()
  };
  ["9.2", "9.4", "10"].forEach((className) => syncOutcomeStatuses(className, current));
  saveWeekPlanObject(current);
  renderOutcomeStatuses();
  renderSummary();
  if (showMessage) showToast("Weekly outcomes saved");
}

function renderSummary() {
  const weekSlots = timetable.map((slot) => ({ ...slot, plan: getPlan(slot) }));
  const availableSlots = weekSlots.filter((slot) => !isSlotUnavailable(slot));
  const planned = weekSlots.filter((slot) => isPlanStarted(slot.plan)).length;
  document.querySelector("#plannedCount").textContent = `${planned} / ${availableSlots.length} available`;

  const weekPlan = getWeekPlan();
  const totalOutcomeStats = getAllOutcomeStats(weekPlan);
  document.querySelector("#coveredCount").textContent = `${totalOutcomeStats.complete} / ${totalOutcomeStats.total}`;
  const byClass = ["9.2", "9.4", "10"].map((className) => {
    const classSlots = weekSlots.filter((slot) => slot.className === className);
    const classAvailable = classSlots.filter((slot) => !isSlotUnavailable(slot));
    const classPlanned = classSlots.filter((slot) => isPlanStarted(slot.plan)).length;
    const outcomeStats = getOutcomeStats(className, weekPlan);
    const missed = classSlots
      .filter((slot) => slot.plan.notDiscussed)
      .map((slot) => `  - ${slot.day} ${slot.period}: ${htmlToPlainText(slot.plan.notDiscussed)}`)
      .join("\n");
    const notes = classSlots
      .filter((slot) => slot.plan.coverageNotes)
      .map((slot) => `  - ${slot.day} ${slot.period}: ${htmlToPlainText(slot.plan.coverageNotes)}`)
      .join("\n");

    return [
      `Year ${className}`,
      `Weekly outcomes:\n${formatOutcomesForSummary(className, weekPlan)}`,
      `Outcome progress: ${outcomeStats.complete} complete, ${outcomeStats.partial} partially completed, ${outcomeStats.notStarted} haven't started (${outcomeStats.total} total)`,
      `Available lessons: ${classAvailable.length} / ${classSlots.length}`,
      `Lessons planned: ${classPlanned} / ${classAvailable.length}`,
      missed ? `Areas not discussed:\n${missed}` : "Areas not discussed: none recorded",
      notes ? `Follow-up / reteaching notes:\n${notes}` : "Follow-up / reteaching notes: none yet"
    ].join("\n");
  });

  document.querySelector("#weeklySummary").value = [
    `Term 2 Economics and Business - Week ${selectedWeek} Summary`,
    "",
    `Available lessons: ${availableSlots.length} / ${weekSlots.length}`,
    `Total lessons planned: ${planned} / ${availableSlots.length}`,
    `Total outcomes complete: ${totalOutcomeStats.complete} / ${totalOutcomeStats.total}`,
    `Total outcomes partial: ${totalOutcomeStats.partial} / ${totalOutcomeStats.total}`,
    "",
    byClass.join("\n\n")
  ].join("\n");
}

async function copySummary() {
  const summary = document.querySelector("#weeklySummary").value;
  try {
    await navigator.clipboard.writeText(summary);
    showToast("Weekly summary copied");
  } catch {
    document.querySelector("#weeklySummary").select();
    showToast("Summary selected");
  }
}

function defaultPlan(slot, period) {
  return {
    learningArea: "Economics and Business",
    gradeClass: `Year ${slot.className}`,
    time: `${period.start}-${period.end}`,
    length: period.length
  };
}

function getPeriod(periodName) {
  return periods.find((item) => item.period === periodName);
}

function planKey(slot) {
  return `week-${selectedWeek}|${slot.className}|${slot.day}|${slot.period}`;
}

function slotBaseKey(slot) {
  return `${slot.className}|${slot.day}|${slot.period}`;
}

function getPlan(slot) {
  return plans[planKey(slot)] || {};
}

function getWeekPlan() {
  const key = `week-${selectedWeek}`;
  if (!weekPlans[key]) weekPlans[key] = { outcomesByClass: { "9.2": "", "9.4": "", "10": "" }, outcomeStatuses: { "9.2": {}, "9.4": {}, "10": {} }, unavailable: {} };
  weekPlans[key].unavailable ||= {};
  weekPlans[key].outcomesByClass ||= { "9.2": "", "9.4": "", "10": "" };
  weekPlans[key].outcomeStatuses ||= { "9.2": {}, "9.4": {}, "10": {} };
  weekPlans[key].outcomeStatuses["9.2"] ||= {};
  weekPlans[key].outcomeStatuses["9.4"] ||= {};
  weekPlans[key].outcomeStatuses["10"] ||= {};
  if (weekPlans[key].outcomes && !weekPlans[key].outcomesByClass["9.2"] && !weekPlans[key].outcomesByClass["9.4"] && !weekPlans[key].outcomesByClass["10"]) {
    weekPlans[key].outcomesByClass = {
      "9.2": weekPlans[key].outcomes,
      "9.4": weekPlans[key].outcomes,
      "10": weekPlans[key].outcomes
    };
  }
  if (weekPlans[key].brief && !weekPlans[key].outcomesByClass["9.2"] && !weekPlans[key].outcomesByClass["9.4"] && !weekPlans[key].outcomesByClass["10"]) {
    weekPlans[key].outcomesByClass = {
      "9.2": weekPlans[key].brief,
      "9.4": weekPlans[key].brief,
      "10": weekPlans[key].brief
    };
  }
  updateCarryForwardOutcomes(weekPlans[key]);
  return weekPlans[key];
}

function parseOutcomeItems(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (isOutcomeSection(line)) {
        return { type: "section", id: outcomeId(line), text: cleanSectionHeading(line) };
      }
      const textValue = line.replace(/^[-*•\d.)\s]+/, "").trim();
      return { type: "outcome", id: outcomeId(textValue), text: textValue };
    })
    .filter((item) => item.type === "section" || item.text);
}

function isOutcomeSection(line) {
  const trimmed = line.trim();
  return /^#{1,4}\s+/.test(trimmed) || /^\[[^\]]+\]$/.test(trimmed) || (/^[A-Za-z][A-Za-z0-9 /&()'-]{2,60}:$/.test(trimmed) && !/^[-*•]/.test(trimmed));
}

function cleanSectionHeading(line) {
  return line.trim().replace(/^#{1,4}\s+/, "").replace(/^\[|\]$/g, "").replace(/:$/, "");
}

function updateCarryForwardOutcomes(plan) {
  if (selectedWeek <= 1) return;
  const previousPlan = weekPlans[`week-${selectedWeek - 1}`];
  let changed = false;
  ["9.2", "9.4", "10"].forEach((className) => {
    const previousUnfinished = previousPlan
      ? getUnfinishedOutcomesFromPlan(previousPlan, className)
      : getSeededCarryForwardForWeek3(className);
    const blockTitle = `Brought forward from Week ${selectedWeek - 1}`;
    const currentWithoutCarry = removeOutcomeSection(plan.outcomesByClass[className], blockTitle);
    const carryBlock = previousUnfinished.length
      ? [`${blockTitle}:`, ...previousUnfinished.map((item) => `• ${item.text}`)].join("\n")
      : "";
    const nextText = [carryBlock, currentWithoutCarry].filter(Boolean).join(currentWithoutCarry && carryBlock ? "\n\n" : "");
    if ((plan.outcomesByClass[className] || "").trim() === nextText.trim()) return;
    plan.outcomesByClass[className] = nextText;
    changed = true;
  });

  delete plan.carriedFromPreviousWeek;
  delete plan.seededWeek3CarryForward;
  if (changed) saveWeekPlanObject(plan);
}

function getUnfinishedOutcomesFromPlan(plan, className) {
  plan.outcomesByClass ||= { "9.2": "", "9.4": "", "10": "" };
  plan.outcomeStatuses ||= { "9.2": {}, "9.4": {}, "10": {} };
  return parseOutcomeItems(plan.outcomesByClass[className])
    .filter((item) => item.type === "outcome")
    .filter((item) => (plan.outcomeStatuses[className]?.[item.id] || "not-started") !== "complete");
}

function getSeededCarryForwardForWeek3(className) {
  if (selectedWeek !== 3 || weekPlans["week-2"]) return [];
  return parseOutcomeItems(week3CarryForwardOutcomes).filter((item) => item.type === "outcome");
}

function removeOutcomeSection(text, sectionTitle) {
  const lines = String(text || "").split("\n");
  const output = [];
  let skipping = false;
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (isOutcomeSection(trimmed) && cleanSectionHeading(trimmed).toLowerCase() === sectionTitle.toLowerCase()) {
      skipping = true;
      return;
    }
    if (skipping && isOutcomeSection(trimmed)) {
      skipping = false;
    }
    if (!skipping) output.push(line);
  });
  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function outcomeId(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function syncOutcomeStatuses(className, plan = getWeekPlan()) {
  plan.outcomeStatuses ||= { "9.2": {}, "9.4": {}, "10": {} };
  plan.outcomeStatuses[className] ||= {};
  const validIds = new Set(parseOutcomeItems(plan.outcomesByClass[className]).filter((item) => item.type === "outcome").map((item) => item.id));
  Object.keys(plan.outcomeStatuses[className]).forEach((id) => {
    if (!validIds.has(id)) delete plan.outcomeStatuses[className][id];
  });
  validIds.forEach((id) => {
    plan.outcomeStatuses[className][id] ||= "not-started";
  });
}

function getOutcomeStats(className, plan = getWeekPlan()) {
  syncOutcomeStatuses(className, plan);
  const outcomes = parseOutcomeItems(plan.outcomesByClass[className]).filter((item) => item.type === "outcome");
  const statuses = plan.outcomeStatuses[className] || {};
  return outcomes.reduce((stats, outcome) => {
    const status = statuses[outcome.id] || "not-started";
    stats.total += 1;
    if (status === "complete") stats.complete += 1;
    else if (status === "partial") stats.partial += 1;
    else stats.notStarted += 1;
    return stats;
  }, { total: 0, complete: 0, partial: 0, notStarted: 0 });
}

function getAllOutcomeStats(plan = getWeekPlan()) {
  return ["9.2", "9.4", "10"].reduce((total, className) => {
    const stats = getOutcomeStats(className, plan);
    total.total += stats.total;
    total.complete += stats.complete;
    total.partial += stats.partial;
    total.notStarted += stats.notStarted;
    return total;
  }, { total: 0, complete: 0, partial: 0, notStarted: 0 });
}

function formatOutcomesForSummary(className, plan = getWeekPlan()) {
  const outcomes = parseOutcomeItems(plan.outcomesByClass[className]);
  if (!outcomes.length) return "No outcomes recorded yet.";
  const statuses = plan.outcomeStatuses[className] || {};
  return outcomes.map((item) => {
    if (item.type === "section") return `${item.text}:`;
    return `  - [${formatOutcomeStatus(statuses[item.id] || "not-started")}] ${item.text}`;
  }).join("\n");
}

function formatOutcomeStatus(status) {
  if (status === "complete") return "Complete";
  if (status === "partial") return "Partially completed";
  return "Haven't started";
}

function saveWeekPlanObject(weekPlan) {
  weekPlans[`week-${selectedWeek}`] = weekPlan;
  localStorage.setItem(weekPlansKey, JSON.stringify(weekPlans));
}

function isSlotUnavailable(slot) {
  return Boolean(getWeekPlan().unavailable[slotBaseKey(slot)]);
}

function isPlanStarted(plan) {
  return Boolean(
    plan.learningIntentions ||
      plan.successCriteria ||
      plan.curriculum ||
      plan.introduction ||
      plan.body ||
      plan.conclusion ||
      plan.resourcesStrategies ||
      plan.differentiation ||
      plan.assessmentFeedback ||
      plan.notDiscussed
  );
}

function loadObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function persistPlans() {
  localStorage.setItem(storageKey, JSON.stringify(plans));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}
