"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Partner, Student } from "@/lib/types";
import { generateSeed } from "@/lib/data/seed";

const STORAGE_KEY = "theges.crm.v3";

interface StoredData {
  partners: Partner[];
  students: Student[];
}

interface AppDataContextValue {
  ready: boolean;
  partners: Partner[];
  students: Student[];
  addPartner: (partner: Omit<Partner, "id" | "createdAt">) => Partner;
  addStudent: (student: Omit<Student, "id" | "createdAt">) => Student;
  findStudentsByQuery: (query: string) => Student[];
  nextPartnerCode: (name: string) => string;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function loadFromStorage(): StoredData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredData;
  } catch {
    return null;
  }
}

function saveToStorage(data: StoredData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — ignore, demo still works in-memory
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<StoredData>({ partners: [], students: [] });

  useEffect(() => {
    const stored = loadFromStorage();
    const initial = stored ?? generateSeed();
    if (!stored) saveToStorage(initial);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
    setData(initial);
    setReady(true);
  }, []);

  const partners = data.partners;
  const students = data.students;

  useEffect(() => {
    if (!ready) return;
    saveToStorage(data);
  }, [ready, data]);

  const nextPartnerCode = useCallback(
    (name: string) => {
      const base = name
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

  const addPartner = useCallback(
    (partner: Omit<Partner, "id" | "createdAt">) => {
      const newPartner: Partner = {
        ...partner,
        id: makeId("partner"),
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, partners: [newPartner, ...prev.partners] }));
      return newPartner;
    },
    [],
  );

  const addStudent = useCallback((student: Omit<Student, "id" | "createdAt">) => {
    const newStudent: Student = {
      ...student,
      id: makeId("student"),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, students: [newStudent, ...prev.students] }));
    return newStudent;
  }, []);

  const findStudentsByQuery = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return students.filter((s) => {
        const haystack = [
          s.firstName,
          s.middleName ?? "",
          s.lastName,
          s.passportNumber,
          s.phone,
        ]
          .join(" ")
          .toLowerCase()
          .replace(/[\s-]/g, "");
        return haystack.includes(q.replace(/[\s-]/g, ""));
      });
    },
    [students],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      ready,
      partners,
      students,
      addPartner,
      addStudent,
      findStudentsByQuery,
      nextPartnerCode,
    }),
    [ready, partners, students, addPartner, addStudent, findStudentsByQuery, nextPartnerCode],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
