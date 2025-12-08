import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta
import random
import urllib.request
import urllib.parse

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Верификация номера телефона через SMS-код (SMSC.ru)
    POST /send - отправить код на телефон
    POST /verify - проверить введенный код
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
    
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    body = json.loads(event.get('body', '{}'))
    action = body.get('action', 'send')
    
    try:
        if action == 'send':
            phone_number = body.get('phone_number', '').strip()
            
            if not phone_number:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Phone number is required'}),
                    'isBase64Encoded': False
                }
            
            clean_phone = ''.join(filter(str.isdigit, phone_number))
            
            if len(clean_phone) < 10:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid phone number format'}),
                    'isBase64Encoded': False
                }
            
            code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
            expires_at = datetime.now() + timedelta(minutes=10)
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute(
                "DELETE FROM t_p30358746_hospital_website_red.sms_verification_codes WHERE expires_at < NOW()"
            )
            
            cursor.execute(
                "SELECT daily_send_count, last_daily_reset FROM t_p30358746_hospital_website_red.sms_verification_codes WHERE phone_number = %s",
                (clean_phone,)
            )
            existing_record = cursor.fetchone()
            
            if existing_record:
                today = datetime.now().date()
                last_reset = existing_record['last_daily_reset']
                
                if last_reset == today:
                    if existing_record['daily_send_count'] >= 3:
                        cursor.close()
                        return {
                            'statusCode': 429,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Превышен лимит отправки SMS на сегодня (максимум 3). Попробуйте завтра.'}),
                            'isBase64Encoded': False
                        }
                    
                    cursor.execute(
                        "UPDATE t_p30358746_hospital_website_red.sms_verification_codes SET code = %s, expires_at = %s, verified = false, attempts = 0, daily_send_count = daily_send_count + 1 WHERE phone_number = %s",
                        (code, expires_at, clean_phone)
                    )
                else:
                    cursor.execute(
                        "UPDATE t_p30358746_hospital_website_red.sms_verification_codes SET code = %s, expires_at = %s, verified = false, attempts = 0, daily_send_count = 1, last_daily_reset = CURRENT_DATE WHERE phone_number = %s",
                        (code, expires_at, clean_phone)
                    )
            else:
                cursor.execute(
                    "INSERT INTO t_p30358746_hospital_website_red.sms_verification_codes (phone_number, code, expires_at, daily_send_count, last_daily_reset) VALUES (%s, %s, %s, 1, CURRENT_DATE)",
                    (clean_phone, code, expires_at)
                )
            
            conn.commit()
            cursor.close()
            
            # Отправка сообщения через МАКС мессенджер
            max_token = os.environ.get('MAX_BOT_TOKEN')
            
            if not max_token:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'MAX Bot Token not configured'}),
                    'isBase64Encoded': False
                }
            
            message_text = f"Ваш код подтверждения для записи на прием: {code}\n\nКод действителен 10 минут."
            
            try:
                # Отправка через MAX API
                request_data = json.dumps({
                    'chat_id': clean_phone,
                    'text': message_text
                }).encode('utf-8')
                
                req = urllib.request.Request(
                    'https://platform-api.max.ru/messages',
                    data=request_data,
                    headers={
                        'Authorization': max_token,
                        'Content-Type': 'application/json'
                    },
                    method='POST'
                )
                
                with urllib.request.urlopen(req, timeout=10) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True, 
                            'message': 'Код отправлен в мессенджер МАКС'
                        }),
                        'isBase64Encoded': False
                    }
                    
            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Не удалось отправить сообщение в МАКС: {error_body}'}),
                    'isBase64Encoded': False
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ошибка отправки: {str(e)}'}),
                    'isBase64Encoded': False
                }
        
        elif action == 'verify':
            phone_number = body.get('phone_number', '').strip()
            code = body.get('code', '').strip()
            
            if not phone_number or not code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Phone number and code are required'}),
                    'isBase64Encoded': False
                }
            
            clean_phone = ''.join(filter(str.isdigit, phone_number))
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute(
                "SELECT * FROM t_p30358746_hospital_website_red.sms_verification_codes WHERE phone_number = %s AND verified = false",
                (clean_phone,)
            )
            verification = cursor.fetchone()
            
            if not verification:
                cursor.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Код не найден или уже использован'}),
                    'isBase64Encoded': False
                }
            
            if datetime.now() > verification['expires_at']:
                cursor.execute(
                    "DELETE FROM t_p30358746_hospital_website_red.sms_verification_codes WHERE phone_number = %s",
                    (clean_phone,)
                )
                conn.commit()
                cursor.close()
                return {
                    'statusCode': 410,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Код истёк, запросите новый'}),
                    'isBase64Encoded': False
                }
            
            if verification['attempts'] >= 3:
                cursor.execute(
                    "DELETE FROM t_p30358746_hospital_website_red.sms_verification_codes WHERE phone_number = %s",
                    (clean_phone,)
                )
                conn.commit()
                cursor.close()
                return {
                    'statusCode': 429,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Превышено количество попыток, запросите новый код'}),
                    'isBase64Encoded': False
                }
            
            if verification['code'] != code:
                cursor.execute(
                    "UPDATE t_p30358746_hospital_website_red.sms_verification_codes SET attempts = attempts + 1 WHERE phone_number = %s",
                    (clean_phone,)
                )
                conn.commit()
                remaining = 3 - (verification['attempts'] + 1)
                cursor.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Неверный код. Осталось попыток: {remaining}'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "UPDATE t_p30358746_hospital_website_red.sms_verification_codes SET verified = true WHERE phone_number = %s",
                (clean_phone,)
            )
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'verified': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action. Use "send" or "verify"'}),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()