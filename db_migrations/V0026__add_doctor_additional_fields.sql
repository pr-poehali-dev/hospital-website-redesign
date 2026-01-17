-- Добавление новых полей для врачей
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS work_experience INTEGER,
ADD COLUMN IF NOT EXISTS office_number VARCHAR(20);