/* =========================================================
   «Поступ» — адмін-панель (прототип)
   Рішення модерації зберігаються в localStorage браузера.
   ========================================================= */

const VIEWS = ["dashboard", "applications", "campaigns", "donations", "scholarships", "payouts"];

const CHECK_LABELS = {
  identity: "Особа", nmt: "НМТ", documents: "Документи", video: "Відео", endorsement: "Рекомендація"
};

function adminState() {
  const st = loadState();
  st.appStatus = st.appStatus || {};
  return st;
}

function appStatus(id) { return adminState().appStatus[id] || "pending"; }
function pendingCount() { return DB.applications.filter(a => appStatus(a.id) === "pending").length; }

/* ---------- Навігація ---------- */
function showView(name, btn) {
  VIEWS.forEach(v => {
    const el = document.getElementById("view-" + v);
    if (el) el.style.display = v === name ? "block" : "none";
  });
  document.querySelectorAll(".admin-side nav button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderAll();
}

/* ---------- Дашборд ---------- */
function renderDashboard() {
  const totalEscrow = DB.donationsFeed.filter(d => d.state === "escrow").reduce((a, d) => a + d.amount, 0)
    + DB.students.filter(s => s.status !== "enrolled").reduce((a, s) => a + s.raised, 0);
  const totalPaid = DB.payouts.filter(p => p.state === "done").reduce((a, p) => a + p.amount, 0)
    + DB.directPayouts.filter(p => p.state === "done").reduce((a, p) => a + p.amount, 0);
  const active = DB.students.filter(s => s.status !== "enrolled").length;
  const subs = DB.students.reduce((a, s) => a + s.monthlySupporters, 0);

  document.getElementById("kpis").innerHTML = `
    <div class="stat-tile"><div class="val">${fmtUAH(totalEscrow)}</div><div class="lbl">на ескроу-рахунку зараз</div><div class="delta">↑ 8% за тиждень</div></div>
    <div class="stat-tile"><div class="val">${fmtUAH(totalPaid)}</div><div class="lbl">виплачено (заклади + студенти)</div><div class="delta">↑ 2 виплати цього місяця</div></div>
    <div class="stat-tile"><div class="val">${active}</div><div class="lbl">активних зборів</div><div class="delta">↑ ${pendingCount()} заявки на модерації</div></div>
    <div class="stat-tile"><div class="val">${subs}</div><div class="lbl">активних підписок на студентів</div><div class="delta">↑ 14 за місяць</div></div>`;

  drawChart();
  renderCampaigns("dash-campaigns", 5);
}

/* Лінійний графік донатів по місяцях: одна серія, hover-підказка */
function drawChart() {
  const box = document.getElementById("chart");
  if (!box) return;
  const data = DB.monthlyDonations;
  const W = 960, H = 280, padL = 46, padR = 16, padT = 16, padB = 34;
  const maxV = Math.ceil(Math.max(...data.map(d => d.v)) / 100) * 100;
  const x = i => padL + i * (W - padL - padR) / (data.length - 1);
  const y = v => padT + (H - padT - padB) * (1 - v / maxV);

  const pts = data.map((d, i) => `${x(i)},${y(d.v)}`).join(" ");
  const area = `${padL},${y(0)} ${pts} ${x(data.length - 1)},${y(0)}`;

  const gridVals = [0, maxV / 4, maxV / 2, (3 * maxV) / 4, maxV];
  const grid = gridVals.map(v => `
    <line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" stroke="#e1e0d9" stroke-width="1"/>
    <text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#898781" font-family="Inter,system-ui,sans-serif">${v}</text>`).join("");

  const labels = data.map((d, i) => i % 2 === 0 ? `
    <text x="${x(i)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="#898781" font-family="Inter,system-ui,sans-serif">${d.m}</text>` : "").join("");

  box.innerHTML = `
    <svg id="chart-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
      ${grid}
      <polygon points="${area}" fill="#2a78d6" opacity="0.08"/>
      <polyline points="${pts}" fill="none" stroke="#2a78d6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <line id="ch-cross" y1="${padT}" y2="${H - padB}" stroke="#c3c2b7" stroke-width="1" stroke-dasharray="3 3" visibility="hidden"/>
      <circle id="ch-dot" r="4.5" fill="#2a78d6" stroke="#fff" stroke-width="2" visibility="hidden"/>
      <rect id="ch-hit" x="${padL}" y="${padT}" width="${W - padL - padR}" height="${H - padT - padB}" fill="transparent"/>
    </svg>
    <div class="chart-tip" id="ch-tip"></div>`;

  const svg = document.getElementById("chart-svg");
  const hit = document.getElementById("ch-hit");
  const tip = document.getElementById("ch-tip");
  const cross = document.getElementById("ch-cross");
  const dot = document.getElementById("ch-dot");

  hit.addEventListener("mousemove", e => {
    const r = svg.getBoundingClientRect();
    const sx = (e.clientX - r.left) * (W / r.width);
    let i = Math.round((sx - padL) / ((W - padL - padR) / (data.length - 1)));
    i = Math.max(0, Math.min(data.length - 1, i));
    const d = data[i];
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
    dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(d.v)); dot.setAttribute("visibility", "visible");
    tip.style.display = "block";
    tip.style.left = (x(i) * r.width / W) + "px";
    tip.style.top = (y(d.v) * r.height / H) + "px";
    tip.innerHTML = `${d.m}<br><b>${UAH.format(d.v * 1000)} ₴</b>`;
  });
  hit.addEventListener("mouseleave", () => {
    tip.style.display = "none";
    cross.setAttribute("visibility", "hidden");
    dot.setAttribute("visibility", "hidden");
  });
}

