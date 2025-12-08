import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Webhook для MAX бота - обрабатывает входящие сообщения от пользователей
    Приветствует новых пользователей и обрабатывает команды
    Сохраняет MAX user_id пользователей в базу данных
    """
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Получаем данные о сообщении от MAX
        message_text = body.get('text', '').strip()
        sender = body.get('from', {})
        user_id = sender.get('id', '')
        username = sender.get('username', '')
        phone = sender.get('phone', '')
        chat_id = body.get('chat', {}).get('id', '')
        message_type = body.get('type', '')
        
        print(f"Получено сообщение от user_id={user_id}, chat_id={chat_id}, phone={phone}: {message_text}")
        
        # Сохраняем user_id в базу данных, если есть номер телефона
        if phone and user_id:
            try:
                database_url = os.environ.get('DATABASE_URL')
                if database_url:
                    conn = psycopg2.connect(database_url)
                    cursor = conn.cursor()
                    
                    # Очищаем номер телефона (только цифры)
                    clean_phone = ''.join(filter(str.isdigit, phone))
                    
                    # Сохраняем или обновляем запись
                    cursor.execute("""
                        INSERT INTO t_p30358746_hospital_website_red.max_users 
                        (phone_number, max_user_id, max_chat_id, last_contact)
                        VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                        ON CONFLICT (phone_number) 
                        DO UPDATE SET 
                            max_user_id = EXCLUDED.max_user_id,
                            max_chat_id = EXCLUDED.max_chat_id,
                            last_contact = CURRENT_TIMESTAMP
                    """, (clean_phone, user_id, chat_id))
                    
                    conn.commit()
                    cursor.close()
                    conn.close()
                    print(f"Сохранен user_id={user_id} для телефона {clean_phone}")
            except Exception as db_error:
                print(f"Ошибка сохранения в БД: {db_error}")
        
        # Определяем ответ на основе команды
        response_text = ""
        
        if message_text.lower() in ['/start', 'start', 'начать', 'привет']:
            response_text = f"""👋 Добро пожаловать в ГБУЗ «Антрацитовская центральная городская многопрофильная больница» ЛНР!

Я бот для записи на прием к врачам.

⚠️ ВАЖНО: Для получения кодов подтверждения отправьте мне ваш номер телефона в формате:
📱 +79991234567

Или просто:
📱 79991234567

После этого:
🔹 Перейдите на сайт больницы
🔹 Выберите врача, дату и время
🔹 Укажите тот же номер телефона
🔹 Я пришлю код подтверждения сюда, в этот чат

📞 По всем вопросам звоните: +7-857-312-51-02"""
        
        elif message_text.lower() in ['помощь', 'help', '/help']:
            response_text = """ℹ️ Как пользоваться ботом:

1️⃣ Зайдите на сайт больницы
2️⃣ Нажмите "Записаться на прием"
3️⃣ Выберите врача и время
4️⃣ Укажите ваш номер телефона (тот, что привязан к МАКС)
5️⃣ Получите код в этом чате
6️⃣ Введите код на сайте

❗ Важно: номер телефона на сайте должен совпадать с номером в мессенджере МАКС

📞 Контакты больницы: +7-857-312-51-02"""
        
        elif message_text.lower() in ['контакты', 'телефон', 'адрес']:
            response_text = """📍 Контактная информация:

📞 Приемная главного врача: +7-857-312-51-02
📞 Коммутатор: +7-857-312-60-57
📧 Email: antrasit_1gorbolnica@mail.ru

🏥 Адрес: 294613, Российская Федерация, Луганская Народная Республика, город Антрацит, улица Толстоусова, дом 1

⏰ Режим работы: Пн-Пт 09:00-17:00"""
        
        else:
            # Проверяем, может это номер телефона
            clean_phone = ''.join(filter(str.isdigit, message_text))
            if len(clean_phone) >= 10 and len(clean_phone) <= 12:
                # Это похоже на номер телефона - сохраняем
                try:
                    database_url = os.environ.get('DATABASE_URL')
                    if database_url:
                        conn = psycopg2.connect(database_url)
                        cursor = conn.cursor()
                        
                        cursor.execute("""
                            INSERT INTO t_p30358746_hospital_website_red.max_users 
                            (phone_number, max_user_id, max_chat_id, last_contact)
                            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                            ON CONFLICT (phone_number) 
                            DO UPDATE SET 
                                max_user_id = EXCLUDED.max_user_id,
                                max_chat_id = EXCLUDED.max_chat_id,
                                last_contact = CURRENT_TIMESTAMP
                        """, (clean_phone, user_id, chat_id))
                        
                        conn.commit()
                        cursor.close()
                        conn.close()
                        
                        response_text = f"""✅ Отлично! Ваш номер {clean_phone} успешно сохранён!

Теперь вы можете записаться на прием:
1️⃣ Перейдите на сайт больницы
2️⃣ Выберите врача, дату и время
3️⃣ Укажите номер телефона: +{clean_phone}
4️⃣ Код подтверждения придёт сюда, в этот чат

📞 Контакты: +7-857-312-51-02"""
                        print(f"Сохранен номер {clean_phone} для user_id={user_id}")
                except Exception as db_error:
                    print(f"Ошибка сохранения номера: {db_error}")
                    response_text = """❌ Не удалось сохранить номер. Попробуйте позже.
                    
📞 По вопросам звоните: +7-857-312-51-02"""
            else:
                response_text = """Спасибо за ваше сообщение! 

Я бот для отправки кодов подтверждения при записи на прием.

Доступные команды:
• /start - начать работу
• помощь - как пользоваться
• контакты - контакты больницы

📱 Отправьте мне ваш номер телефона, чтобы получать коды верификации."""
        
        # Возвращаем ответ для пользователя (MAX API сам отправит это сообщение)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'type': 'text',
                'text': response_text,
                'chat_id': chat_id
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f"Ошибка обработки webhook: {type(e).__name__}: {str(e)}")
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }