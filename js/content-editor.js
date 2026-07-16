// Локальний редактор текстів сайту "Поступ".
// Працює лише у браузерах з File System Access API (Chrome/Edge на комп'ютері).
// Читає позначені атрибутом data-edit елементи прямо з HTML-файлів на диску,
// показує їх у зручному вигляді для редагування і зберігає зміни назад у ці ж файли.

const EDIT_FILES = ["index.html", "how-it-works.html", "universities.html"];

const FAQ_TOPICS = {
  money1: "Якщо людина не вступить або збір не завершиться",
  money2: "Якщо студент вступить на бюджет або отримає інший грант",
  money3: "Чи повернення справді 100%",
  money4: "Чи можна підтримувати анонімно",
  money5: "Чим відрізняємось від інших фондів",
  priv1: "Чи законно публікувати історії вступників",
  priv2: "Які дані видно всім, а які — ні",
  priv3: "Чи можна видалити профіль",
  adm1: "Чи впливає платформа на результати вступу",
  adm2: "Чи отримує студент гроші на руки",
  adm3: "Заклад-непартнер — чи можна податись",
  adm4: "Коледж чи технікум замість університету",
  adm5: "Заклади освіти за кордоном",
  adm6: "Якщо стипендіат кине навчання чи не складе сесію",
};

