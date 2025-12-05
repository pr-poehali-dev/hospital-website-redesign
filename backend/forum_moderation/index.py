import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def check_admin(token: str) -> bool:
    """Проверка админского токена из админ-панели"""
    stored_token = os.environ.get('ADMIN_TOKEN', 'admin123')
    return token == stored_token

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Админ-модерация форума
    
    Пользователи:
    GET /users - список всех пользователей
    PUT /users/block - заблокировать пользователя
    PUT /users/unblock - разблокировать пользователя
    
    Темы:
    GET /topics - все темы (включая скрытые)
    PUT /topics/hide - скрыть тему
    PUT /topics/show - показать тему
    PUT /topics/pin - закрепить тему
    PUT /topics/unpin - открепить тему
    PUT /topics/lock - заблокировать тему
    PUT /topics/unlock - разблокировать тему
    
    Сообщения:
    PUT /posts/hide - скрыть сообщение
    PUT /posts/show - показать сообщение
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers') or {}
    admin_token = headers.get('x-admin-token') or headers.get('X-Admin-Token')
    
    if not admin_token or not check_admin(admin_token):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуются права администратора'}),
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
    path = event.get('path', '/')
    
    try:
        if method == 'GET':
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if '/users' in path:
                cursor.execute("""
                    SELECT 
                        id, email, username, is_verified, is_blocked, blocked_reason, 
                        blocked_at, created_at, last_login,
                        (SELECT COUNT(*) FROM forum_topics WHERE author_id = forum_users.id) as topics_count,
                        (SELECT COUNT(*) FROM forum_posts WHERE author_id = forum_users.id) as posts_count
                    FROM forum_users
                    ORDER BY created_at DESC
                """)
                users = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': users}, default=str),
                    'isBase64Encoded': False
                }
            
            elif '/topics' in path:
                cursor.execute("""
                    SELECT 
                        t.*,
                        u.username as author_username,
                        (SELECT COUNT(*) FROM forum_posts WHERE topic_id = t.id) as posts_count
                    FROM forum_topics t
                    LEFT JOIN forum_users u ON t.author_id = u.id
                    ORDER BY t.created_at DESC
                """)
                topics = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'topics': topics}, default=str),
                    'isBase64Encoded': False
                }
            
            elif '/posts' in path:
                query_params = event.get('queryStringParameters') or {}
                topic_id = query_params.get('topic_id')
                
                if topic_id:
                    cursor.execute("""
                        SELECT 
                            p.*,
                            u.username as author_username
                        FROM forum_posts p
                        LEFT JOIN forum_users u ON p.author_id = u.id
                        WHERE p.topic_id = %s
                        ORDER BY p.created_at ASC
                    """, (topic_id,))
                else:
                    cursor.execute("""
                        SELECT 
                            p.*,
                            u.username as author_username,
                            t.title as topic_title
                        FROM forum_posts p
                        LEFT JOIN forum_users u ON p.author_id = u.id
                        LEFT JOIN forum_topics t ON p.topic_id = t.id
                        ORDER BY p.created_at DESC
                        LIMIT 100
                    """)
                
                posts = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'posts': posts}, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if '/users/block' in path:
                user_id = body.get('user_id')
                reason = body.get('reason', 'Нарушение правил форума')
                
                cursor.execute("""
                    UPDATE forum_users 
                    SET is_blocked = TRUE, blocked_reason = %s, blocked_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, username
                """, (reason, user_id))
                result = cursor.fetchone()
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': f'Пользователь {result["username"]} заблокирован'}),
                    'isBase64Encoded': False
                }
            
            elif '/users/unblock' in path:
                user_id = body.get('user_id')
                
                cursor.execute("""
                    UPDATE forum_users 
                    SET is_blocked = FALSE, blocked_reason = NULL, blocked_at = NULL
                    WHERE id = %s
                    RETURNING id, username
                """, (user_id,))
                result = cursor.fetchone()
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': f'Пользователь {result["username"]} разблокирован'}),
                    'isBase64Encoded': False
                }
            
            elif '/topics/hide' in path:
                topic_id = body.get('topic_id')
                cursor.execute("UPDATE forum_topics SET is_hidden = TRUE WHERE id = %s", (topic_id,))
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Тема скрыта'}),
                    'isBase64Encoded': False
                }
            
            elif '/topics/show' in path:
                topic_id = body.get('topic_id')
                cursor.execute("UPDATE forum_topics SET is_hidden = FALSE WHERE id = %s", (topic_id,))
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Тема показана'}),
                    'isBase64Encoded': False
                }
            
            elif '/topics/pin' in path:
                topic_id = body.get('topic_id')
                cursor.execute("UPDATE forum_topics SET is_pinned = TRUE WHERE id = %s", (topic_id,))
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Тема закреплена'}),
                    'isBase64Encoded': False
                }
            
            elif '/topics/unpin' in path:
                topic_id = body.get('topic_id')
                cursor.execute("UPDATE forum_topics SET is_pinned = FALSE WHERE id = %s", (topic_id,))
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Тема откреплена'}),
                    'isBase64Encoded': False
                }
            
            elif '/topics/lock' in path:
                topic_id = body.get('topic_id')
                cursor.execute("UPDATE forum_topics SET is_locked = TRUE WHERE id = %s", (topic_id,))
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Тема заблокирована'}),
                    'isBase64Encoded': False
                }
            
            elif '/topics/unlock' in path:
                topic_id = body.get('topic_id')
                cursor.execute("UPDATE forum_topics SET is_locked = FALSE WHERE id = %s", (topic_id,))
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Тема разблокирована'}),
                    'isBase64Encoded': False
                }
            
            elif '/posts/hide' in path:
                post_id = body.get('post_id')
                reason = body.get('reason', 'Нарушение правил')
                
                cursor.execute("""
                    UPDATE forum_posts 
                    SET is_hidden = TRUE, hidden_reason = %s
                    WHERE id = %s
                """, (reason, post_id))
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Сообщение скрыто'}),
                    'isBase64Encoded': False
                }
            
            elif '/posts/show' in path:
                post_id = body.get('post_id')
                
                cursor.execute("""
                    UPDATE forum_posts 
                    SET is_hidden = FALSE, hidden_reason = NULL
                    WHERE id = %s
                """, (post_id,))
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Сообщение показано'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Endpoint not found'}),
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
