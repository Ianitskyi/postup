// Локальний редактор текстів сайту "Поступ".
// Працює лише у браузерах з File System Access API (Chrome/Edge на комп'ютері).
// Читає позначені атрибутом data-edit елементи прямо з HTML-файлів на диску,
// показує їх у зручному вигляді для редагування і зберігає зміни назад у ці ж файли.

const EDIT_FILES = ["index.html", "how-it-works.html", "policies.html", "scholarships.html", "apply.html"];
const DATA_FILE = "js/data.js";

const STUDENT_FIELD_LABELS = {
  name: "Ім'я",
  city: "Місто / статус (ВПО тощо)",
  excerpt: "Короткий опис (цитата на картці)",
  letter: "Мотиваційний лист",
};
const SCHOLARSHIP_FIELD_LABELS = {
  name: "Назва стипендії",
  founder: "Засновник",
  criteria: "Критерії відбору",
  description: "Опис стипендії",
};

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

  { file: "policies.html", key: "pol.intro.eyebrow", group: "Політики · Вступ", label: "Надпис-рубрика" },
  { file: "policies.html", key: "pol.intro.title", group: "Політики · Вступ", label: "Заголовок" },
  { file: "policies.html", key: "pol.notice", group: "Політики · Вступ", label: "Примітка про чорновий статус" },
  { file: "policies.html", key: "pol.privacy.who", group: "Політики · Конфіденційність", label: "1.1 Хто ми" },
  { file: "policies.html", key: "pol.privacy.data.applicants", group: "Політики · Конфіденційність", label: "1.2 Дані від вступників" },
  { file: "policies.html", key: "pol.privacy.data.donors", group: "Політики · Конфіденційність", label: "1.2 Дані від благодійників" },
  { file: "policies.html", key: "pol.privacy.data.technical", group: "Політики · Конфіденційність", label: "1.2 Технічні дані" },
  { file: "policies.html", key: "pol.privacy.voluntary", group: "Політики · Конфіденційність", label: "1.3 Добровільність розкриття даних" },
  { file: "policies.html", key: "pol.privacy.never", group: "Політики · Конфіденційність", label: "1.4 Що ніколи не публікується" },
  { file: "policies.html", key: "pol.privacy.share.institutions", group: "Політики · Конфіденційність", label: "1.5 Передача закладам освіти" },
  { file: "policies.html", key: "pol.privacy.share.payment", group: "Політики · Конфіденційність", label: "1.5 Передача платіжному провайдеру" },
  { file: "policies.html", key: "pol.privacy.share.gov", group: "Політики · Конфіденційність", label: "1.5 Передача держорганам" },
  { file: "policies.html", key: "pol.privacy.share.never", group: "Політики · Конфіденційність", label: "1.5 Що ніколи не передаємо" },
  { file: "policies.html", key: "pol.privacy.rights", group: "Політики · Конфіденційність", label: "1.6 Ваші права" },
  { file: "policies.html", key: "pol.cookies.intro", group: "Політики · Cookies", label: "Вступний абзац" },
  { file: "policies.html", key: "pol.cookies.trackers", group: "Політики · Cookies", label: "Про рекламні трекери" },
  { file: "policies.html", key: "pol.cookies.localstorage", group: "Політики · Cookies", label: "Про localStorage" },
  { file: "policies.html", key: "pol.cookies.fonts", group: "Політики · Cookies", label: "Про Google Fonts" },
  { file: "policies.html", key: "pol.cookies.payment", group: "Політики · Cookies", label: "Про cookies платіжного провайдера" },
  { file: "policies.html", key: "pol.cookies.clear", group: "Політики · Cookies", label: "Як очистити локальне сховище" },
  { file: "policies.html", key: "pol.terms.mediator", group: "Політики · Умови користування", label: "Платформа-посередник" },
  { file: "policies.html", key: "pol.terms.scope", group: "Політики · Умови користування", label: "Які заклади освіти охоплені" },
  { file: "policies.html", key: "pol.terms.payouts", group: "Політики · Умови користування", label: "Куди йдуть кошти" },
  { file: "policies.html", key: "pol.terms.donation", group: "Політики · Умови користування", label: "Про добровільність пожертви" },
  { file: "policies.html", key: "pol.terms.stipendCondition", group: "Політики · Умови користування", label: "Умова регулярних стипендій" },
  { file: "policies.html", key: "pol.terms.age", group: "Політики · Умови користування", label: "Віковий ценз донорів" },
  { file: "policies.html", key: "pol.terms.forbidden", group: "Політики · Умови користування", label: "Що заборонено" },
  { file: "policies.html", key: "pol.terms.demo", group: "Політики · Умови користування", label: "Про демо-режим" },

  { file: "scholarships.html", key: "sch.intro.eyebrow", group: "Стипендії · Вступ", label: "Надпис-рубрика" },
  { file: "scholarships.html", key: "sch.intro.title", group: "Стипендії · Вступ", label: "Заголовок" },
  { file: "scholarships.html", key: "sch.intro.sub", group: "Стипендії · Вступ", label: "Підзаголовок" },
  { file: "scholarships.html", key: "sch.funds.eyebrow", group: "Стипендії · Наявні фонди", label: "Надпис-рубрика" },
  { file: "scholarships.html", key: "sch.funds.title", group: "Стипендії · Наявні фонди", label: "Заголовок" },
  { file: "scholarships.html", key: "sch.funds.sub", group: "Стипендії · Наявні фонди", label: "Підзаголовок" },
  { file: "scholarships.html", key: "sch.create.title", group: "Стипендії · Заснувати свою", label: "Заголовок" },
  { file: "scholarships.html", key: "sch.create.intro", group: "Стипендії · Заснувати свою", label: "Вступний абзац" },
  { file: "scholarships.html", key: "sch.create.oneTime", group: "Стипендії · Заснувати свою", label: "Разова — на вступ (опис)" },
  { file: "scholarships.html", key: "sch.create.recurring", group: "Стипендії · Заснувати свою", label: "Регулярна — на час навчання (опис)" },
  { file: "scholarships.html", key: "sch.create.minFund", group: "Стипендії · Заснувати свою", label: "Примітка про мінімальний фонд" },

  { file: "apply.html", key: "apply.intro.eyebrow", group: "Вступникам · Вступ", label: "Надпис-рубрика" },
  { file: "apply.html", key: "apply.intro.title", group: "Вступникам · Вступ", label: "Заголовок" },
  { file: "apply.html", key: "apply.intro.sub", group: "Вступникам · Вступ", label: "Підзаголовок" },
  { file: "apply.html", key: "apply.cta.own.title", group: "Вступникам · Дві дії", label: 'Блок "Створити власний збір" — заголовок' },
  { file: "apply.html", key: "apply.cta.own.text", group: "Вступникам · Дві дії", label: 'Блок "Створити власний збір" — текст' },
  { file: "apply.html", key: "apply.cta.scholarship.title", group: "Вступникам · Дві дії", label: 'Блок "Податися на стипендію" — заголовок' },
  { file: "apply.html", key: "apply.cta.scholarship.text", group: "Вступникам · Дві дії", label: 'Блок "Податися на стипендію" — текст' },
  { file: "apply.html", key: "apply.sch.eyebrow", group: "Вступникам · Стипендії", label: "Надпис-рубрика" },
  { file: "apply.html", key: "apply.sch.title", group: "Вступникам · Стипендії", label: "Заголовок" },
  { file: "apply.html", key: "apply.sch.sub", group: "Вступникам · Стипендії", label: "Підзаголовок" },
  { file: "apply.html", key: "apply.steps.title", group: "Вступникам · Чотири кроки", label: "Заголовок блоку" },
  { file: "apply.html", key: "apply.step1.title", group: "Вступникам · Чотири кроки", label: "Крок 1 — заголовок" },
  { file: "apply.html", key: "apply.step1.text", group: "Вступникам · Чотири кроки", label: "Крок 1 — опис" },
  { file: "apply.html", key: "apply.step2.title", group: "Вступникам · Чотири кроки", label: "Крок 2 — заголовок" },
  { file: "apply.html", key: "apply.step2.text", group: "Вступникам · Чотири кроки", label: "Крок 2 — опис" },
  { file: "apply.html", key: "apply.step3.title", group: "Вступникам · Чотири кроки", label: "Крок 3 — заголовок" },
  { file: "apply.html", key: "apply.step3.text", group: "Вступникам · Чотири кроки", label: "Крок 3 — опис" },
  { file: "apply.html", key: "apply.step4.title", group: "Вступникам · Чотири кроки", label: "Крок 4 — заголовок" },
  { file: "apply.html", key: "apply.step4.text", group: "Вступникам · Чотири кроки", label: "Крок 4 — опис" },
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
  dynamicMeta: {}, // key -> { group, label } — для полів data.js, які не описані в FIELDS_CONFIG
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

