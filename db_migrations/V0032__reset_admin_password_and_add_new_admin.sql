-- Обновление пароля существующего администратора Pioneer78
UPDATE admins 
SET password_hash = '$2b$12$VQXJzN5kYmYhWqF9v8EqtOHx1vZvNfXUzKLVl9EzRNJCRQWxJzaGy'
WHERE login = 'Pioneer78';

-- Добавление нового администратора komarova.eg
INSERT INTO admins (login, password_hash, full_name, email, is_active)
VALUES (
  'komarova.eg',
  '$2b$12$8Zf3QxX0gYQhJzKvN1WqE.YfZqJXLqHvZvN2F9z3X4Kq5B6C7D8E9',
  'Комарова Елена Геннадьевна',
  'test@mail.ru',
  true
)
ON CONFLICT (login) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;