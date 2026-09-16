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
  FinanceTransaction,
  Partner,
  PaymentComment,
  Student,
  SubjectLevel,
  SubjectRow,
} from "@/lib/types";
import {
  listPartners,
  createPartner as createPartnerAction,
  deletePartner as deletePartnerAction,
} from "@/lib/api/partners";
import {
  listStudents,
  createStudent as createStudentAction,
  addExamRecordToStudent as addExamRecordAction,
  updateStudentProfile as updateStudentProfileAction,
  updateExamRecord as updateExamRecordAction,
  deleteStudent as deleteStudentAction,
  deleteExamRecord as deleteExamRecordAction,
  type StudentProfileInput,
  type ExamRecordEditInput,
} from "@/lib/api/students";
import {
  listSubjects,
  addSubject as addSubjectAction,
  listSubjectLevels,
  addSubjectLevel as addSubjectLevelAction,
  listExamPrograms,
  addExamProgram as addExamProgramAction,
  deleteSubject as deleteSubjectAction,
  deleteSubjectLevel as deleteSubjectLevelAction,
  deleteExamProgram as deleteExamProgramAction,
} from "@/lib/api/catalog";
import {
  updateExamFee as updateExamFeeAction,
  addPaymentComment as addPaymentCommentAction,
  deletePaymentComment as deletePaymentCommentAction,
  type FeeField,
  type UpdateFeeResult,
} from "@/lib/api/payments";
import {
  listFinanceTransactions,
  addDeposit as addDepositAction,
  deleteFinanceTransaction as deleteFinanceTransactionAction,
} from "@/lib/api/finance";
import { normalizeForSearch } from "@/lib/normalize";

interface AppDataContextValue {
  ready: boolean;
  error: string | null;
  partners: Partner[];
  students: Student[];
  subjects: SubjectRow[];
  subjectLevels: SubjectLevel[];
  examPrograms: ExamProgram[];
  financeTransactions: FinanceTransaction[];
  refresh: () => Promise<void>;

  addPartner: (partner: {
    name: string;
    phone: string;
    code: string;
    logoDataUrl?: string;
  }) => Promise<Partner>;
  deletePartner: (partnerId: string) => Promise<void>;
  nextPartnerCode: (name: string) => string;

  addStudent: (student: Parameters<typeof createStudentAction>[0]) => Promise<Student>;
  deleteStudent: (studentId: string) => Promise<void>;
  addExamRecordToStudent: (
    studentId: string,
    examRecord: Parameters<typeof addExamRecordAction>[1],
  ) => Promise<Student>;
  deleteExamRecord: (examRecordId: string) => Promise<Student>;
  findStudentsByQuery: (query: string) => Student[];
  updateStudentProfile: (studentId: string, profile: StudentProfileInput) => Promise<Student>;
  updateExamRecord: (examRecordId: string, examRecord: ExamRecordEditInput) => Promise<Student>;

  addSubject: (key: string, label: string) => Promise<SubjectRow>;
  deleteSubject: (subjectId: string) => Promise<void>;
  addSubjectLevel: (subjectId: string, label: string) => Promise<SubjectLevel>;
  deleteSubjectLevel: (levelId: string) => Promise<void>;
  addExamProgram: (
    subjectId: string,
    key: string,
    name: string,
    shortName: string,
    color: string,
  ) => Promise<void>;
  deleteExamProgram: (programId: string) => Promise<void>;

  updateExamFee: (
    examRecordId: string,
    field: FeeField,
    value: number,
    pin?: string,
  ) => Promise<UpdateFeeResult>;
  addPaymentComment: (examRecordId: string, text: string) => Promise<PaymentComment>;
  deletePaymentComment: (examRecordId: string, commentId: string) => Promise<void>;

