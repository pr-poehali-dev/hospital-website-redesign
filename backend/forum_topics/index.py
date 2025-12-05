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
    Управление темами форума
    GET / - получить все темы
    GET /?id=X - получить конкретную тему
    POST / - создать новую тему (требуется авторизация)
    PUT / - обновить тему (автор или админ)
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
            topic_id = query_params.get('id')
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if topic_id:
                cursor.execute("""
                    UPDATE forum_topics SET views_count = views_count + 1 WHERE id = %s
                """, (topic_id,))
                conn.commit()
                
                cursor.execute("""
                    SELECT 
                        t.*,
                        u.username as author_username,
                        (SELECT COUNT(*) FROM forum_posts WHERE topic_id = t.id AND is_hidden = FALSE) as posts_count
                    FROM forum_topics t
                    LEFT JOIN forum_users u ON t.author_id = u.id
                    WHERE t.id = %s AND t.is_hidden = FALSE
                """, (topic_id,))
                topic = cursor.fetchone()
                cursor.close()
                
                if not topic:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Тема не найдена'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'topic': topic}, default=str),
                    'isBase64Encoded': False
                }
            else:
                cursor.execute("""
                    SELECT 
                        t.*,
                        u.username as author_username,
                        (SELECT COUNT(*) FROM forum_posts WHERE topic_id = t.id AND is_hidden = FALSE) as posts_count,
                        (SELECT MAX(created_at) FROM forum_posts WHERE topic_id = t.id) as last_post_at
                    FROM forum_topics t
                    LEFT JOIN forum_users u ON t.author_id = u.id
                    WHERE t.is_hidden = FALSE
                    ORDER BY t.is_pinned DESC, t.updated_at DESC
                """)
                topics = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'topics': topics}, default=str),
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
            title = body.get('title', '').strip()
            description = body.get('description', '').strip()
            
            if not title:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заголовок обязателен'}),
                    'isBase64Encoded': False
                }
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                INSERT INTO forum_topics (title, description, author_id, is_locked, is_pinned, is_hidden, views_count, created_at, updated_at)
                VALUES (%s, %s, %s, FALSE, FALSE, FALSE, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            """, (title, description, user['id']))
            topic = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'topic': topic}, default=str),
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
            topic_id = body.get('id')
            
            if not topic_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID темы обязателен'}),
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
            
            if topic['author_id'] != user['id']:
                cursor.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет прав на редактирование'}),
                    'isBase64Encoded': False
                }
            
            title = body.get('title', topic['title'])
            description = body.get('description', topic['description'])
            
            cursor.execute("""
                UPDATE forum_topics 
                SET title = %s, description = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (title, description, topic_id))
            updated_topic = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'topic': updated_topic}, default=str),
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
