import json
import os
import psycopg2
import bcrypt
from typing import Dict, Any, Optional
from datetime import datetime

def get_db_connection():
    """Создание безопасного подключения к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def verify_admin_token(token: str, conn) -> Optional[Dict[str, Any]]:
    """Проверка токена администратора"""
    if not token:
        return None
    
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, login, email, is_active FROM t_p30358746_hospital_website_red.admins WHERE password_hash = %s AND is_active = true",
            (token,)
        )
        result = cursor.fetchone()
        if result:
            return {'id': result[0], 'login': result[1], 'email': result[2], 'is_active': result[3]}
        return None
    finally:
        cursor.close()

def hash_password(password: str) -> str:
    """Безопасное хеширование пароля с bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Проверка пароля"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление администраторами системы безопасности
    GET /admins - список всех администраторов
    POST /admins - создание нового администратора
    PUT /admins/{id} - обновление администратора
    DELETE /admins/{id} - удаление администратора
    '''
    
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    admin_token = headers.get('X-Admin-Token') or headers.get('x-admin-token')
    
    conn = get_db_connection()
    
    try:
        admin = verify_admin_token(admin_token, conn)
        if not admin:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    SELECT id, login, email, created_at, updated_at, is_active, last_login, full_name
                    FROM t_p30358746_hospital_website_red.admins
                    ORDER BY created_at DESC
                """)
                
                admins = []
                for row in cursor.fetchall():
                    admins.append({
                        'id': row[0],
                        'login': row[1],
                        'email': row[2],
                        'created_at': row[3].isoformat() if row[3] else None,
                        'updated_at': row[4].isoformat() if row[4] else None,
                        'is_active': row[5],
                        'last_login': row[6].isoformat() if row[6] else None,
                        'full_name': row[7]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'admins': admins}),
                    'isBase64Encoded': False
                }
            finally:
                cursor.close()
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            login = body_data.get('login', '').strip()
            email = body_data.get('email', '').strip()
            password = body_data.get('password', '').strip()
            full_name = body_data.get('full_name', '').strip()
            
            if not login or not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Login, email и password обязательны'}),
                    'isBase64Encoded': False
                }
            
            if len(password) < 8:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пароль должен быть минимум 8 символов'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            
            cursor = conn.cursor()
            try:
                cursor.execute(
                    """INSERT INTO t_p30358746_hospital_website_red.admins 
                       (login, email, password_hash, full_name, created_at, updated_at, is_active) 
                       VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true) 
                       RETURNING id""",
                    (login, email, password_hash, full_name if full_name else None)
                )
                new_id = cursor.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'id': new_id,
                        'message': 'Администратор создан'
                    }),
                    'isBase64Encoded': False
                }
            except psycopg2.IntegrityError as e:
                conn.rollback()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Администратор с таким логином или email уже существует'}),
                    'isBase64Encoded': False
                }
            finally:
                cursor.close()
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            admin_id = body_data.get('id')
            
            if not admin_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID администратора обязателен'}),
                    'isBase64Encoded': False
                }
            
            updates = []
            params = []
            
            if 'login' in body_data and body_data['login'].strip():
                updates.append('login = %s')
                params.append(body_data['login'].strip())
            
            if 'email' in body_data and body_data['email'].strip():
                updates.append('email = %s')
                params.append(body_data['email'].strip())
            
            if 'full_name' in body_data:
                updates.append('full_name = %s')
                params.append(body_data['full_name'].strip() if body_data['full_name'] else None)
            
            if 'password' in body_data and body_data['password'].strip():
                password = body_data['password'].strip()
                if len(password) < 8:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пароль должен быть минимум 8 символов'}),
                        'isBase64Encoded': False
                    }
                updates.append('password_hash = %s')
                params.append(hash_password(password))
            
            if 'is_active' in body_data:
                updates.append('is_active = %s')
                params.append(body_data['is_active'])
            
            if not updates:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет данных для обновления'}),
                    'isBase64Encoded': False
                }
            
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(admin_id)
            
            cursor = conn.cursor()
            try:
                query = f"UPDATE t_p30358746_hospital_website_red.admins SET {', '.join(updates)} WHERE id = %s"
                cursor.execute(query, params)
                conn.commit()
                
                if cursor.rowcount == 0:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Администратор не найден'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Администратор обновлен'
                    }),
                    'isBase64Encoded': False
                }
            except psycopg2.IntegrityError:
                conn.rollback()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Логин или email уже используется'}),
                    'isBase64Encoded': False
                }
            finally:
                cursor.close()
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {})
            admin_id = query_params.get('id')
            
            if not admin_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID администратора обязателен'}),
                    'isBase64Encoded': False
                }
            
            try:
                admin_id_int = int(admin_id)
            except ValueError:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Некорректный ID'}),
                    'isBase64Encoded': False
                }
            
            if admin_id_int == admin['id']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нельзя удалить самого себя'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor()
            try:
                cursor.execute(
                    "DELETE FROM t_p30358746_hospital_website_red.admins WHERE id = %s",
                    (admin_id_int,)
                )
                conn.commit()
                
                if cursor.rowcount == 0:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Администратор не найден'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Администратор удален'
                    }),
                    'isBase64Encoded': False
                }
            finally:
                cursor.close()
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
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