// Знаходить позицію закривної дужки, парної до тієї, що стоїть на openIdx.
// Ігнорує дужки всередині рядкових літералів, щоб не збитися на тексті на
// кшталт "у нас є {приклад}" всередині чийогось мотиваційного листа.
function findMatchingBracket(text, openIdx, openCh, closeCh) {
  let depth = 0;
  let inString = false;
  let quote = null;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") { i++; continue; }
      if (c === quote) inString = false;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inString = true; quote = c; continue; }
    if (c === openCh) depth++;
    else if (c === closeCh) { depth--; if (depth === 0) return i; }
  }
  return -1;
}
function findMatchingBrace(text, openIdx) {
  return findMatchingBracket(text, openIdx, "{", "}");
}

// Витягує текстові поля (ім'я, історія, лист тощо) з масивів DB.students
// і DB.scholarships у js/data.js — не чіпаючи структурні/числові поля
// (id, статуси, суми), які пов'язані з логікою фільтрів і підрахунків сайту.
// Межі обох масивів визначаються явно через парні дужки, щоб інші масиви
// з такими самими іменами полів (наприклад DB.applications) не потрапили
// сюди помилково.
function extractDataFields(text) {
  const found = [];
  const bounds = {};
  ["students", "scholarships"].forEach((arrName) => {
    const keyIdx = text.indexOf(arrName + ":");
    if (keyIdx === -1) return;
    const openIdx = text.indexOf("[", keyIdx);
    const closeIdx = findMatchingBracket(text, openIdx, "[", "]");
    if (openIdx !== -1 && closeIdx !== -1) bounds[arrName] = { open: openIdx, close: closeIdx };
  });

  const idRe = /\bid:\s*"([^"]+)"/g;
  let m;
  while ((m = idRe.exec(text))) {
    const recordId = m[1];
    let isStudent;
    if (bounds.students && m.index > bounds.students.open && m.index < bounds.students.close) isStudent = true;
    else if (bounds.scholarships && m.index > bounds.scholarships.open && m.index < bounds.scholarships.close) isStudent = false;
    else continue; // за межами обох масивів (напр. DB.applications) — пропускаємо
    const openIdx = text.lastIndexOf("{", m.index);
    if (openIdx === -1) continue;
    const closeIdx = findMatchingBrace(text, openIdx);
    if (closeIdx === -1) continue;
    const objText = text.slice(openIdx, closeIdx + 1);
    const labels = isStudent ? STUDENT_FIELD_LABELS : SCHOLARSHIP_FIELD_LABELS;
    const nameMatch = /\bname:\s*("(?:[^"\\]|\\.)*")/.exec(objText);
    const recordLabel = nameMatch ? JSON.parse(nameMatch[1]) : recordId;
    Object.keys(labels).forEach((fieldName) => {
      const fieldRe = new RegExp("\\b" + fieldName + ":\\s*(\"(?:[^\"\\\\]|\\\\.)*\")");
      const fm = fieldRe.exec(objText);
      if (!fm) return;
      let value;
      try { value = JSON.parse(fm[1]); } catch (e) { return; }
      const groupStart = openIdx + fm.index + fm[0].indexOf(fm[1]);
      const groupEnd = groupStart + fm[1].length;
      found.push({
        key: `data.${isStudent ? "student" : "scholarship"}.${recordId}.${fieldName}`,
        isJs: true,
        contentStart: groupStart,
        contentEnd: groupEnd,
        content: value,
        group: (isStudent ? "Вступник: " : "Стипендія: ") + recordLabel,
        label: labels[fieldName],
      });
    });
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
  state.dynamicMeta = {};
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
  try {
    const fh = await state.dirHandle.getFileHandle(DATA_FILE);
    const file = await fh.getFile();
    const text = await file.text();
    state.files[DATA_FILE] = { originalText: text };
    const found = extractDataFields(text);
    found.forEach((f) => {
      state.fields[f.key] = { file: DATA_FILE, isJs: true, contentStart: f.contentStart, contentEnd: f.contentEnd, original: f.content, current: f.content };
      state.dynamicMeta[f.key] = { group: f.group, label: f.label };
    });
  } catch (e) {
    log(`❌ Не вдалося прочитати ${DATA_FILE}: ${e.message}`);
  }
  renderFields();
  log("✅ Завантажено " + Object.keys(state.fields).length + " текстових полів із " + (EDIT_FILES.length + 1) + " файлів.");
}

