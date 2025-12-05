import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление FAQ: создание, чтение, обновление, удаление
    GET / - получить все активные FAQ
    GET /?all=true - получить все FAQ (включая неактивные, для админа)
    GET /?id=X - получить FAQ по ID
    POST / - создать FAQ
    PUT / - обновить FAQ
    DELETE /?id=X - удалить FAQ
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
            faq_id = query_params.get('id')
            show_all = query_params.get('all') == 'true'
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if faq_id:
                cursor.execute("SELECT * FROM faq WHERE id = %s", (faq_id,))
                faq_item = cursor.fetchone()
                cursor.close()
                
                if not faq_item:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'FAQ not found'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'faq': faq_item}, default=str),
                    'isBase64Encoded': False
                }
            else:
                if show_all:
                    cursor.execute("SELECT * FROM faq ORDER BY display_order, created_at DESC")
                else:
                    cursor.execute("SELECT * FROM faq WHERE is_active = true ORDER BY display_order, created_at DESC")
                
                faqs = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'faqs': faqs}, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            question = body.get('question')
            answer = body.get('answer')
            image_url = body.get('image_url')
            display_order = body.get('display_order', 0)
            
            if not all([question, answer]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields: question, answer'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(
                "INSERT INTO faq (question, answer, image_url, display_order) VALUES (%s, %s, %s, %s) RETURNING *",
                (question, answer, image_url, display_order)
            )
            faq_item = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'faq': faq_item}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            faq_id = body.get('id')
            
            if not faq_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'FAQ ID is required'}),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            update_values = []
            
            if 'question' in body:
                update_fields.append('question = %s')
                update_values.append(body['question'])
            if 'answer' in body:
                update_fields.append('answer = %s')
                update_values.append(body['answer'])
            if 'image_url' in body:
                update_fields.append('image_url = %s')
                update_values.append(body['image_url'])
            if 'display_order' in body:
                update_fields.append('display_order = %s')
                update_values.append(body['display_order'])
            if 'is_active' in body:
                update_fields.append('is_active = %s')
                update_values.append(body['is_active'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            update_values.append(faq_id)
            query = f"UPDATE faq SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, update_values)
            faq_item = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            if not faq_item:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'FAQ not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'faq': faq_item}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            faq_id = query_params.get('id')
            
            if not faq_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'FAQ ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor()
            cursor.execute("DELETE FROM faq WHERE id = %s", (faq_id,))
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'FAQ deleted'}),
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
