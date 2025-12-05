-- Создание таблицы для хранения SMS-кодов верификации
CREATE TABLE IF NOT EXISTS t_p30358746_hospital_website_red.sms_verification_codes (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    CONSTRAINT unique_active_phone UNIQUE (phone_number)
);

-- Индекс для быстрого поиска по номеру телефона
CREATE INDEX idx_sms_phone ON t_p30358746_hospital_website_red.sms_verification_codes(phone_number);

-- Индекс для очистки истёкших кодов
CREATE INDEX idx_sms_expires ON t_p30358746_hospital_website_red.sms_verification_codes(expires_at);