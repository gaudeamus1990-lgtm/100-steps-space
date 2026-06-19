const STORAGE_KEY = "space100-progress-v1";
const NAME_KEY = "space100-partner-name";

let currentFilter = "all";
let state = loadState();

const elements = {
  name: document.querySelector("#partnerName"),
  progressCount: document.querySelector("#progressCount"),
  progressPercent: document.querySelector("#progressPercent"),
  progressBar: document.querySelector("#progressBar"),
  motivation: document.querySelector("#motivation"),
  stepsContainer: document.querySelector("#stepsContainer"),
  filters: document.querySelectorAll(".filter"),
  copyReport: document.querySelector("#copyReport"),
  downloadReport: document.querySelector("#downloadReport"),
  resetProgress: document.querySelector("#resetProgress")
};

elements.name.value = localStorage.getItem(NAME_KEY) || "";
elements.name.addEventListener("input", () => localStorage.setItem(NAME_KEY, elements.name.value.trim()));

elements.filters.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    elements.filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderSteps();
  });
});

elements.copyReport.addEventListener("click", async () => {
  const report = buildReport();
  try {
    await navigator.clipboard.writeText(report);
    flashButton(elements.copyReport, "Отчёт скопирован");
  } catch {
    downloadText(report, "space-progress-report.txt");
  }
});

elements.downloadReport.addEventListener("click", () => {
  downloadText(buildReport(), "space-progress-report.txt");
});

elements.resetProgress.addEventListener("click", () => {
  if (!confirm("Сбросить отметки, комментарии и даты выполнения?")) return;
  state = {};
  saveState();
  render();
});

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getStepState(stepId) {
  return state[stepId] || { done: false, comment: "", completedAt: "" };
}

function setStepState(stepId, patch) {
  state[stepId] = { ...getStepState(stepId), ...patch };
  saveState();
  renderProgress();
}

function getProgress() {
  const done = STEPS.filter((step) => getStepState(step.id).done).length;
  const total = STEPS.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}

function getMotivation(percent) {
  if (percent === 100) return "Маршрут пройден. Вы готовы к активной работе.";
  if (percent >= 81) return "Финишная прямая. Скоро первый полноценный результат.";
  if (percent >= 51) return "Отличный темп. Осталось закрепить результат.";
  if (percent >= 21) return "Вы уже в процессе. Система начинает собираться.";
  return "Начало положено. Главное — сделать первый шаг.";
}

function renderProgress() {
  const { done, total, percent } = getProgress();
  elements.progressCount.textContent = `Выполнено ${done} из ${total} шагов`;
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressBar.style.width = `${percent}%`;
  elements.motivation.textContent = getMotivation(percent);
}

function renderSteps() {
  const filtered = STEPS.filter((step) => {
    const stepState = getStepState(step.id);
    if (currentFilter === "done") return stepState.done;
    if (currentFilter === "todo") return !stepState.done;
    if (currentFilter === "required") return step.required;
    return true;
  });

  const grouped = groupByBlock(filtered);
  elements.stepsContainer.innerHTML = "";

  Object.entries(grouped).forEach(([block, steps]) => {
    const section = document.createElement("section");
    section.className = "block-section";
    section.innerHTML = `
      <div class="block-heading">
        <h2>${block}</h2>
        <span>${steps.length} шагов</span>
      </div>
    `;
    steps.forEach((step) => section.appendChild(createStepCard(step)));
    elements.stepsContainer.appendChild(section);
  });

  if (!filtered.length) {
    elements.stepsContainer.innerHTML = '<div class="empty-state">По этому фильтру шагов пока нет.</div>';
  }
}

function groupByBlock(steps) {
  return steps.reduce((acc, step) => {
    acc[step.block] ||= [];
    acc[step.block].push(step);
    return acc;
  }, {});
}

