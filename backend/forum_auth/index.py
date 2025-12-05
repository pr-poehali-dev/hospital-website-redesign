import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import secrets
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Регистрация и авторизация пользователей форума
    POST /register - регистрация (возвращает код подтверждения)
    POST /verify - подтверждение email по коду
    POST /login - вход
    POST /check - проверка токена
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token',
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
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                email = body.get('email', '').strip().lower()
                username = body.get('username', '').strip()
                password = body.get('password', '').strip()
                
                if not all([email, username, password]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Все поля обязательны'}),
                        'isBase64Encoded': False
                    }
                
                if len(password) < 6:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пароль должен быть минимум 6 символов'}),
                        'isBase64Encoded': False
                    }
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                cursor.execute("SELECT id FROM forum_users WHERE email = %s OR username = %s", (email, username))
                existing = cursor.fetchone()
                
                if existing:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email или имя пользователя уже заняты'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                verification_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
                
                cursor.execute(
                    "INSERT INTO forum_users (email, username, password_hash, verification_code, is_verified, is_blocked, created_at) VALUES (%s, %s, %s, %s, FALSE, FALSE, CURRENT_TIMESTAMP) RETURNING id",
                    (email, username, password_hash, verification_code)
                )
                user_id = cursor.fetchone()['id']
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Регистрация успешна! Используйте код для подтверждения',
                        'verification_code': verification_code,
                        'user_id': user_id
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'verify':
                user_id = body.get('user_id')
                code = body.get('code', '').strip()
                
                if not all([user_id, code]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID пользователя и код обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute("SELECT * FROM forum_users WHERE id = %s AND verification_code = %s", (user_id, code))
                user = cursor.fetchone()
                
                if not user:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный код подтверждения'}),
                        'isBase64Encoded': False
                    }
                
                user_token = secrets.token_urlsafe(32)
                
                cursor.execute(
                    "UPDATE forum_users SET is_verified = TRUE, verification_code = %s, last_login = CURRENT_TIMESTAMP WHERE id = %s",
                    (user_token, user_id)
                )
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Email подтвержден!',
                        'token': user_token,
                        'user': {
                            'id': user['id'],
                            'username': user['username'],
                            'email': user['email']
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                email = body.get('email', '').strip().lower()
                password = body.get('password', '').strip()
                
                if not all([email, password]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email и пароль обязательны'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute("SELECT * FROM forum_users WHERE email = %s AND password_hash = %s", (email, password_hash))
                user = cursor.fetchone()
                
                if not user:
                    cursor.close()
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный email или пароль'}),
                        'isBase64Encoded': False
                    }
                
                if not user['is_verified']:
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email не подтвержден'}),
                        'isBase64Encoded': False
                    }
                
                if user['is_blocked']:
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь заблокирован: ' + (user.get('blocked_reason') or 'Причина не указана')}),
                        'isBase64Encoded': False
                    }
                
                user_token = secrets.token_urlsafe(32)
                cursor.execute(
                    "UPDATE forum_users SET verification_code = %s, last_login = CURRENT_TIMESTAMP WHERE id = %s",
                    (user_token, user['id'])
                )
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'token': user_token,
                        'user': {
                            'id': user['id'],
                            'username': user['username'],
                            'email': user['email']
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'check':
                token = body.get('token', '').strip()
                
                if not token:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Токен обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute("SELECT id, username, email, is_blocked FROM forum_users WHERE verification_code = %s AND is_verified = TRUE", (token,))
                user = cursor.fetchone()
                cursor.close()
                
                if not user or user['is_blocked']:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Недействительный токен'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'valid': True,
                        'user': {
                            'id': user['id'],
                            'username': user['username'],
                            'email': user['email']
                        }
                    }),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверное действие'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()
