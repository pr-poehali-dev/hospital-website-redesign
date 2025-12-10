import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление расписанием врачей
    GET /?doctor_id=X - получить расписание врача
    POST / - создать/обновить расписание
    PUT / - изменить статус активности или время
    DELETE /?id=X - удалить расписание
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Doctor-Token',
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
            doctor_id = query_params.get('doctor_id')
            
            if not doctor_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'doctor_id is required'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT * FROM doctor_schedules WHERE doctor_id = %s ORDER BY day_of_week", (doctor_id,))
            schedules = cursor.fetchall()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'schedules': schedules}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            doctor_id = body.get('doctor_id')
            day_of_week = body.get('day_of_week')
            start_time = body.get('start_time')
            end_time = body.get('end_time')
            break_start_time = body.get('break_start_time') or None
            break_end_time = body.get('break_end_time') or None
            
            if not all([doctor_id, day_of_week is not None, start_time, end_time]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields: doctor_id, day_of_week, start_time, end_time'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("SELECT id FROM doctor_schedules WHERE doctor_id = %s AND day_of_week = %s", (doctor_id, day_of_week))
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute(
                    "UPDATE doctor_schedules SET start_time = %s, end_time = %s, break_start_time = %s, break_end_time = %s, is_active = true WHERE doctor_id = %s AND day_of_week = %s RETURNING *",
                    (start_time, end_time, break_start_time, break_end_time, doctor_id, day_of_week)
                )
            else:
                cursor.execute(
                    "INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, break_start_time, break_end_time) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                    (doctor_id, day_of_week, start_time, end_time, break_start_time, break_end_time)
                )
            
            schedule = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'schedule': schedule}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            schedule_id = body.get('id')
            is_active = body.get('is_active')
            start_time = body.get('start_time')
            end_time = body.get('end_time')
            break_start_time = body.get('break_start_time') or None
            break_end_time = body.get('break_end_time') or None
            
            if not schedule_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Schedule ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if is_active is not None:
                cursor.execute("UPDATE doctor_schedules SET is_active = %s WHERE id = %s RETURNING *", (is_active, schedule_id))
            elif start_time and end_time:
                cursor.execute("UPDATE doctor_schedules SET start_time = %s, end_time = %s, break_start_time = %s, break_end_time = %s WHERE id = %s RETURNING *", (start_time, end_time, break_start_time, break_end_time, schedule_id))
            else:
                cursor.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Either is_active or both start_time and end_time are required'}),
                    'isBase64Encoded': False
                }
            
            schedule = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'schedule': schedule}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            schedule_id = query_params.get('id')
            
            if not schedule_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Schedule ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor()
            cursor.execute("DELETE FROM doctor_schedules WHERE id = %s", (schedule_id,))
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Schedule deleted'}),
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