-- Добавление колонки user_login в таблицу doctor_logs
ALTER TABLE doctor_logs ADD COLUMN IF NOT EXISTS user_login VARCHAR(255);

COMMENT ON COLUMN doctor_logs.user_login IS 'Логин пользователя (врача), выполнившего действие';