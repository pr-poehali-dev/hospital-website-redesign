-- Добавление поля для подсчета отправок SMS в день
ALTER TABLE t_p30358746_hospital_website_red.sms_verification_codes 
ADD COLUMN IF NOT EXISTS daily_send_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_daily_reset DATE DEFAULT CURRENT_DATE;

-- Индекс для быстрой проверки дневных лимитов
CREATE INDEX IF NOT EXISTS idx_sms_daily_limit ON t_p30358746_hospital_website_red.sms_verification_codes(phone_number, last_daily_reset);