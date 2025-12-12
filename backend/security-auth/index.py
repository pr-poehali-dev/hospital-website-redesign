import json
import os
import psycopg2
import bcrypt
from typing import Dict, Any, Optional

def get_db_connection():
    """Создание безопасного подключения к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def verify_password(password: str, password_hash: str) -> bool:
    """Проверка пароля через bcrypt"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except:
        return False

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Аутентификация для панели безопасности через БД
    POST {login, password} - проверить логин и пароль
    '''
    
    method: str = event.get('httpMethod', 'POST')
    
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        body_data = json.loads(event.get('body', '{}'))
        login = body_data.get('login', '').strip()
        password = body_data.get('password', '').strip()
        
        if not login or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'error': 'Логин и пароль обязательны'
                }),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT id, login, password_hash, email, is_active 
               FROM t_p30358746_hospital_website_red.admins 
               WHERE login = %s""",
            (login,)
        )
        
        result = cursor.fetchone()
        cursor.close()
        
        if not result:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'error': 'Неверный логин или пароль'
                }),
                'isBase64Encoded': False
            }
        
        admin_id, admin_login, password_hash, email, is_active = result
        
        if not is_active:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'error': 'Аккаунт деактивирован'
                }),
                'isBase64Encoded': False
            }
        
        if not verify_password(password, password_hash):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': False,
                    'error': 'Неверный логин или пароль'
                }),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE t_p30358746_hospital_website_red.admins SET last_login = CURRENT_TIMESTAMP WHERE id = %s",
            (admin_id,)
        )
        conn.commit()
        cursor.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'token': password_hash,
                'admin': {
                    'id': admin_id,
                    'login': admin_login,
                    'email': email
                }
            }),
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
        if conn:
            conn.close()