const FIELDS_CONFIG = [
  { file: "index.html", key: "index.hero.eyebrow", group: "Головна · Hero", label: "Надпис над заголовком" },
  { file: "index.html", key: "index.hero.title", group: "Головна · Hero", label: "Головний заголовок" },
  { file: "index.html", key: "index.hero.lead", group: "Головна · Hero", label: "Підзаголовок під заголовком" },
  { file: "index.html", key: "index.escrow.eyebrow", group: "Головна · Прозорість коштів", label: "Надпис-рубрика" },
  { file: "index.html", key: "index.escrow.title", group: "Головна · Прозорість коштів", label: "Заголовок блоку" },
  { file: "index.html", key: "index.escrow.subtitle", group: "Головна · Прозорість коштів", label: 'Підзаголовок "Як рухаються кошти"' },
  { file: "index.html", key: "index.escrow.intro", group: "Головна · Прозорість коштів", label: "Пояснювальний абзац" },
  { file: "index.html", key: "index.escrow.node.donor", group: "Головна · Прозорість коштів", label: "Крок 1 — Благодійник (опис)" },
  { file: "index.html", key: "index.escrow.node.escrow", group: "Головна · Прозорість коштів", label: "Крок 2 — Ескроу-рахунок (опис)" },
  { file: "index.html", key: "index.escrow.node.institution", group: "Головна · Прозорість коштів", label: "Крок 3 — Заклад освіти (опис)" },
  { file: "index.html", key: "index.guarantee.stipend.title", group: "Головна · Гарантії", label: 'Заголовок "А стипендія на час навчання?"' },
  { file: "index.html", key: "index.guarantee.stipend.text", group: "Головна · Гарантії", label: "Текст пояснення про стипендію" },
  { file: "index.html", key: "index.guarantee.refund.title", group: "Головна · Гарантії", label: 'Заголовок "Що як вступ не відбудеться?"' },
  { file: "index.html", key: "index.guarantee.refund.text", group: "Головна · Гарантії", label: "Текст про повернення коштів" },
  { file: "index.html", key: "index.step1.title", group: "Головна · Чотири кроки", label: "Крок 1 — заголовок" },
  { file: "index.html", key: "index.step1.text", group: "Головна · Чотири кроки", label: "Крок 1 — опис" },
  { file: "index.html", key: "index.step2.title", group: "Головна · Чотири кроки", label: "Крок 2 — заголовок" },
  { file: "index.html", key: "index.step2.text", group: "Головна · Чотири кроки", label: "Крок 2 — опис" },
  { file: "index.html", key: "index.step3.title", group: "Головна · Чотири кроки", label: "Крок 3 — заголовок" },
  { file: "index.html", key: "index.step3.text", group: "Головна · Чотири кроки", label: "Крок 3 — опис" },
  { file: "index.html", key: "index.step4.title", group: "Головна · Чотири кроки", label: "Крок 4 — заголовок" },
  { file: "index.html", key: "index.step4.text", group: "Головна · Чотири кроки", label: "Крок 4 — опис" },
  { file: "index.html", key: "index.cta.donor.title", group: "Головна · Заклик до дії", label: 'Блок "Я хочу підтримати" — заголовок' },
  { file: "index.html", key: "index.cta.donor.text", group: "Головна · Заклик до дії", label: 'Блок "Я хочу підтримати" — текст' },
  { file: "index.html", key: "index.cta.student.title", group: "Головна · Заклик до дії", label: 'Блок "Я вступаю на навчання" — заголовок' },
  { file: "index.html", key: "index.cta.student.text", group: "Головна · Заклик до дії", label: 'Блок "Я вступаю на навчання" — текст' },

  { file: "how-it-works.html", key: "hiw.intro.eyebrow", group: "Як це працює · Вступний блок", label: "Надпис-рубрика" },
  { file: "how-it-works.html", key: "hiw.intro.title", group: "Як це працює · Вступний блок", label: "Заголовок" },
  { file: "how-it-works.html", key: "hiw.intro.sub", group: "Як це працює · Вступний блок", label: "Підзаголовок" },
  { file: "how-it-works.html", key: "hiw.applicants.eyebrow", group: "Як це працює · Для вступників", label: "Надпис-рубрика" },
  { file: "how-it-works.html", key: "hiw.applicants.title", group: "Як це працює · Для вступників", label: "Заголовок" },
  { file: "how-it-works.html", key: "hiw.applicants.sub", group: "Як це працює · Для вступників", label: "Підзаголовок" },
  { file: "how-it-works.html", key: "hiw.applicants.stipendNote", group: "Як це працює · Для вступників", label: "Примітка про регулярну стипендію" },
  { file: "how-it-works.html", key: "hiw.donors.eyebrow", group: "Як це працює · Для благодійників", label: "Надпис-рубрика" },
  { file: "how-it-works.html", key: "hiw.donors.title", group: "Як це працює · Для благодійників", label: "Заголовок" },
  { file: "how-it-works.html", key: "hiw.donors.sub", group: "Як це працює · Для благодійників", label: "Підзаголовок" },
  { file: "how-it-works.html", key: "hiw.escrow.guarantee1.title", group: "Як це працює · Гарантії для благодійників", label: 'Заголовок "Гарантія повернення коштів"' },
  { file: "how-it-works.html", key: "hiw.escrow.guarantee1.text", group: "Як це працює · Гарантії для благодійників", label: "Текст про повернення коштів" },
  { file: "how-it-works.html", key: "hiw.escrow.guarantee2.title", group: "Як це працює · Гарантії для благодійників", label: 'Заголовок "А регулярна стипендія?"' },
  { file: "how-it-works.html", key: "hiw.escrow.guarantee2.text", group: "Як це працює · Гарантії для благодійників", label: "Текст про регулярну стипендію" },
  { file: "how-it-works.html", key: "hiw.institutions.eyebrow", group: "Як це працює · Для закладів освіти", label: "Надпис-рубрика" },
  { file: "how-it-works.html", key: "hiw.institutions.title", group: "Як це працює · Для закладів освіти", label: "Заголовок" },
  { file: "how-it-works.html", key: "hiw.institutions.sub", group: "Як це працює · Для закладів освіти", label: "Підзаголовок" },
  { file: "how-it-works.html", key: "hiw.institutions.stipendNote", group: "Як це працює · Для закладів освіти", label: "Примітка про регулярні стипендії" },
  { file: "how-it-works.html", key: "hiw.institutions.guarantee.title", group: "Як це працює · Для закладів освіти", label: 'Заголовок "Партнерство — не умова для виплат"' },
  { file: "how-it-works.html", key: "hiw.institutions.guarantee.text", group: "Як це працює · Для закладів освіти", label: "Текст про партнерство" },

  { file: "universities.html", key: "univ.intro.eyebrow", group: "Заклади освіти · Вступ", label: "Надпис-рубрика" },
  { file: "universities.html", key: "univ.intro.title", group: "Заклади освіти · Вступ", label: "Заголовок" },
  { file: "universities.html", key: "univ.intro.sub", group: "Заклади освіти · Вступ", label: "Підзаголовок" },
  { file: "universities.html", key: "univ.benefit1.title", group: "Заклади освіти · Переваги", label: "Перевага 1 — заголовок" },
  { file: "universities.html", key: "univ.benefit1.text", group: "Заклади освіти · Переваги", label: "Перевага 1 — опис" },
  { file: "universities.html", key: "univ.benefit2.title", group: "Заклади освіти · Переваги", label: "Перевага 2 — заголовок" },
  { file: "universities.html", key: "univ.benefit2.text", group: "Заклади освіти · Переваги", label: "Перевага 2 — опис" },
  { file: "universities.html", key: "univ.benefit3.title", group: "Заклади освіти · Переваги", label: "Перевага 3 — заголовок" },
  { file: "universities.html", key: "univ.benefit3.text", group: "Заклади освіти · Переваги", label: "Перевага 3 — опис" },
  { file: "universities.html", key: "univ.benefit4.title", group: "Заклади освіти · Переваги", label: "Перевага 4 — заголовок" },
  { file: "universities.html", key: "univ.benefit4.text", group: "Заклади освіти · Переваги", label: "Перевага 4 — опис" },
  { file: "universities.html", key: "univ.howPay.title", group: "Заклади освіти · Як отримати кошти", label: "Заголовок блоку" },
  { file: "universities.html", key: "univ.stipendNote", group: "Заклади освіти · Як отримати кошти", label: "Примітка про регулярні стипендії" },
  { file: "universities.html", key: "univ.guarantee.title", group: "Заклади освіти · Як отримати кошти", label: 'Заголовок "Партнерство — не умова для виплат"' },
  { file: "universities.html", key: "univ.guarantee.text", group: "Заклади освіти · Як отримати кошти", label: "Текст про партнерство" },
  { file: "universities.html", key: "univ.tiers.eyebrow", group: "Заклади освіти · Рівні співпраці", label: "Надпис-рубрика" },
  { file: "universities.html", key: "univ.tiers.title", group: "Заклади освіти · Рівні співпраці", label: "Заголовок" },
  { file: "universities.html", key: "univ.tier1.title", group: "Заклади освіти · Рівні співпраці", label: "Рівень 1 — заголовок" },
  { file: "universities.html", key: "univ.tier1.text", group: "Заклади освіти · Рівні співпраці", label: "Рівень 1 — опис" },
  { file: "universities.html", key: "univ.tier2.title", group: "Заклади освіти · Рівні співпраці", label: "Рівень 2 — заголовок" },
  { file: "universities.html", key: "univ.tier2.text", group: "Заклади освіти · Рівні співпраці", label: "Рівень 2 — опис" },
  { file: "universities.html", key: "univ.tier3.title", group: "Заклади освіти · Рівні співпраці", label: "Рівень 3 — заголовок" },
  { file: "universities.html", key: "univ.tier3.text", group: "Заклади освіти · Рівні співпраці", label: "Рівень 3 — опис" },
];

