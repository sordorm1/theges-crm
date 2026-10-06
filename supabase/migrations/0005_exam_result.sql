-- Whether a sat exam ("Topshirdi"/status='passed') ended with a passing
-- result, independent of status (which only tracks attendance: did the
-- student show up and take the exam at all). Only meaningful when
-- status = 'passed'; defaults to true ("o'tdi") to match the UI default.
alter table exam_records add column if not exists result boolean not null default true;
