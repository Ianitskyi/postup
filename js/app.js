/* =========================================================
   «Поступ» — логіка публічної частини (прототип, без бекенду)
   ========================================================= */

function avatarStyle(s) {
  return `background: linear-gradient(135deg, hsl(${s.hue} 62% 46%), hsl(${(s.hue + 40) % 360} 70% 58%))`;
}

function avatarHtml(s, cls) {
  const inner = s.photo ? `<img src="${s.photo}" alt="Портрет: ${s.name}">` : s.initials;
  return `<div class="avatar ${cls || ""}" style="${avatarStyle(s)}">${inner}</div>`;
}

function studentCard(s) {
  const p = pct(s);
  const st = STATUS_META[s.status];
  return `
  <a class="student-card" href="student.html?id=${s.id}">
    <div class="card-top">
      ${avatarHtml(s)}
      <div class="who">
        <div class="name">${s.name} ${s.verified ? '<span class="vbadge" title="Профіль верифіковано">✔</span>' : ""}</div>
        <div class="meta">${s.age} р. · ${s.city}</div>
      </div>
    </div>
    <div class="card-body">
      <div class="aim">${s.specialty} · ${s.university}</div>
      <p class="excerpt">${s.excerpt}</p>
      <div class="chip-row">
        <span class="status-pill ${st.cls}">${st.label}</span>
        ${isPartnerUni(s.university) ? '<span class="chip good">🤝 Виш-партнер</span>' : ""}
        ${s.categories.map(c => `<span class="chip">${c}</span>`).join("")}
      </div>
    </div>
    <div class="card-funding">
      <div class="progress ${p >= 100 ? "full" : ""}"><i style="width:${p}%"></i></div>
      <div class="fund-row">
        <span><b>${fmtUAH(s.raised)}</b> із ${fmtUAH(s.goal)}</span>
        <span>${p}% · ${s.supporters} доброчинців</span>
      </div>
    </div>
  </a>`;
}