// FAQ-поля (how-it-works.html) описуємо окремо й одразу підмішуємо в конфіг,
// щоб не дублювати вручну ~35 записів.
Object.keys(FAQ_TOPICS).forEach((topicId) => {
  const groupName = "Як це працює · FAQ: " + FAQ_TOPICS[topicId];
  FIELDS_CONFIG.push({ file: "how-it-works.html", key: `faq.${topicId}.q`, group: groupName, label: "Питання" });
  FIELDS_CONFIG.push({ file: "how-it-works.html", key: `faq.${topicId}.a1`, group: groupName, label: "Відповідь" });
  FIELDS_CONFIG.push({ file: "how-it-works.html", key: `faq.${topicId}.a2`, group: groupName, label: "Відповідь (продовження)" });
});

const state = {
  dirHandle: null,
  files: {}, // fileName -> { originalText, currentText }
  fields: {}, // key -> { file, tag, contentStart, contentEnd, original, current, el }
};

function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

function supportsFS() {
  return "showDirectoryPicker" in window;
}

function extractFields(text) {
  const found = [];
  const openTagRe = /<([a-zA-Z0-9]+)([^<>]*?data-edit="([^"]+)"[^<>]*?)>/g;
  let m;
  while ((m = openTagRe.exec(text))) {
    const tag = m[1];
    const key = m[3];
    const contentStart = m.index + m[0].length;
    const closeTag = `</${tag}>`;
    const closeIdx = text.indexOf(closeTag, contentStart);
    if (closeIdx === -1) continue;
    const content = text.slice(contentStart, closeIdx);
    found.push({ key, tag, contentStart, contentEnd: closeIdx, content });
    openTagRe.lastIndex = closeIdx;
  }
  return found;
}

