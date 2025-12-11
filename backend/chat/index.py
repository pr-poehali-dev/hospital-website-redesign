import json
import os
import psycopg2
from typing import Dict, Any, List, Optional
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление чатами службы поддержки больницы
    
    GET ?action=get-chats - получить список всех активных чатов
    GET ?action=get-messages&chat_id=X - получить сообщения чата
    POST {action: "create-chat", patient_name, patient_phone} - создать новый чат
    POST {action: "send-message", chat_id, sender_type, sender_name, message} - отправить сообщение
    POST {action: "close-chat", chat_id} - закрыть чат
    '''
    
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', '')
            
            if action == 'get-chats':
                cursor.execute('''
                    SELECT c.id, c.patient_name, c.patient_phone, c.status, c.created_at, c.updated_at,
                           (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id) as message_count,
                           (SELECT message FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
                    FROM chats c
                    WHERE c.status = 'active'
                    ORDER BY c.updated_at DESC
                ''')
                
                chats = []
                for row in cursor.fetchall():
                    chats.append({
                        'id': row[0],
                        'patient_name': row[1],
                        'patient_phone': row[2],
                        'status': row[3],
                        'created_at': row[4].isoformat() if row[4] else None,
                        'updated_at': row[5].isoformat() if row[5] else None,
                        'message_count': row[6],
                        'last_message': row[7]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chats': chats}),
                    'isBase64Encoded': False
                }
            
            elif action == 'get-messages':
                chat_id = params.get('chat_id')
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('''
                    SELECT id, sender_type, sender_name, message, created_at
                    FROM chat_messages
                    WHERE chat_id = %s
                    ORDER BY created_at ASC
                ''', (chat_id,))
                
                messages = []
                for row in cursor.fetchall():
                    messages.append({
                        'id': row[0],
                        'sender_type': row[1],
                        'sender_name': row[2],
                        'message': row[3],
                        'created_at': row[4].isoformat() if row[4] else None
                    })
                
                cursor.execute('SELECT patient_name FROM chats WHERE id = %s', (chat_id,))
                chat_info = cursor.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'messages': messages,
                        'patient_name': chat_info[0] if chat_info else None
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', '')
            
            if action == 'create-chat':
                patient_name = body_data.get('patient_name', '').strip()
                patient_phone = body_data.get('patient_phone', '').strip()
                
                if not patient_name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'patient_name required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('''
                    INSERT INTO chats (patient_name, patient_phone, status)
                    VALUES (%s, %s, 'active')
                    RETURNING id
                ''', (patient_name, patient_phone))
                
                chat_id = cursor.fetchone()[0]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'chat_id': chat_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'send-message':
                chat_id = body_data.get('chat_id')
                sender_type = body_data.get('sender_type', '').strip()
                sender_name = body_data.get('sender_name', '').strip()
                message = body_data.get('message', '').strip()
                
                if not all([chat_id, sender_type, sender_name, message]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'All fields required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('''
                    INSERT INTO chat_messages (chat_id, sender_type, sender_name, message)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, created_at
                ''', (chat_id, sender_type, sender_name, message))
                
                result = cursor.fetchone()
                message_id = result[0]
                created_at = result[1]
                
                cursor.execute('''
                    UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = %s
                ''', (chat_id,))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message_id': message_id,
                        'created_at': created_at.isoformat() if created_at else None
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'close-chat':
                chat_id = body_data.get('chat_id')
                
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('''
                    UPDATE chats SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = %s
                ''', (chat_id,))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid action'}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()