function createStepCard(step) {
  const stepState = getStepState(step.id);
  const card = document.createElement("article");
  card.className = `step-card ${stepState.done ? "done" : ""}`;

  const links = step.links && step.links.length ? step.links : [{ title: "Ссылка будет добавлена позже", url: "", type: "other" }];
  const firstMaterial = links.find((link) => link.type !== "video") || links[0];
  const firstVideo = links.find((link) => link.type === "video");

  card.innerHTML = `
    <details>
      <summary>
        <div class="step-main">
          <span class="step-number">${step.order}</span>
          <div>
            <h3>${step.title}</h3>
            <p>${step.shortDescription}</p>
          </div>
        </div>
        <div class="badges">
          <span class="badge">${step.block.replace(/^Блок \d+\.\s*/, "")}</span>
          ${step.required ? '<span class="badge required">обязательный шаг</span>' : '<span class="badge soft">дополнительный</span>'}
        </div>
      </summary>
      <div class="step-body">
        <div class="info-grid">
          <div>
            <h4>Зачем это нужно</h4>
            <p>${step.whyItMatters}</p>
          </div>
          <div>
            <h4>Что нужно сделать</h4>
            <ul>${step.tasks.map((task) => `<li>${task}</li>`).join("")}</ul>
          </div>
        </div>
        <div>
          <h4>Материалы</h4>
          <div class="link-list">
            ${links.map(renderLink).join("")}
          </div>
          <div class="step-actions">
            ${renderActionButton(firstMaterial, "Открыть материал")}
            ${firstVideo ? renderActionButton(firstVideo, "Открыть видео") : '<button class="button" disabled>Видео будет добавлено позже</button>'}
          </div>
        </div>
        <label class="comment-label">
          Комментарий партнёра
          <textarea data-comment="${step.id}" placeholder="Можно записать вопрос, результат или договорённость">${stepState.comment || ""}</textarea>
        </label>
        <div class="completion-row">
          <label class="checkline">
            <input type="checkbox" data-done="${step.id}" ${stepState.done ? "checked" : ""}>
            Выполнено
          </label>
          <span>${stepState.completedAt ? `Дата выполнения: ${formatDate(stepState.completedAt)}` : "Дата появится после отметки выполнения"}</span>
        </div>
      </div>
    </details>
  `;

  card.querySelector("[data-comment]").addEventListener("input", (event) => {
    setStepState(step.id, { comment: event.target.value });
  });

  card.querySelector("[data-done]").addEventListener("change", (event) => {
    setStepState(step.id, {
      done: event.target.checked,
      completedAt: event.target.checked ? new Date().toISOString() : ""
    });
    renderSteps();
  });

  return card;
}

function renderLink(link) {
  const label = `${link.title} · ${getTypeLabel(link.type)}`;
  if (!link.url) return `<span class="link-pill disabled">Ссылка будет добавлена позже</span>`;
  return `<a class="link-pill" href="${link.url}" target="_blank" rel="noopener">${label}</a>`;
}

function renderActionButton(link, text) {
  if (!link || !link.url) return '<button class="button" disabled>Ссылка будет добавлена позже</button>';
  return `<a class="button primary" href="${link.url}" target="_blank" rel="noopener">${text}</a>`;
}

function getTypeLabel(type) {
  const labels = {
    video: "видео",
    form: "форма",
    document: "документ",
    chat: "чат",
    community: "сообщество",
    calendar: "календарь",
    other: "материал"
  };
  return labels[type] || "материал";
}

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
}

function buildReport() {
  const { done, total, percent } = getProgress();
  const completed = STEPS.filter((step) => getStepState(step.id).done);
  const pending = STEPS.filter((step) => !getStepState(step.id).done);
  const comments = STEPS
    .map((step) => ({ step, comment: getStepState(step.id).comment }))
    .filter((item) => item.comment && item.comment.trim());

  return [
    "Отчёт о прогрессе: 100 шагов вперёд",
    `Партнёр: ${elements.name.value.trim() || "Имя не указано"}`,
    `Дата отчёта: ${new Date().toLocaleString("ru-RU")}`,
    `Выполнено: ${done} из ${total}`,
    `Процент прохождения: ${percent}%`,
    "",
    "Выполненные шаги:",
    completed.length ? completed.map((step) => `${step.order}. ${step.title}`).join("\n") : "Пока нет выполненных шагов.",
    "",
    "Невыполненные шаги:",
    pending.length ? pending.map((step) => `${step.order}. ${step.title}`).join("\n") : "Все шаги выполнены.",
    "",
    "Комментарии партнёра:",
    comments.length ? comments.map(({ step, comment }) => `${step.order}. ${step.title}: ${comment}`).join("\n") : "Комментариев пока нет."
  ].join("\n");
}

function downloadText(text, fileName) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function flashButton(button, text) {
  const oldText = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = oldText;
  }, 1600);
}

function render() {
  renderProgress();
  renderSteps();
}

render();
