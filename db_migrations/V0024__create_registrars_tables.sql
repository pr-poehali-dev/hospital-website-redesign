-- Создание таблицы регистраторов
CREATE TABLE IF NOT EXISTS registrars (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    login VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    clinic VARCHAR(255) NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы журнала действий регистраторов
CREATE TABLE IF NOT EXISTS registrar_logs (
    id SERIAL PRIMARY KEY,
    registrar_id INTEGER REFERENCES registrars(id),
    action_type VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    computer_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_registrar_logs_registrar_id ON registrar_logs(registrar_id);
CREATE INDEX IF NOT EXISTS idx_registrar_logs_created_at ON registrar_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrars_login ON registrars(login);
