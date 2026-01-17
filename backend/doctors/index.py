import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление врачами: создание, чтение, обновление, удаление
    GET / - получить всех врачей
    GET /?id=X - получить врача по ID
    POST / - создать врача
    PUT / - обновить врача
    DELETE /?id=X - удалить врача
    """
    method = event.get('httpMethod', 'GET')
    ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
    print(f"[ACCESS] IP: {ip_address} | Method: {method}")
    
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
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            doctor_id = query_params.get('id')
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if doctor_id:
                cursor.execute("SELECT id, full_name, phone, position, specialization, login, photo_url, is_active, clinic, education, work_experience, office_number, created_at FROM doctors WHERE id = %s", (doctor_id,))
                doctor = cursor.fetchone()
                cursor.close()
                
                if not doctor:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Doctor not found'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'doctor': doctor}, default=str),
                    'isBase64Encoded': False
                }
            else:
                cursor.execute("SELECT id, full_name, phone, position, specialization, login, photo_url, is_active, clinic, education, work_experience, office_number, created_at FROM doctors ORDER BY clinic, full_name")
                doctors = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'doctors': doctors}, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            full_name = body.get('full_name')
            phone = body.get('phone')
            position = body.get('position')
            specialization = body.get('specialization')
            login = body.get('login')
            password = body.get('password', 'doctor123')
            photo_url = body.get('photo_url')
            clinic = body.get('clinic', 'Центральная городская поликлиника')
            education = body.get('education')
            work_experience = body.get('work_experience')
            office_number = body.get('office_number')
            
            if not all([full_name, position, login]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields: full_name, position, login'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(
                "INSERT INTO doctors (full_name, phone, position, specialization, login, password_hash, photo_url, clinic, education, work_experience, office_number) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, full_name, phone, position, specialization, login, photo_url, is_active, clinic, education, work_experience, office_number, created_at",
                (full_name, phone, position, specialization, login, password, photo_url, clinic, education, work_experience, office_number)
            )
            doctor = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'doctor': doctor}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            doctor_id = body.get('id')
            
            if not doctor_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Doctor ID is required'}),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            update_values = []
            
            if 'full_name' in body:
                update_fields.append('full_name = %s')
                update_values.append(body['full_name'])
            if 'phone' in body:
                update_fields.append('phone = %s')
                update_values.append(body['phone'])
            if 'position' in body:
                update_fields.append('position = %s')
                update_values.append(body['position'])
            if 'specialization' in body:
                update_fields.append('specialization = %s')
                update_values.append(body['specialization'])
            if 'photo_url' in body:
                update_fields.append('photo_url = %s')
                update_values.append(body['photo_url'])
            if 'is_active' in body:
                update_fields.append('is_active = %s')
                update_values.append(body['is_active'])
            if 'clinic' in body:
                update_fields.append('clinic = %s')
                update_values.append(body['clinic'])
            if 'education' in body:
                update_fields.append('education = %s')
                update_values.append(body['education'])
            if 'work_experience' in body:
                update_fields.append('work_experience = %s')
                update_values.append(body['work_experience'])
            if 'office_number' in body:
                update_fields.append('office_number = %s')
                update_values.append(body['office_number'])
            if 'password' in body:
                update_fields.append('password_hash = %s')
                update_values.append(body['password'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            update_values.append(doctor_id)
            query = f"UPDATE doctors SET {', '.join(update_fields)} WHERE id = %s RETURNING id, full_name, phone, position, specialization, login, photo_url, is_active, clinic, education, work_experience, office_number, created_at"
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, update_values)
            doctor = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            if not doctor:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Doctor not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'doctor': doctor}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            doctor_id = query_params.get('id')
            
            if not doctor_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Doctor ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor()
            cursor.execute("UPDATE doctors SET is_active = false WHERE id = %s", (doctor_id,))
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Doctor deactivated'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()