  addDeposit: (partnerId: string, amount: number, note?: string) => Promise<FinanceTransaction>;
  deleteFinanceTransaction: (transactionId: string) => Promise<void>;
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
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);

  const refresh = useCallback(async () => {
    const [p, s, subj, lvls, progs, tx] = await Promise.all([
      listPartners(),
      listStudents(),
      listSubjects(),
      listSubjectLevels(),
      listExamPrograms(),
      listFinanceTransactions(),
    ]);
    setPartners(p);
    setStudents(s);
    setSubjects(subj);
    setSubjectLevels(lvls);
    setExamPrograms(progs);
    setFinanceTransactions(tx);
  }, []);

  // Many mutations (adding/editing a student or exam record) change the
  // server-side finance ledger as a side effect (see supabase/functions/
  // _shared/finance.ts). Rather than duplicate that logic on the client,
  // just refetch the ledger after anything that could have touched it.
  const refreshFinance = useCallback(async () => {
    setFinanceTransactions(await listFinanceTransactions());
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

  const deletePartner = useCallback(async (partnerId: string) => {
    await deletePartnerAction(partnerId);
    setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    setStudents((prev) =>
      prev.map((s) => (s.partnerId === partnerId ? { ...s, partnerId: null } : s)),
    );
    await refreshFinance();
  }, [refreshFinance]);

  const addStudent = useCallback(
    async (input: Parameters<typeof createStudentAction>[0]) => {
      const created = await createStudentAction(input);
      setStudents((prev) => [created, ...prev]);
      await refreshFinance();
      return created;
    },
    [refreshFinance],
  );

  const deleteStudent = useCallback(
    async (studentId: string) => {
      await deleteStudentAction(studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      await refreshFinance();
    },
    [refreshFinance],
  );

  const addExamRecordToStudent = useCallback(
    async (studentId: string, examRecord: Parameters<typeof addExamRecordAction>[1]) => {
      const updated = await addExamRecordAction(studentId, examRecord);
      setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
      await refreshFinance();
      return updated;
    },
    [refreshFinance],
  );

  const deleteExamRecord = useCallback(
    async (examRecordId: string) => {
      const updated = await deleteExamRecordAction(examRecordId);
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      await refreshFinance();
      return updated;
    },
    [refreshFinance],
  );

  const updateStudentProfile = useCallback(
    async (studentId: string, profile: StudentProfileInput) => {
      const updated = await updateStudentProfileAction(studentId, profile);
      setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
      await refreshFinance();
      return updated;
    },
    [refreshFinance],
  );

  const updateExamRecord = useCallback(
    async (examRecordId: string, examRecord: ExamRecordEditInput) => {
      const updated = await updateExamRecordAction(examRecordId, examRecord);
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      await refreshFinance();
      return updated;
    },
    [refreshFinance],
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

  const deleteSubject = useCallback(async (subjectId: string) => {
    await deleteSubjectAction(subjectId);
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    setSubjectLevels((prev) => prev.filter((l) => l.subjectId !== subjectId));
  }, []);

  const addSubjectLevel = useCallback(async (subjectId: string, label: string) => {
    const created = await addSubjectLevelAction(subjectId, label);
    setSubjectLevels((prev) => [...prev, created]);
    return created;
  }, []);

  const deleteSubjectLevel = useCallback(async (levelId: string) => {
    await deleteSubjectLevelAction(levelId);
    setSubjectLevels((prev) => prev.filter((l) => l.id !== levelId));
  }, []);

  const addExamProgram = useCallback(
    async (subjectId: string, key: string, name: string, shortName: string, color: string) => {
      await addExamProgramAction(subjectId, key, name, shortName, color);
      const progs = await listExamPrograms();
      setExamPrograms(progs);
    },
    [],
  );

  const deleteExamProgram = useCallback(async (programId: string) => {
    await deleteExamProgramAction(programId);
    setExamPrograms((prev) => prev.filter((p) => p.id !== programId));
  }, []);

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

  const deletePaymentComment = useCallback(async (examRecordId: string, commentId: string) => {
    await deletePaymentCommentAction(commentId);
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        examRecords: s.examRecords.map((r) =>
          r.id === examRecordId
            ? { ...r, paymentComments: (r.paymentComments ?? []).filter((c) => c.id !== commentId) }
            : r,
        ),
      })),
    );
  }, []);

  const addDeposit = useCallback(
    async (partnerId: string, amount: number, note?: string) => {
      const created = await addDepositAction(partnerId, amount, note);
      setFinanceTransactions((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const deleteFinanceTransaction = useCallback(async (transactionId: string) => {
    await deleteFinanceTransactionAction(transactionId);
    setFinanceTransactions((prev) => prev.filter((t) => t.id !== transactionId));
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
      financeTransactions,
      refresh,
      addPartner,
      deletePartner,
      nextPartnerCode,
      addStudent,
      deleteStudent,
      addExamRecordToStudent,
      deleteExamRecord,
      findStudentsByQuery,
      updateStudentProfile,
      updateExamRecord,
      addSubject,
      deleteSubject,
      addSubjectLevel,
      deleteSubjectLevel,
      addExamProgram,
      deleteExamProgram,
      updateExamFee,
      addPaymentComment,
      deletePaymentComment,
      addDeposit,
      deleteFinanceTransaction,
    }),
    [
      ready,
      error,
      partners,
      students,
      subjects,
      subjectLevels,
      examPrograms,
      financeTransactions,
      refresh,
      addPartner,
      deletePartner,
      nextPartnerCode,
      addStudent,
      deleteStudent,
      addExamRecordToStudent,
      deleteExamRecord,
      findStudentsByQuery,
      updateStudentProfile,
      updateExamRecord,
      addSubject,
      deleteSubject,
      addSubjectLevel,
      deleteSubjectLevel,
      addExamProgram,
      deleteExamProgram,
      updateExamFee,
      addPaymentComment,
      deletePaymentComment,
      addDeposit,
      deleteFinanceTransaction,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
