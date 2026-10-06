-- Whether the student has actually picked up their certificate/result
-- ("oldi") or not yet ("olmadi", the default). Unlike `result`, this is a
-- plain two-state flag — there's no meaningful "not decided" state here,
-- it's simply picked up or not.
alter table exam_records add column if not exists received boolean not null default false;