function renderFields() {
  const root = $("#fields-root");
  root.innerHTML = "";
  const groups = {};
  const order = [];
  FIELDS_CONFIG.forEach((cfg) => {
    if (!(cfg.key in state.fields)) return;
    if (!groups[cfg.group]) { groups[cfg.group] = []; order.push(cfg.group); }
    groups[cfg.group].push({ key: cfg.key, label: cfg.label });
  });
  Object.keys(state.dynamicMeta).forEach((key) => {
    const meta = state.dynamicMeta[key];
    if (!groups[meta.group]) { groups[meta.group] = []; order.push(meta.group); }
    groups[meta.group].push({ key, label: meta.label });
  });

  order.forEach((groupName) => {
    const section = document.createElement("div");
    section.className = "editor-group";
    const h2 = document.createElement("h2");
    h2.textContent = groupName;
    section.appendChild(h2);

    groups[groupName].forEach((item) => {
      const field = state.fields[item.key];
      const card = document.createElement("div");
      card.className = "field-card";

      const labelRow = document.createElement("div");
      labelRow.className = "field-label";
      const labelText = document.createElement("span");
      labelText.textContent = item.label;
      labelRow.appendChild(labelText);

      let editable;
      if (field.isJs) {
        const resetBtn = document.createElement("button");
        resetBtn.type = "button";
        resetBtn.textContent = "↺ скинути";
        resetBtn.className = "field-toolbar";
        resetBtn.addEventListener("click", () => {
          editable.value = field.original;
          field.current = field.original;
          editable.classList.remove("changed");
          updateSaveButtonState();
        });
        labelRow.appendChild(resetBtn);

        editable = document.createElement("textarea");
        editable.className = "field-editable";
        editable.rows = field.current.length > 200 ? 8 : field.current.includes("\n") ? 4 : 1;
        editable.value = field.current;
        editable.dataset.key = item.key;
        editable.addEventListener("input", () => {
          field.current = editable.value;
          editable.classList.toggle("changed", field.current !== field.original);
          updateSaveButtonState();
        });
      } else {
        const toolbar = document.createElement("span");
        toolbar.className = "field-toolbar";
        toolbar.innerHTML = '<button type="button" data-cmd="bold"><b>Ж</b></button><button type="button" data-cmd="underline"><u>П</u></button><button type="button" data-cmd="reset">↺ скинути</button>';
        labelRow.appendChild(toolbar);

        editable = document.createElement("div");
        editable.className = "field-editable";
        editable.contentEditable = "true";
        editable.innerHTML = field.current;
        editable.dataset.key = item.key;

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
      }

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
        const replacement = f.isJs ? JSON.stringify(f.current) : f.current;
        result = result.slice(0, f.contentStart) + replacement + result.slice(f.contentEnd);
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
