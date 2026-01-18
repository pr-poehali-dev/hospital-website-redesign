import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta, time

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление записями пациентов и логирование действий врачей
    GET /?doctor_id=X&date=YYYY-MM-DD - получить записи врача на дату
    GET /?doctor_id=X&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD - получить записи за период
    GET /?action=logs&doctor_id=X&limit=500 - получить журнал действий врача
    GET /available-slots?doctor_id=X&date=YYYY-MM-DD - получить свободные слоты
    POST / - создать запись
    POST {action: "log", doctor_id, action_type, details} - записать действие в журнал
    PUT / - обновить статус записи
    DELETE /?id=X - удалить запись
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            path = event.get('path', '/')
            
            # Check for available-slots endpoint via query param or path
            if '/available-slots' in path or query_params.get('action') == 'available-slots':
                doctor_id = query_params.get('doctor_id')
                date_str = query_params.get('date')
                
                if not doctor_id or not date_str:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'doctor_id and date are required'}),
                        'isBase64Encoded': False
                    }
                
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                day_of_week = date_obj.weekday()
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                # ПРИОРИТЕТ 1: Проверяем календарь врача (имеет приоритет над расписанием)
                cursor.execute(
                    "SELECT is_working FROM doctor_calendar WHERE doctor_id = %s AND calendar_date = %s",
                    (doctor_id, date_str)
                )
                calendar_record = cursor.fetchone()
                
                # Если в календаре отмечен выходной - возвращаем пустой список слотов
                if calendar_record and not calendar_record['is_working']:
                    cursor.close()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'available_slots': [], 'message': 'Doctor does not work on this day (calendar override)'}),
                        'isBase64Encoded': False
                    }
                
                # ПРИОРИТЕТ 2: Проверяем еженедельное расписание
                cursor.execute(
                    "SELECT start_time, end_time, break_start_time, break_end_time, slot_duration FROM doctor_schedules WHERE doctor_id = %s AND day_of_week = %s AND is_active = true",
                    (doctor_id, day_of_week)
                )
                schedule = cursor.fetchone()
                
                if not schedule:
                    cursor.close()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'available_slots': [], 'message': 'Doctor does not work on this day'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT appointment_time FROM appointments_v2 WHERE doctor_id = %s AND appointment_date = %s AND status != 'cancelled'",
                    (doctor_id, date_str)
                )
                booked_times = [row['appointment_time'] for row in cursor.fetchall()]
                cursor.close()
                
                start_time = schedule['start_time']
                end_time = schedule['end_time']
                break_start = schedule.get('break_start_time')
                break_end = schedule.get('break_end_time')
                slot_duration = schedule.get('slot_duration', 15)
                
                current_time = datetime.combine(date_obj, start_time)
                end_datetime = datetime.combine(date_obj, end_time)
                
                available_slots = []
                all_slots = []
                while current_time < end_datetime:
                    slot_time = current_time.time()
                    time_str = slot_time.strftime('%H:%M')
                    
                    is_break = False
                    if break_start and break_end:
                        if break_start <= slot_time < break_end:
                            is_break = True
                    
                    is_booked = slot_time in booked_times
                    is_available = not is_booked and not is_break
                    
                    status = 'break' if is_break else ('booked' if is_booked else 'available')
                    
                    all_slots.append({
                        'time': time_str,
                        'available': is_available,
                        'status': status
                    })
                    
                    if is_available:
                        available_slots.append(time_str)
                    
                    current_time += timedelta(minutes=slot_duration)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'available_slots': available_slots,
                        'all_slots': all_slots,
                        'start_time': start_time.strftime('%H:%M'),
                        'end_time': end_time.strftime('%H:%M')
                    }),
                    'isBase64Encoded': False
                }
            
            # Журнал действий врачей
            elif query_params.get('action') == 'logs':
                doctor_id = query_params.get('doctor_id')
                limit = query_params.get('limit', '100')
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                if doctor_id:
                    cursor.execute(
                        """SELECT l.*, d.full_name as doctor_name 
                           FROM doctor_logs l 
                           JOIN doctors d ON l.doctor_id = d.id 
                           WHERE l.doctor_id = %s 
                           ORDER BY l.created_at DESC 
                           LIMIT %s""",
                        (doctor_id, limit)
                    )
                else:
                    cursor.execute(
                        """SELECT l.*, d.full_name as doctor_name 
                           FROM doctor_logs l 
                           JOIN doctors d ON l.doctor_id = d.id 
                           ORDER BY l.created_at DESC 
                           LIMIT %s""",
                        (limit,)
                    )
                
                logs = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'logs': logs}, default=str),
                    'isBase64Encoded': False
                }
            
            else:
                doctor_id = query_params.get('doctor_id')
                date_str = query_params.get('date')
                start_date = query_params.get('start_date')
                end_date = query_params.get('end_date')
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                if doctor_id and date_str:
                    cursor.execute(
                        "SELECT a.*, d.full_name as doctor_name FROM appointments_v2 a JOIN doctors d ON a.doctor_id = d.id WHERE a.doctor_id = %s AND a.appointment_date = %s ORDER BY a.appointment_time",
                        (doctor_id, date_str)
                    )
                elif doctor_id and start_date and end_date:
                    cursor.execute(
                        "SELECT a.*, d.full_name as doctor_name FROM appointments_v2 a JOIN doctors d ON a.doctor_id = d.id WHERE a.doctor_id = %s AND a.appointment_date BETWEEN %s AND %s ORDER BY a.appointment_date, a.appointment_time",
                        (doctor_id, start_date, end_date)
                    )
                elif doctor_id:
                    cursor.execute(
                        "SELECT a.*, d.full_name as doctor_name FROM appointments_v2 a JOIN doctors d ON a.doctor_id = d.id WHERE a.doctor_id = %s ORDER BY a.appointment_date DESC, a.appointment_time",
                        (doctor_id,)
                    )
                else:
                    cursor.execute(
                        "SELECT a.*, d.full_name as doctor_name FROM appointments_v2 a JOIN doctors d ON a.doctor_id = d.id ORDER BY a.appointment_date DESC, a.appointment_time LIMIT 100"
                    )
                
                appointments = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'appointments': appointments}, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            # Логирование действий врача
            if action == 'log':
                doctor_id = body.get('doctor_id')
                user_login = body.get('user_login')
                action_type = body.get('action_type')
                details = body.get('details')
                ip_address = body.get('ip_address')
                computer_name = body.get('computer_name')
                
                if not all([doctor_id, action_type]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'doctor_id and action_type are required'}),
                        'isBase64Encoded': False
                    }
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute(
                    """INSERT INTO doctor_logs (doctor_id, user_login, action_type, details, ip_address, computer_name)
                       VALUES (%s, %s, %s, %s, %s, %s)
                       RETURNING *""",
                    (doctor_id, user_login, action_type, details, ip_address, computer_name)
                )
                log = cursor.fetchone()
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'log': log}, default=str),
                    'isBase64Encoded': False
                }
            
            # Создание записи
            doctor_id = body.get('doctor_id')
            patient_name = body.get('patient_name')
            patient_phone = body.get('patient_phone')
            appointment_date = body.get('appointment_date')
            appointment_time = body.get('appointment_time')
            description = body.get('description', '')
            
            if not all([doctor_id, patient_name, patient_phone, appointment_date, appointment_time]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute(
                "SELECT id FROM appointments_v2 WHERE doctor_id = %s AND appointment_date = %s AND appointment_time = %s AND status != 'cancelled'",
                (doctor_id, appointment_date, appointment_time)
            )
            existing = cursor.fetchone()
            
            if existing:
                cursor.close()
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'This time slot is already booked'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "INSERT INTO appointments_v2 (doctor_id, patient_name, patient_phone, appointment_date, appointment_time, description) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                (doctor_id, patient_name, patient_phone, appointment_date, appointment_time, description)
            )
            appointment = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'appointment': appointment}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            appointment_id = body.get('id')
            status = body.get('status')
            description = body.get('description')
            completed_at = body.get('completed_at')
            appointment_date = body.get('appointment_date')
            appointment_time = body.get('appointment_time')
            
            if not appointment_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Appointment ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Перенос записи на новую дату/время
            if appointment_date is not None and appointment_time is not None:
                # Проверяем, не занят ли новый слот
                cursor.execute(
                    "SELECT doctor_id FROM appointments_v2 WHERE id = %s",
                    (appointment_id,)
                )
                current_appointment = cursor.fetchone()
                
                if not current_appointment:
                    cursor.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Appointment not found'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT id FROM appointments_v2 WHERE doctor_id = %s AND appointment_date = %s AND appointment_time = %s AND status != 'cancelled' AND id != %s",
                    (current_appointment['doctor_id'], appointment_date, appointment_time, appointment_id)
                )
                slot_taken = cursor.fetchone()
                
                if slot_taken:
                    cursor.close()
                    return {
                        'statusCode': 409,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'This time slot is already booked'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "UPDATE appointments_v2 SET appointment_date = %s, appointment_time = %s WHERE id = %s RETURNING *",
                    (appointment_date, appointment_time, appointment_id)
                )
            
            # Изменение статуса и описания
            elif status is not None:
                if completed_at is not None and description is not None:
                    cursor.execute(
                        "UPDATE appointments_v2 SET status = %s, description = %s, completed_at = %s WHERE id = %s RETURNING *",
                        (status, description, completed_at, appointment_id)
                    )
                elif completed_at is not None:
                    cursor.execute(
                        "UPDATE appointments_v2 SET status = %s, completed_at = %s WHERE id = %s RETURNING *",
                        (status, completed_at, appointment_id)
                    )
                elif description is not None:
                    cursor.execute(
                        "UPDATE appointments_v2 SET status = %s, description = %s WHERE id = %s RETURNING *",
                        (status, description, appointment_id)
                    )
                else:
                    cursor.execute(
                        "UPDATE appointments_v2 SET status = %s WHERE id = %s RETURNING *",
                        (status, appointment_id)
                    )
            else:
                cursor.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            appointment = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            if not appointment:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Appointment not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'appointment': appointment}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            appointment_id = query_params.get('id')
            
            if not appointment_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Appointment ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor()
            cursor.execute("UPDATE appointments_v2 SET status = 'cancelled' WHERE id = %s", (appointment_id,))
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Appointment cancelled'}),
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