function sanitizeHTML(html) {
  const allowed = ["B", "STRONG", "U", "EM", "I", "BR", "A"];
  const div = document.createElement("div");
  div.innerHTML = html;
  (function walk(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 1) {
        if (!allowed.includes(child.tagName)) {
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          node.removeChild(child);
          return;
        }
        Array.from(child.attributes).forEach((attr) => {
          if (!(child.tagName === "A" && attr.name === "href")) child.removeAttribute(attr.name);
        });
        walk(child);
      }
    });
  })(div);
  return div.innerHTML;
}

function log(msg) {
  const el = $("#status-log");
  el.textContent += (el.textContent ? "\n" : "") + msg;
  el.scrollTop = el.scrollHeight;
}

async function verifyDirectory(dirHandle) {
  try {
    const fh = await dirHandle.getFileHandle("index.html");
    const file = await fh.getFile();
    const text = await file.text();
    return text.includes("Поступ");
  } catch (e) {
    return false;
  }
}

async function pickDirectory() {
  try {
    const handle = await window.showDirectoryPicker();
    const ok = await verifyDirectory(handle);
    if (!ok) {
      log('⚠️ Це не схоже на теку сайту "Поступ" (не знайдено index.html з очікуваним вмістом). Спробуйте ще раз і оберіть правильну теку.');
      return;
    }
    state.dirHandle = handle;
    $("#dir-status").textContent = "📂 Тека обрана: " + handle.name;
    $("#btn-save").disabled = false;
    await loadAllFields();
  } catch (e) {
    if (e.name !== "AbortError") log("❌ Не вдалося відкрити теку: " + e.message);
  }
}

async function loadAllFields() {
  $("#fields-root").innerHTML = "";
  state.files = {};
  state.fields = {};
  for (const fileName of EDIT_FILES) {
    try {
      const fh = await state.dirHandle.getFileHandle(fileName);
      const file = await fh.getFile();
      const text = await file.text();
      state.files[fileName] = { originalText: text };
      const found = extractFields(text);
      found.forEach((f) => {
        state.fields[f.key] = { file: fileName, tag: f.tag, contentStart: f.contentStart, contentEnd: f.contentEnd, original: f.content, current: f.content };
      });
    } catch (e) {
      log(`❌ Не вдалося прочитати ${fileName}: ${e.message}`);
    }
  }
  renderFields();
  log("✅ Завантажено " + Object.keys(state.fields).length + " текстових полів із " + EDIT_FILES.length + " файлів.");
}

