-- The o'tdi/yiqildi result must only ever reflect an explicit staff
-- decision. Defaulting it to true made every freshly-passed exam display
-- as "O'tdi" even though nobody had actually confirmed anything, which
-- confused the client. Make it nullable with no default, and clear the
-- values the previous (defaulted) rollout wrote.
alter table exam_records alter column result drop not null;
alter table exam_records alter column result drop default;
update exam_records set result = null;
