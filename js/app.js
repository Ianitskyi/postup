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

/* ---------- Віджет "Поділитися": іконка → спливне меню з варіантами ---------- */
const SHARE_ICON_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/></svg>';

function shareWidgetHtml(url, title, label) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const safeUrl = url.replace(/'/g, "\\'");
  const safeTitle = title.replace(/'/g, "\\'");
  const links = [
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { name: "X (Twitter)", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { name: "Email", href: `mailto:?subject=${t}&body=${u}` }
  ];
  return `
    <div class="share-widget">
      ${label ? `<span class="share-label">${label}</span>` : ""}
      <button type="button" class="share-icon-btn" aria-label="Поділитися" title="Поділитися"
        onclick="handleShareClick(this,'${safeUrl}','${safeTitle}')">${SHARE_ICON_SVG}</button>
      <div class="share-menu">
        ${links.map(l => `<a href="${l.href}" target="_blank" rel="noopener">${l.name}</a>`).join("")}
        <button type="button" onclick="copyShareLink('${safeUrl}', this)">Копіювати посилання</button>
      </div>
    </div>`;
}
function handleShareClick(btn, url, title) {
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    toggleShareMenu(btn);
  }
}
function toggleShareMenu(btn) {
  const widget = btn.closest(".share-widget");
  const menu = widget.querySelector(".share-menu");
  const isOpen = menu.classList.contains("open");
  document.querySelectorAll(".share-menu.open").forEach(m => m.classList.remove("open"));
  if (isOpen) return;
  menu.classList.add("open");
  setTimeout(() => {
    document.addEventListener("click", function closeOnce(e) {
      if (!widget.contains(e.target)) {
        menu.classList.remove("open");
        document.removeEventListener("click", closeOnce);
      }
    });
  }, 0);
}
function copyShareLink(url, btn) {
  const done = () => {
    const original = btn.textContent;
    btn.textContent = "Скопійовано ✓";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = original; btn.classList.remove("copied"); }, 1800);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
  } else {
    fallbackCopy(url, done);
  }
}
function fallbackCopy(url, done) {
  const ta = document.createElement("textarea");
  ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); done(); } catch (e) {}
  document.body.removeChild(ta);
}
// Коли хтось переходить за поділеним посиланням на конкретну стипендію (#sch-id),
// прокручуємо до неї і на мить підсвічуємо, щоб було зрозуміло, яка саме мається на увазі.
function highlightHashTarget() {
  const hash = location.hash.slice(1);
  if (!hash) return;
  const el = document.getElementById(hash);
  if (!el || !el.classList.contains("sch-card")) return;
  setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-pulse");
    setTimeout(() => el.classList.remove("highlight-pulse"), 2200);
  }, 50);
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
        ${s.levelType === "Коледж" ? '<span class="chip brand">🏫 Фаховий коледж</span>' : ""}
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
  const $level = document.getElementById("f-level");

  fillSelect($field, DB.filters.fields, "Усі галузі");
  fillSelect($uni, DB.filters.universities, "Усі заклади освіти");
  fillSelect($cat, DB.filters.categories, "Будь-який критерій");
  fillSelect($level, DB.filters.levels, "ЗВО та коледжі");

  const params = new URLSearchParams(location.search);
  if (params.get("cat")) $cat.value = params.get("cat");
  if (params.get("field")) $field.value = params.get("field");

  function apply() {
    const q = $q.value.trim().toLowerCase();
    const res = DB.students.filter(s =>
      (!q || (s.name + " " + s.specialty + " " + s.city + " " + s.university).toLowerCase().includes(q)) &&
      (!$field.value || s.field === $field.value) &&
      (!$uni.value || s.university === $uni.value) &&
      (!$cat.value || s.categories.includes($cat.value)) &&
      (!$level.value || (s.levelType || "ЗВО") === $level.value)
    );
    document.getElementById("catalog").innerHTML =
      res.length ? res.map(studentCard).join("")
                 : `<p style="grid-column:1/-1;color:var(--muted);padding:30px 0">Нікого не знайдено за цими критеріями. Спробуйте змінити фільтри.</p>`;
    document.getElementById("count").textContent =
      `Показано ${res.length} з ${DB.students.length} верифікованих вступників`;
  }
  [$q, $field, $uni, $cat, $level].forEach(el => el.addEventListener("input", apply));
  document.getElementById("f-reset").addEventListener("click", () => {
    $q.value = ""; $field.value = ""; $uni.value = ""; $cat.value = ""; $level.value = ""; apply();
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
          ${s.levelType === "Коледж" ? '<span class="chip brand">🏫 Фаховий коледж</span>' : ""}
          ${s.categories.map(c => `<span class="chip">${c}</span>`).join("")}
        </div>
        ${shareWidgetHtml(`${location.origin}${location.pathname}?id=${s.id}`, `${s.name} — Поступ`)}
      </div>
    </div>`;

  document.getElementById("p-main").innerHTML = `
    ${s.video ? `
    <div class="panel">
      <div class="video-ph" role="button" tabindex="0" aria-label="Відтворити відеовізитку" onclick="openModal('🎬','Відеовізитка','У прототипі відео не завантажене — тут відтворюватиметься 2-хвилинна візитка вступника.')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">
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
      <p class="sub-note">Кожен пункт перевірено командою платформи за офіційними джерелами перед публікацією профілю. Самі документи не публікуються — це б розкрило приватні дані.</p>
      <div class="ach-list">
        ${s.achievements.map(a => `
          <div class="ach"><div class="ico">${a.icon}</div>
            <div><b>${a.title} <span class="verified-mark" title="Перевірено командою платформи">✔ перевірено</span></b><span>${a.detail}</span></div></div>`).join("")}
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
    </div>
    ${s.thankYou ? `
    <div class="panel">
      <h2>🙏 Подяка донорам</h2>
      <p class="letter" style="font-style:italic">«${s.thankYou}»</p>
    </div>` : ""}`;

  renderDonatePanel(s);
  renderMobileDonateBar(s);
}

// На мобільному .donate-panel втрачає sticky-позицію (стає одноколонковий
// лейаут) і опиняється в самому кінці довгої сторінки профілю. Ця плашка —
// швидкий доступ до підтримки, не чекаючи прогортання через весь профіль.
function renderMobileDonateBar(s) {
  let bar = document.getElementById("mobile-donate-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "mobile-donate-bar";
    bar.className = "mobile-donate-bar";
    document.body.appendChild(bar);
  }
  bar.innerHTML = `<button class="btn btn-accent" onclick="document.getElementById('donate-panel').scrollIntoView({behavior:'smooth', block:'start'})">💛 Підтримати ${s.name.split(" ")[0]}</button>`;
}

let donateType = "once";
let donateAmount = 500;

let redirectChoiceId = null;
let redirectChoiceName = null;
let currentProfileId = null;

function renderDonatePanel(s) {
  donateType = "once"; donateAmount = 500;
  redirectChoiceId = null; redirectChoiceName = null;
  currentProfileId = s.id;
  const p = pct(s);
  document.getElementById("p-side").innerHTML = `
    <div class="panel donate-panel" id="donate-panel">
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
        Щомісячна підтримка йде <b>напряму на рахунок ${s.name.split(" ")[0]}</b>: стипендія, проживання та харчування. Ви отримуватимете звіти про навчання щосеместру. ${s.monthlySupporters} людей уже підписані, скасувати можна будь-коли.
      </div>

      <div class="amount-grid">
        ${[200, 500, 1000, 2000, 5000, 10000].map(a => `
          <button class="amount-btn ${a === 500 ? "active" : ""}" onclick="setAmount(${a}, this)">${UAH.format(a)} ₴</button>`).join("")}
      </div>

      <div class="fallback-choice">
        <div class="fc-label">Якщо кошти не знадобляться на контракт (не вступив, недозбір, пройшов на бюджет чи отримав інший грант) — розставте пріоритети:</div>
        <div class="fb-row"><select class="fb-pr" data-key="stipend" onchange="fbReorder(this)" data-prev="1"><option selected>1</option><option>2</option><option>3</option></select><span>Залишити цьому студенту — щомісячною стипендією на навчання (житло, харчування, матеріали)</span></div>
        <div class="fb-row"><select class="fb-pr" data-key="redirect" onchange="fbReorder(this)" data-prev="2"><option>1</option><option selected>2</option><option>3</option></select><span>Передати іншому вступнику — <a href="#" id="redirect-choice-label" onclick="openStudentPicker('${s.id}');return false">оберіть кого саме</a></span></div>
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
          <b id="guarantee-title">Гарантія повернення коштів</b>
          <span id="guarantee-text"></span>
        </div>
      </div>
    </div>`;
  /* Кнопка без відмінювання, простіше і граматично безпечно */
  const btn = document.querySelector(".donate-panel .btn-accent");
  if (btn) btn.textContent = "Підтримати · " + UAH.format(donateAmount) + " ₴";
  updateGuaranteeText();
}

const GUARANTEE_TEXT = {
  once: 'Гроші на вступ зберігаються на рахунку банку-партнера й передаються <u>напряму закладу освіти</u>, ніколи на картку студента. Якщо кошти не знадобляться — недозбір, бюджет, інший грант — спрацюють <u>пріоритети, які ви щойно розставили</u>; змінити їх можна будь-коли. Повернення — <u>справді 100%</u>: комісію 1% не утримуємо, банківські комісії покриває платформа. <a href="how-it-works.html#faq">Детальніше у FAQ</a>',
  monthly: 'Щомісячна стипендія — це вже не оплата вступу, тому надходить <u>напряму на банківський рахунок студента</u> щомісяця, поки він лишається студентом і кошти фонду не вичерпані — без звітів про оцінки чи сесію. Підписку можна скасувати будь-коли, а невикористані кошти на випадок недозбору чи невступу — <u>ваші пріоритети, розставлені вище</u>. <a href="how-it-works.html#faq">Детальніше у FAQ</a>'
};
function updateGuaranteeText() {
  const el = document.getElementById("guarantee-text");
  if (el) el.innerHTML = GUARANTEE_TEXT[donateType];
}

function setDonateType(t, el) {
  donateType = t;
  el.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("sub-hint").style.display = t === "monthly" ? "block" : "none";
  updateGuaranteeText();
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
    redirect: redirectChoiceName ? `передати — ${redirectChoiceName}` : "інший вступник (платформа обере за подібними критеріями)",
    refund: "повернення 100%"
  };
  const prio = [...document.querySelectorAll(".fallback-choice select")]
    .map(s => ({ k: s.dataset.key, v: +s.value }))
    .sort((a, b) => a.v - b.v);
  const fbMsg = prio.length
    ? ` Ваші пріоритети на випадок, якщо кошти не знадобляться на контракт: ${prio.map((p, i) => `${i + 1}) ${FB_LABELS[p.k]}`).join("; ")}.`
    : "";

  const s = DB.students.find(x => x.id === studentId);
  const profileUrl = `${location.origin}${location.pathname}?id=${s.id}`;
  openModal(
    donateType === "monthly" ? "💛" : "🎉",
    donateType === "monthly" ? "Підписку оформлено (демо)" : "Дякуємо за підтримку! (демо)",
    donateType === "monthly"
      ? `У робочій версії тут відбудеться оформлення щомісячного платежу ${UAH.format(donateAmount)} ₴ через платіжний сервіс. Кошти щомісяця надходитимуть напряму на банківський рахунок ${s.name}.${fbMsg}${tipMsg}`
      : `У робочій версії тут відкриється сторінка оплати. ${UAH.format(donateAmount)} ₴ буде зараховано на ескроу-рахунок збору для ${s.name}.${fbMsg}${tipMsg} Прогрес на сторінці вже оновлено.`,
    shareWidgetHtml(profileUrl, `${s.name} — Поступ`, `${s.name} — поділіться профілем:`)
  );
  setTimeout(() => { initProfile(); }, 400);
}

