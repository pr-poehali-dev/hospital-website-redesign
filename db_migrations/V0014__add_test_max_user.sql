-- Добавление тестового номера для верификации
INSERT INTO t_p30358746_hospital_website_red.max_users 
(phone_number, max_user_id, max_chat_id, last_contact) 
VALUES ('79591015997', 'test_user_79591015997', 'test_chat_79591015997', CURRENT_TIMESTAMP)
ON CONFLICT (phone_number) 
DO UPDATE SET 
    max_user_id = EXCLUDED.max_user_id,
    max_chat_id = EXCLUDED.max_chat_id,
    last_contact = CURRENT_TIMESTAMP;