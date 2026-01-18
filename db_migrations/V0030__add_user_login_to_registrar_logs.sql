-- Добавление колонки user_login в таблицу registrar_logs
ALTER TABLE registrar_logs ADD COLUMN IF NOT EXISTS user_login VARCHAR(255);

COMMENT ON COLUMN registrar_logs.user_login IS 'Логин пользователя (регистратора), выполнившего действие';