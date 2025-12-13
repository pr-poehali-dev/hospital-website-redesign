import json
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Обработка записей на прием к врачу
    Методы: POST - создать запись, GET - получить все записи
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            doctor_id = body.get('doctor_id')
            patient_name = body.get('patient_name')
            patient_phone = body.get('patient_phone')
            patient_snils = body.get('patient_snils', '')
            appointment_date = body.get('appointment_date')
            appointment_time = body.get('appointment_time')
            description = body.get('description', '')
            
            if not all([doctor_id, patient_name, patient_phone, appointment_date, appointment_time]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields', 'success': False}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(
                """INSERT INTO t_p30358746_hospital_website_red.appointments_v2 
                   (doctor_id, patient_name, patient_phone, patient_snils, appointment_date, appointment_time, description, status) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, 'scheduled') 
                   RETURNING id, created_at""",
                (doctor_id, patient_name, patient_phone, patient_snils, appointment_date, appointment_time, description)
            )
            result = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'id': result['id'],
                    'message': 'Запись успешно создана'
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT * FROM t_p30358746_hospital_website_red.appointments_v2 ORDER BY appointment_date DESC, created_at DESC LIMIT 100")
            appointments = cursor.fetchall()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'appointments': appointments}, default=str),
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