-- Добавление недостающих полей в таблицу admins
ALTER TABLE t_p30358746_hospital_website_red.admins 
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_admins_login ON t_p30358746_hospital_website_red.admins(login);
CREATE INDEX IF NOT EXISTS idx_admins_email ON t_p30358746_hospital_website_red.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON t_p30358746_hospital_website_red.admins(is_active);

-- Обновление существующих записей (добавление email если нет)
UPDATE t_p30358746_hospital_website_red.admins 
SET email = login || '@admin.local', 
    is_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email IS NULL;