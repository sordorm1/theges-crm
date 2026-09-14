import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram";
import { normalizeForSearch, normalizePhoneTail } from "@/lib/normalize";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
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

export async function POST(req: Request) {
  const update = (await req.json()) as TelegramUpdate;
  const message = update.message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text.startsWith("/start")) {
    await sendTelegramMessage(chatId, WELCOME);
    return NextResponse.json({ ok: true });
  }

  const phoneTail = normalizePhoneTail(text);
  const namePart = normalizeForSearch(text.replace(/[+\d][\d\s()-]*/g, " "));

  if (phoneTail.length < 7 || namePart.length < 2) {
    await sendTelegramMessage(chatId, WELCOME);
    return NextResponse.json({ ok: true });
  }

  const db = supabaseAdmin();
  const { data: students, error } = await db
    .from("students")
    .select(
      `id, first_name, middle_name, last_name, passport_number, phone, email,
       exam_records ( id, date, status, level_label, login, password, exam_key,
         exam_programs ( name, subjects ( label ) ) )`,
    );

  if (error) {
    await sendTelegramMessage(chatId, "Техническая ошибка, попробуйте позже.");
    return NextResponse.json({ ok: true });
  }

  const matches = (students ?? []).filter((s) => {
    const phoneMatch = normalizePhoneTail(s.phone ?? "") === phoneTail;
    const fullName = normalizeForSearch(
      `${s.last_name} ${s.first_name} ${s.middle_name ?? ""}`,
    );
    const nameTokens = text
      .replace(/[+\d][\d\s()-]*/g, " ")
      .split(/\s+/)
      .map(normalizeForSearch)
      .filter((t) => t.length >= 2);
    const nameMatch =
      nameTokens.length > 0 && nameTokens.every((token) => fullName.includes(token));
    return phoneMatch && nameMatch;
  });

  if (matches.length === 0) {
    await sendTelegramMessage(chatId, NOT_FOUND);
    return NextResponse.json({ ok: true });
  }
  if (matches.length > 1) {
    await sendTelegramMessage(chatId, AMBIGUOUS);
    return NextResponse.json({ ok: true });
  }

  const student = matches[0];
  const lines: string[] = [];
  lines.push(
    `<b>${escapeHtml(`${student.last_name} ${student.first_name} ${student.middle_name ?? ""}`.trim())}</b>`,
  );
  if (student.email) lines.push(`Email: ${escapeHtml(student.email)}`);
  lines.push("");

  type ExamRow = {
    id: string;
    date: string;
    status: string;
    level_label: string | null;
    login: string;
    password: string;
    exam_key: string;
    exam_programs: { name: string; subjects: { label: string } | null } | null;
  };

  const records = (student.exam_records ?? []) as unknown as ExamRow[];
  if (records.length === 0) {
    lines.push("Курсы пока не назначены.");
  }
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
  return NextResponse.json({ ok: true });
}