/* ---------- Стипендії ---------- */
function initScholarships() {
  document.getElementById("sch-list").innerHTML = DB.scholarships.map(sc => `
    <div class="sch-card" id="${sc.id}">
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
      ${shareWidgetHtml(`${location.origin}${location.pathname}#${sc.id}`, `${sc.name} — Поступ`)}
    </div>`).join("");
  highlightHashTarget();
}

/* Той самий список стипендій, але для вступника — з кнопкою подачі заявки */
function initApplyScholarships() {
  document.getElementById("sch-apply-list").innerHTML = DB.scholarships.map(sc => `
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
        <div class="n"><b>${sc.recipients}</b><span>отримувачів зараз</span></div>
      </div>
      <button class="btn btn-accent btn-sm" style="align-self:flex-start"
        onclick="openModal('🏅','Заявка на стипендію (демо)','У робочій версії тут відкриється форма подачі заявки на цю стипендію: ваш профіль звірять із критеріями відбору, а засновник стипендії затвердить кандидатів.')">
        Податися на цю стипендію</button>
    </div>`).join("");
}

/* Пріоритети: обмін значеннями, щоб не було двох однакових */
function fbReorder(changed) {
  const sels = [...document.querySelectorAll(".fallback-choice select")];
  const dup = sels.find(s => s !== changed && s.value === changed.value);
  if (dup) dup.value = changed.dataset.prev;
  sels.forEach(s => (s.dataset.prev = s.value));
}

/* ---------- Вибір вступника для пункту "передати іншому" ---------- */
let pickerOthers = [];
const PICKER_LIMIT = 30;

function openStudentPicker(currentId) {
  pickerOthers = DB.students.filter(x => x.id !== currentId && x.verified);
  let back = document.getElementById("picker-back");
  if (!back) {
    back = document.createElement("div");
    back.id = "picker-back"; back.className = "modal-back";
    back.addEventListener("click", e => { if (e.target === back) closeStudentPicker(); });
    document.body.appendChild(back);
  }
  back.innerHTML = `
    <div class="modal picker-modal">
      <h3>Кому передати кошти</h3>
      <p>Якщо кошти не знадобляться на контракт цього вступника, оберіть, кому їх передати:</p>
      <input type="text" class="picker-search" placeholder="Пошук за іменем, спеціальністю чи закладом освіти…" oninput="filterStudentPicker(this.value)">
      <div class="picker-list" id="picker-list-body"></div>
      <button class="btn btn-light" style="margin-top:14px" onclick="closeStudentPicker()">Скасувати</button>
    </div>`;
  renderPickerList(pickerOthers);
  back.classList.add("open");
  setTimeout(() => back.querySelector(".picker-search")?.focus(), 50);
}
function renderPickerList(list) {
  const body = document.getElementById("picker-list-body");
  if (!body) return;
  if (!list.length) {
    body.innerHTML = `<div class="picker-empty">Нічого не знайдено. Спробуйте інший запит.</div>`;
    return;
  }
  const shown = list.slice(0, PICKER_LIMIT);
  body.innerHTML = shown.map(o => `
    <button type="button" class="picker-row" onclick="chooseRedirectStudent('${o.id}', '${o.name.replace(/'/g, "\\'")}')">
      ${avatarHtml(o)}
      <div class="who"><b>${o.name}</b><span>${o.specialty}, ${o.university}</span></div>
    </button>`).join("")
    + (list.length > shown.length
      ? `<div class="picker-more">Показано ${shown.length} із ${list.length} — уточніть пошук, щоб звузити список.</div>`
      : "");
}
function filterStudentPicker(query) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? pickerOthers.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.specialty.toLowerCase().includes(q) ||
        o.university.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q))
    : pickerOthers;
  renderPickerList(filtered);
}
function closeStudentPicker() {
  document.getElementById("picker-back")?.classList.remove("open");
}
function chooseRedirectStudent(id, name) {
  redirectChoiceId = id;
  redirectChoiceName = name;
  const label = document.getElementById("redirect-choice-label");
  if (label) { label.textContent = name; label.setAttribute("onclick", `openStudentPicker('${currentProfileId}');return false`); }
  closeStudentPicker();
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
function openModal(emoji, title, text, extraHtml) {
  let back = document.getElementById("modal-back");
  if (!back) {
    back = document.createElement("div");
    back.id = "modal-back"; back.className = "modal-back";
    back.innerHTML = `<div class="modal"><div class="emoji"></div><h3></h3><p></p><div class="modal-extra"></div>
      <button class="btn btn-primary" onclick="closeModal()">Зрозуміло</button></div>`;
    back.addEventListener("click", e => { if (e.target === back) closeModal(); });
    document.body.appendChild(back);
  }
  back.querySelector(".emoji").textContent = emoji;
  back.querySelector("h3").textContent = title;
  back.querySelector("p").textContent = text;
  back.querySelector(".modal-extra").innerHTML = extraHtml || "";
  back.classList.add("open");
}
function closeModal() { document.getElementById("modal-back").classList.remove("open"); }