/* ---------- Головна ---------- */
function initHome() {
  const featured = ["olesia-kovalchuk", "kateryna-hlushko", "yaryna-melnyk"]
    .map(id => DB.students.find(s => s.id === id));
  document.getElementById("featured").innerHTML = featured.map(studentCard).join("");

  const totalRaised = DB.students.reduce((a, s) => a + s.raised, 0);
  const enrolled = DB.students.filter(s => s.status === "enrolled").length;
  const donors = DB.students.reduce((a, s) => a + s.supporters, 0);
  setText("stat-raised", fmtUAH(totalRaised));
  setText("stat-students", DB.students.length);
  setText("stat-donors", UAH.format(donors));
  setText("stat-scholarships", DB.scholarships.length);

  const hc = DB.students.find(s => s.id === "maksym-bondar");
  const holder = document.getElementById("hero-student");
  if (holder && hc) holder.innerHTML = studentCard(hc);
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

/* ---------- Каталог ---------- */
function initCatalog() {
  const $q = document.getElementById("f-q");
  const $field = document.getElementById("f-field");
  const $uni = document.getElementById("f-uni");
  const $cat = document.getElementById("f-cat");

  fillSelect($field, DB.filters.fields, "Усі галузі");
  fillSelect($uni, DB.filters.universities, "Усі університети");
  fillSelect($cat, DB.filters.categories, "Будь-який критерій");

  const params = new URLSearchParams(location.search);
  if (params.get("cat")) $cat.value = params.get("cat");
  if (params.get("field")) $field.value = params.get("field");

  function apply() {
    const q = $q.value.trim().toLowerCase();
    const res = DB.students.filter(s =>
      (!q || (s.name + " " + s.specialty + " " + s.city + " " + s.university).toLowerCase().includes(q)) &&
      (!$field.value || s.field === $field.value) &&
      (!$uni.value || s.university === $uni.value) &&
      (!$cat.value || s.categories.includes($cat.value))
    );
    document.getElementById("catalog").innerHTML =
      res.length ? res.map(studentCard).join("")
                 : `<p style="grid-column:1/-1;color:var(--muted);padding:30px 0">Нікого не знайдено за цими критеріями. Спробуйте змінити фільтри.</p>`;
    document.getElementById("count").textContent =
      `Показано ${res.length} з ${DB.students.length} верифікованих вступників`;
  }
  [$q, $field, $uni, $cat].forEach(el => el.addEventListener("input", apply));
  document.getElementById("f-reset").addEventListener("click", () => {
    $q.value = ""; $field.value = ""; $uni.value = ""; $cat.value = ""; apply();
  });
  apply();
}

function fillSelect(sel, items, placeholder) {
  sel.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(i => `<option>${i}</option>`).join("");
}

/* ---------- Профіль ---------- */
function initProfile() {
  const id = new URLSearchParams(location.search).get("id") || DB.students[0].id;
  const s = DB.students.find(x => x.id === id) || DB.students[0];
  const st = STATUS_META[s.status];
  document.title = `${s.name} — Поступ`;

  document.getElementById("p-hero").innerHTML = `
    <div class="profile-top">
      ${avatarHtml(s, "lg")}
      <div class="who">
        <h1>${s.name} ${s.verified ? '<span class="vbadge" title="Верифіковано">✔</span>' : ""}</h1>
        <div class="meta">${s.age} років · ${s.city} · вступає: <b>${s.specialty}, ${s.university}</b></div>
        <div class="chip-row">
          <span class="status-pill ${st.cls}">● ${s.statusLabel}</span>
          ${isPartnerUni(s.university) ? '<span class="chip good" title="Виш підтверджує зарахування і приймає виплати за прямою процедурою">🤝 Виш-партнер</span>' : ""}
          ${s.categories.map(c => `<span class="chip">${c}</span>`).join("")}
        </div>
      </div>
    </div>`;

  document.getElementById("p-main").innerHTML = `
    ${s.video ? `
    <div class="panel">
      <div class="video-ph" onclick="openModal('🎬','Відеовізитка','У прототипі відео не завантажене — тут відтворюватиметься 2-хвилинна візитка вступника.')">
        <div class="play">▶</div>
        <div class="cap">Відеовізитка · 2 хв</div>
      </div>
    </div>` : ""}
    <div class="panel">
      <h2>Мотиваційний лист</h2>
      <div class="letter">${s.letter.split("\n\n").map(p => `<p>${p}</p>`).join("")}</div>
    </div>
    <div class="panel">
      <h2>Досягнення та аргументи</h2>
      <div class="ach-list">
        ${s.achievements.map(a => `
          <div class="ach"><div class="ico">${a.icon}</div>
            <div><b>${a.title}</b><span>${a.detail}</span></div></div>`).join("")}
      </div>
    </div>
    <div class="panel">
      <h2>Рекомендації</h2>
      ${s.endorsements.map(e => `
        <div class="endorse"><p>«${e.text}»</p>
          <div class="by"><b>${e.by}</b> — ${e.role}</div></div>`).join("")}
    </div>
    <div class="panel">
      <h2>Хід вступу — публічний звіт</h2>
      <ul class="timeline">
        ${s.timeline.map(t => `
          <li class="${t.done ? "done" : ""}">
            <div class="tl-dot">${t.done ? "✓" : "•"}</div>
            <div class="tl-body"><b>${t.title}</b><span>${t.date}</span></div>
          </li>`).join("")}
      </ul>
    </div>`;

  renderDonatePanel(s);
}

let donateType = "once";
let donateAmount = 500;

function renderDonatePanel(s) {
  donateType = "once"; donateAmount = 500;
  const p = pct(s);
  document.getElementById("p-side").innerHTML = `
    <div class="panel donate-panel">
      <div class="big-progress">
        <div class="progress ${p >= 100 ? "full" : ""}" style="height:10px"><i style="width:${p}%"></i></div>
        <div class="fund-row">
          <span><b>${fmtUAH(s.raised)}</b><br><span style="font-size:12.5px">зібрано з ${fmtUAH(s.goal)}</span></span>
          <span style="text-align:right"><b style="color:var(--ink)">${p}%</b><br><span style="font-size:12.5px">${s.supporters} доброчинців</span></span>
        </div>
      </div>

      <div class="seg" role="tablist">
        <button class="active" onclick="setDonateType('once', this)">Разова допомога</button>
        <button onclick="setDonateType('monthly', this)">Підписка на студента</button>
      </div>
      <div class="subscribe-hint" id="sub-hint">
        Щомісячна підтримка: стипендія, проживання та харчування. Ви отримуватимете звіти про навчання щосеместру. ${s.monthlySupporters} людей уже підписані, скасувати можна будь-коли.
      </div>

      <div class="amount-grid">
        ${[200, 500, 1000, 2000, 5000, 10000].map(a => `
          <button class="amount-btn ${a === 500 ? "active" : ""}" onclick="setAmount(${a}, this)">${UAH.format(a)} ₴</button>`).join("")}
      </div>

      <div class="fallback-choice">
        <div class="fc-label">Якщо кошти не знадобляться на контракт (не вступив, недозбір, пройшов на бюджет чи отримав інший грант) — розставте пріоритети:</div>
        <div class="fb-row"><select class="fb-pr" data-key="stipend" onchange="fbReorder(this)" data-prev="1"><option selected>1</option><option>2</option><option>3</option></select><span>Залишити цьому студенту — щомісячною стипендією на навчання (житло, харчування, матеріали)</span></div>
        <div class="fb-row"><select class="fb-pr" data-key="redirect" onchange="fbReorder(this)" data-prev="2"><option>1</option><option selected>2</option><option>3</option></select><span>Передати іншому вступнику на мій вибір</span></div>
        <div class="fb-row"><select class="fb-pr" data-key="refund" onchange="fbReorder(this)" data-prev="3"><option>1</option><option>2</option><option selected>3</option></select><span>Повернути мені — 100%, без жодних комісій</span></div>
      </div>

      <label class="tip-row">
        <input type="checkbox" id="tip-check">
        <span>Додати <b id="tip-amt">${UAH.format(Math.round(donateAmount * 0.05))} ₴</b> (5%) на роботу платформи — необов'язково. Так ви допомагаєте нам перевіряти профілі та тримати комісію на рівні 1%.</span>
      </label>

      <button class="btn btn-accent" style="width:100%;margin-top:16px" onclick="donate('${s.id}')">Підтримати</button>

      <div class="guarantee">
        <div class="gi">🛡️</div>
        <div>
          <b>Гарантія повернення коштів</b>
          <span>Гроші зберігаються на рахунку банку-партнера й передаються <u>напряму університету</u>. Якщо кошти не знадобляться — недозбір, бюджет, інший грант — спрацюють <u>пріоритети, які ви щойно розставили</u>; змінити їх можна будь-коли. Повернення — <u>справді 100%</u>: комісію 1% не утримуємо, банківські комісії покриває платформа. <a href="faq.html">Детальніше у FAQ</a></span>
        </div>
      </div>
    </div>`;
  /* Кнопка без відмінювання, простіше і граматично безпечно */
  const btn = document.querySelector(".donate-panel .btn-accent");
  if (btn) btn.textContent = "Підтримати · " + UAH.format(donateAmount) + " ₴";
}

function setDonateType(t, el) {
  donateType = t;
  el.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("sub-hint").style.display = t === "monthly" ? "block" : "none";
}
function setAmount(a, el) {
  donateAmount = a;
  el.parentElement.querySelectorAll(".amount-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  const btn = document.querySelector(".donate-panel .btn-accent");
  if (btn) btn.textContent = "Підтримати · " + UAH.format(a) + " ₴";
  const tip = document.getElementById("tip-amt");
  if (tip) tip.textContent = UAH.format(Math.round(a * 0.05)) + " ₴";
}

function donate(studentId) {
  const st = loadState();
  st.extraRaised = st.extraRaised || {};
  const cur = st.extraRaised[studentId] || { sum: 0, count: 0 };
  cur.sum += donateAmount; cur.count += 1;
  st.extraRaised[studentId] = cur;
  saveState(st);

  const tipOn = document.getElementById("tip-check")?.checked;
  const tip = tipOn ? Math.round(donateAmount * 0.05) : 0;
  const tipMsg = tip ? ` Окремо ${UAH.format(tip)} ₴ піде на роботу платформи — дякуємо!` : "";
  const FB_LABELS = {
    stipend: "стипендія цьому студенту",
    redirect: "інший вступник",
    refund: "повернення 100%"
  };
  const prio = [...document.querySelectorAll(".fallback-choice select")]
    .map(s => ({ k: s.dataset.key, v: +s.value }))
    .sort((a, b) => a.v - b.v);
  const fbMsg = prio.length
    ? ` Ваші пріоритети на випадок, якщо кошти не знадобляться на контракт: ${prio.map((p, i) => `${i + 1}) ${FB_LABELS[p.k]}`).join("; ")}.`
    : "";

  const s = DB.students.find(x => x.id === studentId);
  openModal(
    donateType === "monthly" ? "💛" : "🎉",
    donateType === "monthly" ? "Підписку оформлено (демо)" : "Дякуємо за підтримку! (демо)",
    donateType === "monthly"
      ? `У робочій версії тут відбудеться оформлення щомісячного платежу ${UAH.format(donateAmount)} ₴ через платіжний сервіс. Кошти щомісяця надходитимуть на цільовий рахунок для ${s.name}.${fbMsg}${tipMsg}`
      : `У робочій версії тут відкриється сторінка оплати. ${UAH.format(donateAmount)} ₴ буде зараховано на ескроу-рахунок збору для ${s.name}.${fbMsg}${tipMsg} Прогрес на сторінці вже оновлено.`
  );
  setTimeout(() => { initProfile(); }, 400);
}

/* ---------- Стипендії ---------- */
function initScholarships() {
  document.getElementById("sch-list").innerHTML = DB.scholarships.map(sc => `
    <div class="sch-card">
      <div class="sch-head">
        <div>
          <h3>${sc.name}</h3>
          <div class="founder">Засновник: ${sc.founder}</div>
        </div>
        <div class="chip-row" style="justify-content:flex-end;margin:0">
          <span class="chip ${sc.mode === "once" ? "accent" : "brand"}">${sc.mode === "once" ? "🎯 Разова · на вступ" : "📆 Регулярна · на навчання"}</span>
          <span class="chip">${sc.type}</span>
        </div>
      </div>
      <div class="criteria">🎯 ${sc.criteria}</div>
      <p style="font-size:14px;color:var(--ink-2)">${sc.description}</p>
      <div class="sch-nums">
        ${sc.mode === "once"
          ? `<div class="n"><b>${fmtUAH(sc.amount)}</b><span>одноразово / особу</span></div>`
          : `<div class="n"><b>${fmtUAH(sc.monthly)}</b><span>щомісяця / особу</span></div>`}
        <div class="n"><b>${sc.recipients}</b><span>отримувачів</span></div>
        <div class="n"><b>${fmtUAH(sc.capital)}</b><span>фонд стипендії</span></div>
      </div>
      <button class="btn btn-ghost btn-sm" style="align-self:flex-start"
        onclick="openModal('💰','Поповнення фонду (демо)','У робочій версії тут можна доєднатися до фонду цієї стипендії разовим внеском або підпискою.')">
        Доєднатися до фонду</button>
    </div>`).join("");
}

/* Пріоритети: обмін значеннями, щоб не було двох однакових */
function fbReorder(changed) {
  const sels = [...document.querySelectorAll(".fallback-choice select")];
  const dup = sels.find(s => s !== changed && s.value === changed.value);
  if (dup) dup.value = changed.dataset.prev;
  sels.forEach(s => (s.dataset.prev = s.value));
}

/* ---------- Банер cookies ---------- */
(function cookieNotice() {
  let seen = false;
  try { seen = !!localStorage.getItem("postup-cookie-ok"); } catch { seen = true; }
  if (seen) return;
  const bar = document.createElement("div");
  bar.className = "cookie-bar";
  bar.innerHTML = `
    <span>🍪 Ми не використовуємо рекламних трекерів — лише технічне збереження налаштувань у вашому браузері.
      <a href="policies.html#cookies">Політика cookies</a></span>
    <button class="btn btn-sm btn-accent">Зрозуміло</button>`;
  bar.querySelector("button").addEventListener("click", () => {
    try { localStorage.setItem("postup-cookie-ok", "1"); } catch {}
    bar.remove();
  });
  document.body.appendChild(bar);
})();

/* ---------- Модалка ---------- */
function openModal(emoji, title, text) {
  let back = document.getElementById("modal-back");
  if (!back) {
    back = document.createElement("div");
    back.id = "modal-back"; back.className = "modal-back";
    back.innerHTML = `<div class="modal"><div class="emoji"></div><h3></h3><p></p>
      <button class="btn btn-primary" onclick="closeModal()">Зрозуміло</button></div>`;
    back.addEventListener("click", e => { if (e.target === back) closeModal(); });
    document.body.appendChild(back);
  }
  back.querySelector(".emoji").textContent = emoji;
  back.querySelector("h3").textContent = title;
  back.querySelector("p").textContent = text;
  back.classList.add("open");
}
function closeModal() { document.getElementById("modal-back").classList.remove("open"); }