/* ---------- Активні збори ---------- */
function renderCampaigns(targetId, limit) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const list = [...DB.students].sort((a, b) => pct(b) - pct(a)).slice(0, limit || 99);
  el.innerHTML = list.map(s => {
    const p = pct(s);
    return `
    <div class="camp-row">
      <div><div class="cname">${s.name} <span class="status-pill ${STATUS_META[s.status].cls}" style="margin-left:6px">${STATUS_META[s.status].label}</span></div>
        <div class="cuni">${s.specialty} · ${s.university}</div></div>
      <div class="cnum">${fmtUAH(s.raised)}<br><span style="color:var(--muted);font-size:12px">із ${fmtUAH(s.goal)}</span></div>
      <div><div class="progress ${p >= 100 ? "full" : ""}"><i style="width:${p}%"></i></div></div>
      <div class="cpct">${p}%</div>
    </div>`;
  }).join("");
}

/* ---------- Модерація заявок ---------- */
function renderApplications() {
  const el = document.getElementById("app-list");
  if (!el) return;
  el.innerHTML = DB.applications.map(a => {
    const st = appStatus(a.id);
    const allOk = Object.values(a.checks).every(Boolean);
    return `
    <div class="mod-card">
      <div class="who">
        <b>${a.name}</b> — ${a.specialty}, ${a.university}
        <div class="meta">${a.city} · мета збору: ${fmtUAH(a.goal)} · подано ${a.submitted} · ${a.categories.join(", ")}</div>
        <div class="check-row">
          ${Object.entries(a.checks).map(([k, ok]) =>
            `<span class="check ${ok ? "ok" : "miss"}">${ok ? "✓" : "✗"} ${CHECK_LABELS[k]}</span>`).join("")}
        </div>
      </div>
      <div class="mod-actions">
        ${st === "pending" ? `
          <button class="btn btn-sm btn-good" ${allOk ? "" : 'title="Не всі перевірки пройдено"'} onclick="decideApp('${a.id}','approved')">✓ Опублікувати</button>
          <button class="btn btn-sm btn-light" onclick="decideApp('${a.id}','info')">? Запит документів</button>
          <button class="btn btn-sm btn-danger" onclick="decideApp('${a.id}','rejected')">✗ Відхилити</button>`
        : st === "approved" ? `<span class="pill done">✓ Опубліковано</span><button class="btn btn-sm btn-light" onclick="decideApp('${a.id}','pending')">Повернути</button>`
        : st === "info" ? `<span class="pill scheduled">⏳ Очікує документи</span><button class="btn btn-sm btn-light" onclick="decideApp('${a.id}','pending')">Повернути</button>`
        : `<span class="pill rejected">✗ Відхилено</span><button class="btn btn-sm btn-light" onclick="decideApp('${a.id}','pending')">Повернути</button>`}
      </div>
    </div>`;
  }).join("");
  const badge = document.getElementById("badge-apps");
  if (badge) badge.textContent = pendingCount();
}

function decideApp(id, status) {
  const st = adminState();
  st.appStatus[id] = status;
  saveState(st);
  renderAll();
}

/* ---------- Донати ---------- */
function renderDonations() {
  const el = document.getElementById("don-rows");
  if (!el) return;
  el.innerHTML = DB.donationsFeed.map(d => `
    <tr>
      <td>${d.date}</td>
      <td class="strong">${d.donor}</td>
      <td>${d.target}</td>
      <td>${d.type}</td>
      <td class="num strong">${fmtUAH(d.amount)}</td>
      <td>${d.state === "escrow" ? '<span class="pill escrow">🏦 На ескроу</span>' : '<span class="pill paid">✓ Передано у виш</span>'}</td>
    </tr>`).join("");
}

/* ---------- Стипендії ---------- */
function renderScholarshipsAdmin() {
  const el = document.getElementById("sch-rows");
  if (!el) return;
  el.innerHTML = DB.scholarships.map(s => `
    <tr>
      <td class="strong">${s.name}</td>
      <td>${s.founder}</td>
      <td>${s.type}</td>
      <td class="num">${fmtUAH(s.monthly)}</td>
      <td class="num">${s.recipients}</td>
      <td class="num strong">${fmtUAH(s.capital)}</td>
    </tr>`).join("");
}

/* ---------- Виплати ---------- */
function renderPayouts() {
  const el = document.getElementById("pay-rows");
  if (el) {
    el.innerHTML = DB.payouts.map(p => `
      <tr>
        <td>${p.date}</td>
        <td class="strong">${p.university}</td>
        <td>${p.student}</td>
        <td>${p.purpose}</td>
        <td class="num strong">${fmtUAH(p.amount)}</td>
        <td>${p.state === "done" ? '<span class="pill done">✓ Виконано</span>' : '<span class="pill scheduled">🕐 Заплановано</span>'}</td>
        <td>${p.doc}</td>
      </tr>`).join("");
  }
  const elDirect = document.getElementById("direct-pay-rows");
  if (elDirect) {
    elDirect.innerHTML = DB.directPayouts.map(p => `
      <tr>
        <td>${p.date}</td>
        <td class="strong">${p.recipient}</td>
        <td>${p.purpose}</td>
        <td class="num strong">${fmtUAH(p.amount)}</td>
        <td>${p.state === "done" ? '<span class="pill done">✓ Виконано</span>' : '<span class="pill scheduled">🕐 Заплановано</span>'}</td>
        <td>${p.doc}</td>
      </tr>`).join("");
  }
}

function renderAll() {
  renderDashboard();
  renderApplications();
  renderCampaigns("camp-list");
  renderDonations();
  renderScholarshipsAdmin();
  renderPayouts();
}

document.addEventListener("DOMContentLoaded", () => {
  showView("dashboard", document.querySelector(".admin-side nav button"));
});
