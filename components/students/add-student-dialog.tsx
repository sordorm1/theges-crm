"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Plus, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/lib/data/store-context";
import { EXAM_PROGRAMS, SUBJECT_LABELS, programsForSubject } from "@/lib/data/programs";
import { fullName } from "@/lib/format";
import type { ExamStatus, Student, Subject } from "@/lib/types";

function randomToken(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function randomExamKey() {
  const seg = () => randomToken(4).toUpperCase();
  return `${seg()}-${seg()}-${seg()}`;
}

export function AddStudentDialog({
  defaultPartnerId,
  onOpenExisting,
}: {
  defaultPartnerId?: string;
  onOpenExisting: (student: Student) => void;
}) {
  const { partners, addStudent, findStudentsByQuery } = useAppData();
  const [open, setOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [passport, setPassport] = useState("");
  const [phone, setPhone] = useState("");
  const [partnerId, setPartnerId] = useState<string>(defaultPartnerId ?? "none");
  const [subject, setSubject] = useState<Subject | "">("");
  const [programId, setProgramId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [status, setStatus] = useState<ExamStatus>("scheduled");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState(randomToken(8));
  const [examKey, setExamKey] = useState(randomExamKey());

  const duplicate = useMemo(() => {
    if (!passport.trim() || passport.trim().length < 4) return [];
    return findStudentsByQuery(passport.trim());
  }, [passport, findStudentsByQuery]);

  const availablePrograms = subject ? programsForSubject(subject) : EXAM_PROGRAMS;

  function reset() {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setPassport("");
    setPhone("");
    setPartnerId(defaultPartnerId ?? "none");
    setSubject("");
    setProgramId("");
    setExamDate("");
    setStatus("scheduled");
    setLogin("");
    setPassword(randomToken(8));
    setExamKey(randomExamKey());
  }

  function handleSubmit() {
    if (duplicate.length > 0) {
      toast.error("Такой ученик уже есть в системе");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !passport.trim()) {
      toast.error("Заполните имя, фамилию и паспортные данные");
      return;
    }

    const created = addStudent({
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      passportNumber: passport.trim().toUpperCase(),
      phone: phone.trim(),
      partnerId: partnerId === "none" ? null : partnerId,
      examRecords: programId
        ? [
            {
              id: `${Date.now()}`,
              examProgramId: programId,
              date: examDate || new Date().toISOString(),
              status,
              login: login.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
              password,
              examKey,
            },
          ]
        : [],
    });

    toast.success(`Ученик ${fullName(created)} добавлен`);
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="size-4" />
        Добавить ученика
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый ученик</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Firstname</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Middlename</Label>
              <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Lastname</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Паспортные данные</Label>
              <Input
                value={passport}
                onChange={(e) => setPassport(e.target.value.toUpperCase())}
                placeholder="AB1234567"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Телефон</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
            </div>
          </div>

          {duplicate.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                <AlertTriangle className="size-4" />
                Ученик с такими данными уже есть в системе
              </div>
              {duplicate.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onOpenExisting(s);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-left text-xs hover:bg-amber-100"
                >
                  <span className="font-medium">{fullName(s)}</span>
                  <span className="text-muted-foreground">{s.passportNumber} · открыть →</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Партнёр</Label>
            <Select
              value={partnerId}
              onValueChange={(v) => setPartnerId(v ?? "none")}
              items={{
                none: "Без партнёра",
                ...Object.fromEntries(partners.map((p) => [p.id, `${p.name} (${p.code})`])),
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без партнёра</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Направление</Label>
              <Select
                value={subject}
                onValueChange={(v) => {
                  setSubject(v as Subject);
                  setProgramId("");
                }}
                items={SUBJECT_LABELS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите направление" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBJECT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Экзамен / программа</Label>
              <Select
                value={programId}
                onValueChange={(v) => setProgramId(v ?? "")}
                disabled={!subject}
                items={Object.fromEntries(availablePrograms.map((p) => [p.id, p.name]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите экзамен" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrograms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {programId && (
            <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Дата экзамена</Label>
                  <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Статус</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as ExamStatus)}
                    items={{ scheduled: "Запланирован", passed: "Сдал", failed: "Не сдал" }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Запланирован</SelectItem>
                      <SelectItem value="passed">Сдал</SelectItem>
                      <SelectItem value="failed">Не сдал</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Логин</Label>
                  <Input
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="auto"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Пароль</Label>
                  <div className="flex gap-1.5">
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPassword(randomToken(8))}
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Exam Key</Label>
                  <div className="flex gap-1.5">
                    <Input value={examKey} onChange={(e) => setExamKey(e.target.value)} className="font-mono" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setExamKey(randomExamKey())}
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={duplicate.length > 0}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
