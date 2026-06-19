const demoPartners = [
  {
    fullName: "Иван Петров",
    status: "Активно идёт",
    done: 37,
    lastStep: "Согласовать упаковку продуктов с наставником",
    lastActivity: "18.06.2026",
    recommendation: "поздравить с завершением блока"
  },
  {
    fullName: "Марина Соколова",
    status: "Нужна поддержка",
    done: 14,
    lastStep: "Вступить в дополнительные рабочие чаты",
    lastActivity: "12.06.2026",
    recommendation: "написать напоминание"
  },
  {
    fullName: "Ольга Дьяченко",
    status: "Завершила маршрут",
    done: 52,
    lastStep: "Скорректировать дорожную карту с наставником",
    lastActivity: "19.06.2026",
    recommendation: "поздравить с завершением блока"
  },
  {
    fullName: "Алексей Иванов",
    status: "Завис на старте",
    done: 5,
    lastStep: "Заполнить профиль на 100%",
    lastActivity: "09.06.2026",
    recommendation: "назначить созвон"
  },
  {
    fullName: "Наталья Смирнова",
    status: "Технический вопрос",
    done: 22,
    lastStep: "Зафиксировать цель на 3 месяца",
    lastActivity: "17.06.2026",
    recommendation: "помочь с техническим шагом"
  }
];

const statsEl = document.querySelector("#adminStats");
const tableEl = document.querySelector("#partnersTable");
const detailsEl = document.querySelector("#partnerDetails");

function percent(done) {
  return Math.round((done / STEPS.length) * 100);
}

function renderStats() {
  const average = Math.round(demoPartners.reduce((sum, partner) => sum + percent(partner.done), 0) / demoPartners.length);
  const finished = demoPartners.filter((partner) => partner.done === STEPS.length).length;
  const starters = demoPartners.filter((partner) => partner.done <= 7).length;
  const attention = demoPartners.filter((partner) => partner.status.includes("Нужна") || partner.status.includes("Завис") || partner.status.includes("Технический")).length;
  const cards = [
    ["Всего партнёров", demoPartners.length],
    ["Средний прогресс", `${average}%`],
    ["Завершили маршрут", finished],
    ["Зависли на старте", starters],
    ["Требуют внимания", attention]
  ];
  statsEl.innerHTML = cards.map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`).join("");
}

function renderTable() {
  tableEl.innerHTML = demoPartners.map((partner, index) => `
    <tr data-index="${index}">
      <td>${partner.fullName}</td>
      <td><span class="status">${partner.status}</span></td>
      <td>${partner.done} из ${STEPS.length}</td>
      <td>
        <div class="mini-progress"><span style="width: ${percent(partner.done)}%"></span></div>
        ${percent(partner.done)}%
      </td>
      <td>${partner.lastStep}</td>
      <td>${partner.lastActivity}</td>
      <td>${partner.recommendation}</td>
    </tr>
  `).join("");

  tableEl.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => renderDetails(demoPartners[Number(row.dataset.index)]));
  });
}

function renderDetails(partner) {
  const doneSteps = STEPS.slice(0, partner.done);
  const pendingSteps = STEPS.slice(partner.done);
  const lagBlocks = [...new Set(pendingSteps.slice(0, 8).map((step) => step.block.replace(/^Блок \d+\.\s*/, "")))];

  detailsEl.innerHTML = `
    <h2>${partner.fullName}</h2>
    <p class="details-status">${partner.status}</p>
    <div class="progress-track"><div class="progress-fill" style="width: ${percent(partner.done)}%"></div></div>
    <p><strong>${partner.done} из ${STEPS.length}</strong> шагов · ${percent(partner.done)}%</p>
    <h3>Выполненные шаги</h3>
    <ul>${doneSteps.slice(-6).map((step) => `<li>${step.order}. ${step.title}</li>`).join("") || "<li>Пока нет</li>"}</ul>
    <h3>Невыполненные шаги</h3>
    <ul>${pendingSteps.slice(0, 6).map((step) => `<li>${step.order}. ${step.title}</li>`).join("") || "<li>Все шаги закрыты</li>"}</ul>
    <h3>Блоки, где есть отставание</h3>
    <div class="lag-list">${lagBlocks.map((block) => `<span class="badge">${block}</span>`).join("") || '<span class="badge">Отставаний нет</span>'}</div>
    <h3>Рекомендация администратору</h3>
    <p class="recommendation">${partner.recommendation}</p>
  `;
}

renderStats();
renderTable();
renderDetails(demoPartners[0]);
