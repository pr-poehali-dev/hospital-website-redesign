import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def get_user_from_token(conn, token: str):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT id, username, is_blocked FROM forum_users WHERE verification_code = %s AND is_verified = TRUE",
        (token,)
    )
    user = cursor.fetchone()
    cursor.close()
    
    if not user or user['is_blocked']:
        return None
    return user

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление сообщениями форума
    GET /?topic_id=X - получить сообщения темы
    POST / - создать сообщение (требуется авторизация)
    PUT / - обновить сообщение (автор)
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            topic_id = query_params.get('topic_id')
            
            if not topic_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'topic_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT 
                    p.*,
                    u.username as author_username
                FROM forum_posts p
                LEFT JOIN forum_users u ON p.author_id = u.id
                WHERE p.topic_id = %s AND p.is_hidden = FALSE
                ORDER BY p.created_at ASC
            """, (topic_id,))
            posts = cursor.fetchall()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'posts': posts}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            headers = event.get('headers') or {}
            token = headers.get('x-user-token') or headers.get('X-User-Token')
            
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            user = get_user_from_token(conn, token)
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недействительный токен'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            topic_id = body.get('topic_id')
            content = body.get('content', '').strip()
            
            if not all([topic_id, content]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'topic_id и содержание обязательны'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("SELECT * FROM forum_topics WHERE id = %s", (topic_id,))
            topic = cursor.fetchone()
            
            if not topic:
                cursor.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Тема не найдена'}),
                    'isBase64Encoded': False
                }
            
            if topic['is_locked']:
                cursor.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Тема заблокирована'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                INSERT INTO forum_posts (topic_id, author_id, content, is_hidden, created_at, updated_at)
                VALUES (%s, %s, %s, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            """, (topic_id, user['id'], content))
            post = cursor.fetchone()
            
            cursor.execute("""
                UPDATE forum_topics SET updated_at = CURRENT_TIMESTAMP WHERE id = %s
            """, (topic_id,))
            
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'post': post}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            headers = event.get('headers') or {}
            token = headers.get('x-user-token') or headers.get('X-User-Token')
            
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            user = get_user_from_token(conn, token)
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недействительный токен'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            post_id = body.get('id')
            content = body.get('content', '').strip()
            
            if not all([post_id, content]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID и содержание обязательны'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT * FROM forum_posts WHERE id = %s", (post_id,))
            post = cursor.fetchone()
            
            if not post:
                cursor.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сообщение не найдено'}),
                    'isBase64Encoded': False
                }
            
            if post['author_id'] != user['id']:
                cursor.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет прав на редактирование'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                UPDATE forum_posts 
                SET content = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (content, post_id))
            updated_post = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'post': updated_post}, default=str),
                'isBase64Encoded': False
            }
        
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
