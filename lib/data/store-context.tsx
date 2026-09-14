"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ExamProgram,
  ExamStatus,
  Partner,
  PaymentComment,
  Student,
  SubjectLevel,
  SubjectRow,
} from "@/lib/types";
import { listPartners, createPartner as createPartnerAction } from "@/lib/api/partners";
import {
  listStudents,
  createStudent as createStudentAction,
  addExamRecordToStudent as addExamRecordAction,
} from "@/lib/api/students";
import {
  listSubjects,
  addSubject as addSubjectAction,
  listSubjectLevels,
  addSubjectLevel as addSubjectLevelAction,
  listExamPrograms,
  addExamProgram as addExamProgramAction,
} from "@/lib/api/catalog";
import {
  updateExamFee as updateExamFeeAction,
  addPaymentComment as addPaymentCommentAction,
  type FeeField,
  type UpdateFeeResult,
} from "@/lib/api/payments";
import { normalizeForSearch } from "@/lib/normalize";

interface AppDataContextValue {
  ready: boolean;
  error: string | null;
  partners: Partner[];
  students: Student[];
  subjects: SubjectRow[];
  subjectLevels: SubjectLevel[];
  examPrograms: ExamProgram[];
  refresh: () => Promise<void>;

  addPartner: (partner: {
    name: string;
    phone: string;
    code: string;
    logoDataUrl?: string;
  }) => Promise<Partner>;
  nextPartnerCode: (name: string) => string;

  addStudent: (student: {
    firstName: string;
    middleName?: string;
    lastName: string;
    passportNumber: string;
    phone: string;
    email?: string;
    partnerId: string | null;
    examRecord?: {
      examProgramId: string;
      date: string;
      status: ExamStatus;
      levelLabel?: string;
      login: string;
      password: string;
      examKey: string;
    };
  }) => Promise<Student>;
  addExamRecordToStudent: (
    studentId: string,
    examRecord: {
      examProgramId: string;
      date: string;
      status: ExamStatus;
      levelLabel?: string;
      login: string;
      password: string;
      examKey: string;
    },
  ) => Promise<Student>;
  findStudentsByQuery: (query: string) => Student[];

  addSubject: (key: string, label: string) => Promise<SubjectRow>;
  addSubjectLevel: (subjectId: string, label: string) => Promise<SubjectLevel>;
  addExamProgram: (
    subjectId: string,
    key: string,
    name: string,
    shortName: string,
    color: string,
  ) => Promise<void>;

  updateExamFee: (
    examRecordId: string,
    field: FeeField,
    value: number,
    pin?: string,
  ) => Promise<UpdateFeeResult>;
  addPaymentComment: (examRecordId: string, text: string) => Promise<PaymentComment>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<SubjectLevel[]>([]);
  const [examPrograms, setExamPrograms] = useState<ExamProgram[]>([]);

  const refresh = useCallback(async () => {
    const [p, s, subj, lvls, progs] = await Promise.all([
      listPartners(),
      listStudents(),
      listSubjects(),
      listSubjectLevels(),
      listExamPrograms(),
    ]);
    setPartners(p);
    setStudents(s);
    setSubjects(subj);
    setSubjectLevels(lvls);
    setExamPrograms(progs);
  }, []);

  useEffect(() => {
    // One-time fetch from Supabase (an external system) on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
      .then(() => setReady(true))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load data");
        setReady(true);
      });
  }, [refresh]);

  const nextPartnerCode = useCallback(
    (name: string) => {
      const base =
        name
          .replace(/[^a-zA-Zа-яА-Я0-9 ]/g, "")
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 4) || "PTN";
      let candidate = base;
      let i = 1;
      const existing = new Set(partners.map((p) => p.code));
      while (existing.has(candidate)) {
        i++;
        candidate = `${base}${i}`;
      }
      return candidate;
    },
    [partners],
  );

  const addPartner = useCallback(async (partner: Parameters<typeof createPartnerAction>[0]) => {
    const created = await createPartnerAction(partner);
    setPartners((prev) => [created, ...prev]);
    return created;
  }, []);

  const addStudent = useCallback(async (input: Parameters<typeof createStudentAction>[0]) => {
    const created = await createStudentAction(input);
    setStudents((prev) => [created, ...prev]);
    return created;
  }, []);

  const addExamRecordToStudent = useCallback(
    async (studentId: string, examRecord: Parameters<typeof addExamRecordAction>[1]) => {
      const updated = await addExamRecordAction(studentId, examRecord);
      setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
      return updated;
    },
    [],
  );

  const findStudentsByQuery = useCallback(
    (query: string) => {
      const q = normalizeForSearch(query.trim());
      if (!q) return [];
      return students.filter((s) => {
        const haystack = normalizeForSearch(
          [s.firstName, s.middleName ?? "", s.lastName, s.passportNumber, s.phone].join(" "),
        );
        return haystack.includes(q);
      });
    },
    [students],
  );

  const addSubject = useCallback(async (key: string, label: string) => {
    const created = await addSubjectAction(key, label);
    setSubjects((prev) => [...prev, created]);
    return created;
  }, []);

  const addSubjectLevel = useCallback(async (subjectId: string, label: string) => {
    const created = await addSubjectLevelAction(subjectId, label);
    setSubjectLevels((prev) => [...prev, created]);
    return created;
  }, []);

  const addExamProgram = useCallback(
    async (subjectId: string, key: string, name: string, shortName: string, color: string) => {
      await addExamProgramAction(subjectId, key, name, shortName, color);
      const progs = await listExamPrograms();
      setExamPrograms(progs);
    },
    [],
  );

  const updateExamFee = useCallback(
    async (examRecordId: string, field: FeeField, value: number, pin?: string) => {
      const result = await updateExamFeeAction(examRecordId, field, value, pin);
      if (result.ok) await refresh();
      return result;
    },
    [refresh],
  );

  const addPaymentComment = useCallback(async (examRecordId: string, text: string) => {
    const comment = await addPaymentCommentAction(examRecordId, text);
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        examRecords: s.examRecords.map((r) =>
          r.id === examRecordId
            ? { ...r, paymentComments: [...(r.paymentComments ?? []), comment] }
            : r,
        ),
      })),
    );
    return comment;
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      ready,
      error,
      partners,
      students,
      subjects,
      subjectLevels,
      examPrograms,
      refresh,
      addPartner,
      nextPartnerCode,
      addStudent,
      addExamRecordToStudent,
      findStudentsByQuery,
      addSubject,
      addSubjectLevel,
      addExamProgram,
      updateExamFee,
      addPaymentComment,
    }),
    [
      ready,
      error,
      partners,
      students,
      subjects,
      subjectLevels,
      examPrograms,
      refresh,
      addPartner,
      nextPartnerCode,
      addStudent,
      addExamRecordToStudent,
      findStudentsByQuery,
      addSubject,
      addSubjectLevel,
      addExamProgram,
      updateExamFee,
      addPaymentComment,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
