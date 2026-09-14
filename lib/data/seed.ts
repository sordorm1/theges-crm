import type { ExamRecord, ExamStatus, Partner, Student } from "@/lib/types";
import { EXAM_PROGRAMS } from "@/lib/data/programs";

// Deterministic PRNG (mulberry32) so seed data is identical on server & client renders.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20240912);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

const PARTNER_SEED: Array<{ name: string; phone: string; code: string }> = [
  { name: "EduPath Consulting", phone: "+998 90 123 45 67", code: "EDP" },
  { name: "Global Study Center", phone: "+998 91 234 56 78", code: "GSC" },
  { name: "Bilim Yo'li", phone: "+998 93 345 67 89", code: "BYL" },
  { name: "Smart Consulting Group", phone: "+998 94 456 78 90", code: "SCG" },
  { name: "Ilm Ziyo Consulting", phone: "+998 95 567 89 01", code: "IZC" },
  { name: "Osiyo Study Agency", phone: "+998 97 678 90 12", code: "OSA" },
  { name: "NextGen Education", phone: "+998 88 789 01 23", code: "NGE" },
];

const FIRST_NAMES_M = [
  "Azizbek",
  "Diyorbek",
  "Jasur",
  "Islom",
  "Sardor",
  "Bekzod",
  "Otabek",
  "Farrux",
  "Shaxzod",
  "Javohir",
  "Nodirbek",
  "Sherzod",
];
const FIRST_NAMES_F = [
  "Madina",
  "Dilnoza",
  "Sevinch",
  "Zarina",
  "Nilufar",
  "Malika",
  "Gulnora",
  "Kamola",
  "Feruza",
  "Shahnoza",
  "Ozoda",
  "Dilbar",
];
const LAST_NAMES_M = [
  "Karimov",
  "Rashidov",
  "Tursunov",
  "Abdullayev",
  "Yuldashev",
  "Mirzayev",
  "Rustamov",
];
const LAST_NAMES_F = [
  "Karimova",
  "Rashidova",
  "Tursunova",
  "Abdullayeva",
  "Yuldasheva",
  "Mirzayeva",
  "Rustamova",
];
const MIDDLE_NAMES_M = [
  "Baxtiyorovich",
  "Sharipovich",
  "Rustamovich",
  "Odilovich",
  "",
  "",
];
const MIDDLE_NAMES_F = [
  "Baxtiyorovna",
  "Sharipovna",
  "Rustamovna",
  "Odilovna",
  "",
  "",
];

function randomLogin(first: string, last: string, i: number) {
  return `${first.toLowerCase()}.${last.toLowerCase()}${i}`.replace(/[^a-z0-9.]/g, "");
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(rand() * chars.length)];
  return out;
}

function randomExamKey() {
  const seg = () =>
    Math.floor(rand() * 36 ** 4)
      .toString(36)
      .toUpperCase()
      .padStart(4, "0");
  return `${seg()}-${seg()}-${seg()}`;
}

function statusForDate(dateIso: string): ExamStatus {
  const date = new Date(dateIso);
  if (date.getTime() > Date.now()) return "scheduled";
  return rand() > 0.22 ? "passed" : "failed";
}

function passportNumber() {
  const letters = "ABCDEFGH";
  const l1 = letters[randomInt(0, letters.length - 1)];
  const l2 = letters[randomInt(0, letters.length - 1)];
  const digits = String(randomInt(1000000, 9999999));
  return `${l1}${l2}${digits}`;
}

function monthsAgoDate(monthsAgo: number, dayOffset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(Math.min(28, Math.max(1, d.getDate() - dayOffset)));
  return d.toISOString();
}

export function generateSeed(): { partners: Partner[]; students: Student[] } {
  const partners: Partner[] = PARTNER_SEED.map((p, idx) => ({
    id: `partner-${idx + 1}`,
    code: p.code,
    name: p.name,
    phone: p.phone,
    createdAt: monthsAgoDate(randomInt(6, 18)),
  }));

  const students: Student[] = [];
  const totalStudents = 58;

  for (let i = 0; i < totalStudents; i++) {
    const isMale = rand() > 0.48;
    const firstName = pick(isMale ? FIRST_NAMES_M : FIRST_NAMES_F);
    const lastName = pick(isMale ? LAST_NAMES_M : LAST_NAMES_F);
    const middleName = pick(isMale ? MIDDLE_NAMES_M : MIDDLE_NAMES_F);
    const partner = rand() > 0.08 ? pick(partners) : null;
    const monthsAgo = randomInt(0, 11);
    const createdAt = monthsAgoDate(monthsAgo, randomInt(0, 27));

    const numExams = rand() > 0.75 ? 2 : 1;
    const examRecords: ExamRecord[] = [];
    const usedPrograms = new Set<string>();

    for (let e = 0; e < numExams; e++) {
      let program = pick(EXAM_PROGRAMS);
      let guard = 0;
      while (usedPrograms.has(program.id) && guard < 10) {
        program = pick(EXAM_PROGRAMS);
        guard++;
      }
      usedPrograms.add(program.id);

      const examMonthsAgo = Math.max(0, monthsAgo - randomInt(0, 2));
      const examDate = monthsAgoDate(examMonthsAgo, randomInt(0, 27));

      examRecords.push({
        id: `${i}-${e}-${program.id}`,
        examProgramId: program.id,
        date: examDate,
        status: statusForDate(examDate),
        score:
          program.id === "ielts"
            ? (4.5 + rand() * 4).toFixed(1)
            : program.id === "sat"
              ? String(randomInt(950, 1560))
              : program.id === "gre"
                ? String(randomInt(280, 335))
                : undefined,
        login: randomLogin(firstName, lastName, i),
        password: randomPassword(),
        examKey: randomExamKey(),
      });
    }

    students.push({
      id: `student-${i + 1}`,
      firstName,
      middleName: middleName || undefined,
      lastName,
      passportNumber: passportNumber(),
      phone: `+998 9${randomInt(0, 9)} ${randomInt(100, 999)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
      partnerId: partner ? partner.id : null,
      createdAt,
      examRecords,
    });
  }

  students.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return { partners, students };
}
