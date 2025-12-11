-- Таблица для логирования запросов и rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    fingerprint VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_time ON rate_limit_logs(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint_time ON rate_limit_logs(endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_fingerprint_time ON rate_limit_logs(fingerprint, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON rate_limit_logs(created_at);

-- Комментарии
COMMENT ON TABLE rate_limit_logs IS 'Логи запросов для защиты от ботов и rate limiting';
COMMENT ON COLUMN rate_limit_logs.ip_address IS 'IP адрес клиента';
COMMENT ON COLUMN rate_limit_logs.endpoint IS 'Название endpoint (forum, chat, appointments и т.д.)';
COMMENT ON COLUMN rate_limit_logs.fingerprint IS 'Уникальный отпечаток браузера/устройства';
COMMENT ON COLUMN rate_limit_logs.created_at IS 'Время запроса';
