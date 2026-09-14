import { supabaseAdmin } from "../_shared/supabase.ts";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}

function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/[\s-]/g, "");
}

function normalizePhoneTail(value: string, tailLength = 9): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-tailLength);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

const WELCOME =
  "Здравствуйте! Я бот the GES.\n\n" +
  "Чтобы получить данные по вашим курсам (логин, пароль, email), отправьте одним сообщением " +
  "номер телефона и ФИО как в паспорте, например:\n\n" +
  "<code>+998901234567 Каримов Азизбек</code>";

const NOT_FOUND =
  "Не нашёл ученика с такими данными. Проверьте номер телефона и ФИО (как в паспорте) " +
  "и попробуйте ещё раз, либо обратитесь в центр the GES.";

const AMBIGUOUS =
  "Нашлось несколько учеников с такими данными. Пожалуйста, обратитесь в центр the GES напрямую.";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");

  const update = (await req.json()) as TelegramUpdate;
  const message = update.message;
  if (!message?.text) return new Response(JSON.stringify({ ok: true }));

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text.startsWith("/start")) {
    await sendTelegramMessage(chatId, WELCOME);
    return new Response(JSON.stringify({ ok: true }));
  }

  const phoneTail = normalizePhoneTail(text);
  const namePart = normalizeForSearch(text.replace(/[+\d][\d\s()-]*/g, " "));

  if (phoneTail.length < 7 || namePart.length < 2) {
    await sendTelegramMessage(chatId, WELCOME);
    return new Response(JSON.stringify({ ok: true }));
  }

  const db = supabaseAdmin();
  const { data: students, error } = await db.from("students").select(
    `id, first_name, middle_name, last_name, passport_number, phone, email,
     exam_records ( id, date, status, level_label, login, password, exam_key,
       exam_programs ( name, subjects ( label ) ) )`,
  );

  if (error) {
    await sendTelegramMessage(chatId, "Техническая ошибка, попробуйте позже.");
    return new Response(JSON.stringify({ ok: true }));
  }

  const nameTokens = text
    .replace(/[+\d][\d\s()-]*/g, " ")
    .split(/\s+/)
    .map(normalizeForSearch)
    .filter((t) => t.length >= 2);

  // deno-lint-ignore no-explicit-any
  const matches = (students ?? []).filter((s: any) => {
    const phoneMatch = normalizePhoneTail(s.phone ?? "") === phoneTail;
    const fullName = normalizeForSearch(`${s.last_name} ${s.first_name} ${s.middle_name ?? ""}`);
    const nameMatch = nameTokens.length > 0 && nameTokens.every((token) => fullName.includes(token));
    return phoneMatch && nameMatch;
  });

  if (matches.length === 0) {
    await sendTelegramMessage(chatId, NOT_FOUND);
    return new Response(JSON.stringify({ ok: true }));
  }
  if (matches.length > 1) {
    await sendTelegramMessage(chatId, AMBIGUOUS);
    return new Response(JSON.stringify({ ok: true }));
  }

  const student = matches[0];
  const lines: string[] = [];
  lines.push(
    `<b>${escapeHtml(`${student.last_name} ${student.first_name} ${student.middle_name ?? ""}`.trim())}</b>`,
  );
  if (student.email) lines.push(`Email: ${escapeHtml(student.email)}`);
  lines.push("");

  // deno-lint-ignore no-explicit-any
  const records = (student.exam_records ?? []) as any[];
  if (records.length === 0) lines.push("Курсы пока не назначены.");

  for (const r of records) {
    const programName = r.exam_programs?.name ?? "—";
    const subjectLabel = r.exam_programs?.subjects?.label;
    lines.push(`<b>${escapeHtml(programName)}</b>${subjectLabel ? ` (${escapeHtml(subjectLabel)})` : ""}`);
    lines.push(`Дата: ${formatDate(r.date)}`);
    if (r.level_label) lines.push(`Уровень: ${escapeHtml(r.level_label)}`);
    lines.push(`Логин: <code>${escapeHtml(r.login || "—")}</code>`);
    lines.push(`Пароль: <code>${escapeHtml(r.password || "—")}</code>`);
    lines.push(`Exam Key: <code>${escapeHtml(r.exam_key || "—")}</code>`);
    lines.push("");
  }

  await sendTelegramMessage(chatId, lines.join("\n").trim());
  return new Response(JSON.stringify({ ok: true }));
});