function renderFields() {
  const root = $("#fields-root");
  root.innerHTML = "";
  const groups = {};
  FIELDS_CONFIG.forEach((cfg) => {
    if (!(cfg.key in state.fields)) return;
    if (!groups[cfg.group]) groups[cfg.group] = [];
    groups[cfg.group].push(cfg);
  });

  Object.keys(groups).forEach((groupName) => {
    const section = document.createElement("div");
    section.className = "editor-group";
    const h2 = document.createElement("h2");
    h2.textContent = groupName;
    section.appendChild(h2);

    groups[groupName].forEach((cfg) => {
      const field = state.fields[cfg.key];
      const card = document.createElement("div");
      card.className = "field-card";

      const labelRow = document.createElement("div");
      labelRow.className = "field-label";
      const labelText = document.createElement("span");
      labelText.textContent = cfg.label;
      const toolbar = document.createElement("span");
      toolbar.className = "field-toolbar";
      toolbar.innerHTML = '<button type="button" data-cmd="bold"><b>Ж</b></button><button type="button" data-cmd="underline"><u>П</u></button><button type="button" data-cmd="reset">↺ скинути</button>';
      labelRow.appendChild(labelText);
      labelRow.appendChild(toolbar);

      const editable = document.createElement("div");
      editable.className = "field-editable";
      editable.contentEditable = "true";
      editable.innerHTML = field.current;
      editable.dataset.key = cfg.key;

      editable.addEventListener("input", () => {
        field.current = sanitizeHTML(editable.innerHTML);
        editable.classList.toggle("changed", field.current !== field.original);
        updateSaveButtonState();
      });

      toolbar.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("mousedown", (e) => e.preventDefault());
        btn.addEventListener("click", () => {
          const cmd = btn.dataset.cmd;
          if (cmd === "reset") {
            editable.innerHTML = field.original;
            field.current = field.original;
            editable.classList.remove("changed");
            updateSaveButtonState();
          } else {
            editable.focus();
            document.execCommand(cmd);
            field.current = sanitizeHTML(editable.innerHTML);
            editable.classList.toggle("changed", field.current !== field.original);
          }
        });
      });

      card.appendChild(labelRow);
      card.appendChild(editable);
      section.appendChild(card);
    });

    root.appendChild(section);
  });
}

function updateSaveButtonState() {
  const changedCount = Object.values(state.fields).filter((f) => f.current !== f.original).length;
  $("#changed-count").textContent = changedCount ? `Незбережених змін: ${changedCount}` : "";
}

async function saveAll() {
  const byFile = {};
  Object.entries(state.fields).forEach(([key, f]) => {
    if (f.current !== f.original) {
      (byFile[f.file] = byFile[f.file] || []).push(f);
    }
  });
  const fileNames = Object.keys(byFile);
  if (!fileNames.length) {
    log("ℹ️ Немає незбережених змін.");
    return;
  }
  for (const fileName of fileNames) {
    try {
      const text = state.files[fileName].originalText;
      const sorted = byFile[fileName].slice().sort((a, b) => b.contentStart - a.contentStart);
      let result = text;
      sorted.forEach((f) => {
        result = result.slice(0, f.contentStart) + f.current + result.slice(f.contentEnd);
      });
      const fh = await state.dirHandle.getFileHandle(fileName);
      const writable = await fh.createWritable();
      await writable.write(result);
      await writable.close();
      state.files[fileName].originalText = result;
      byFile[fileName].forEach((f) => { f.original = f.current; });
      log(`✅ Збережено ${fileName} (${byFile[fileName].length} полів).`);
    } catch (e) {
      log(`❌ Помилка збереження ${fileName}: ${e.message}`);
    }
  }
  $all(".field-editable").forEach((el) => el.classList.remove("changed"));
  updateSaveButtonState();
  log("💾 Готово. Це збережено на диску. Щоб зміни зʼявились на живому сайті — повідом Клода, що зробив правки, і попроси запушити на GitHub.");
}

function init() {
  if (!supportsFS()) {
    $("#unsupported").style.display = "block";
    $("#supported-ui").style.display = "none";
    return;
  }
  $("#btn-pick").addEventListener("click", pickDirectory);
  $("#btn-save").addEventListener("click", saveAll);
}

document.addEventListener("DOMContentLoaded", init);
