import json
import os
import psycopg2
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Centralized rate limiting and bot protection service
    
    POST {action: "check", ip, endpoint, fingerprint} - проверить лимиты
    POST {action: "record", ip, endpoint, fingerprint} - записать запрос
    GET ?action=get-stats - получить статистику (admin only)
    '''
    
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
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
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', '')
            
            if action == 'check':
                ip_address = body_data.get('ip', '')
                endpoint = body_data.get('endpoint', 'unknown')
                fingerprint = body_data.get('fingerprint', '')
                
                if not ip_address:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'IP address required'}),
                        'isBase64Encoded': False
                    }
                
                is_blocked, reason = check_rate_limit(cursor, ip_address, endpoint, fingerprint)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'allowed': not is_blocked,
                        'reason': reason if is_blocked else None
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'record':
                ip_address = body_data.get('ip', '')
                endpoint = body_data.get('endpoint', 'unknown')
                fingerprint = body_data.get('fingerprint', '')
                
                record_request(cursor, ip_address, endpoint, fingerprint)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', '')
            
            if action == 'get-stats':
                headers = event.get('headers', {})
                admin_token = headers.get('x-admin-token') or headers.get('X-Admin-Token')
                
                if admin_token != 'admin123':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Unauthorized'}),
                        'isBase64Encoded': False
                    }
                
                stats = get_statistics(cursor)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'stats': stats}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid action'}),
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
        cursor.close()
        conn.close()


def check_rate_limit(cursor, ip_address: str, endpoint: str, fingerprint: str) -> Tuple[bool, Optional[str]]:
    '''Проверка rate limit для IP/fingerprint'''
    
    now = datetime.now()
    
    cursor.execute('''
        SELECT COUNT(*), MAX(created_at) 
        FROM rate_limit_logs 
        WHERE ip_address = %s 
        AND created_at > %s
    ''', (ip_address, now - timedelta(minutes=1)))
    
    result = cursor.fetchone()
    requests_per_minute = result[0] if result else 0
    
    if requests_per_minute > 60:
        return True, 'Превышен лимит: более 60 запросов в минуту'
    
    cursor.execute('''
        SELECT COUNT(*) 
        FROM rate_limit_logs 
        WHERE ip_address = %s 
        AND created_at > %s
    ''', (ip_address, now - timedelta(hours=1)))
    
    result = cursor.fetchone()
    requests_per_hour = result[0] if result else 0
    
    if requests_per_hour > 1000:
        return True, 'Превышен лимит: более 1000 запросов в час'
    
    cursor.execute('''
        SELECT COUNT(*) 
        FROM rate_limit_logs 
        WHERE ip_address = %s 
        AND endpoint = %s 
        AND created_at > %s
    ''', (ip_address, endpoint, now - timedelta(minutes=1)))
    
    result = cursor.fetchone()
    endpoint_requests = result[0] if result else 0
    
    if endpoint_requests > 10:
        return True, f'Превышен лимит для {endpoint}: более 10 запросов в минуту'
    
    if fingerprint:
        cursor.execute('''
            SELECT COUNT(*) 
            FROM rate_limit_logs 
            WHERE fingerprint = %s 
            AND created_at > %s
        ''', (fingerprint, now - timedelta(minutes=1)))
        
        result = cursor.fetchone()
        fingerprint_requests = result[0] if result else 0
        
        if fingerprint_requests > 60:
            return True, 'Превышен лимит для устройства'
    
    return False, None


def record_request(cursor, ip_address: str, endpoint: str, fingerprint: str):
    '''Записать запрос в лог'''
    
    cursor.execute('''
        INSERT INTO rate_limit_logs (ip_address, endpoint, fingerprint, created_at)
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
    ''', (ip_address, endpoint, fingerprint or None))
    
    cursor.execute('''
        DELETE FROM rate_limit_logs 
        WHERE created_at < %s
    ''', (datetime.now() - timedelta(days=1),))


def get_statistics(cursor) -> Dict[str, Any]:
    '''Получить статистику запросов'''
    
    cursor.execute('''
        SELECT 
            endpoint,
            COUNT(*) as total_requests,
            COUNT(DISTINCT ip_address) as unique_ips,
            COUNT(DISTINCT fingerprint) as unique_devices
        FROM rate_limit_logs
        WHERE created_at > %s
        GROUP BY endpoint
        ORDER BY total_requests DESC
        LIMIT 20
    ''', (datetime.now() - timedelta(hours=24),))
    
    endpoint_stats = []
    for row in cursor.fetchall():
        endpoint_stats.append({
            'endpoint': row[0],
            'total_requests': row[1],
            'unique_ips': row[2],
            'unique_devices': row[3]
        })
    
    cursor.execute('''
        SELECT 
            ip_address,
            COUNT(*) as request_count,
            MIN(created_at) as first_seen,
            MAX(created_at) as last_seen
        FROM rate_limit_logs
        WHERE created_at > %s
        GROUP BY ip_address
        HAVING COUNT(*) > 500
        ORDER BY request_count DESC
        LIMIT 10
    ''', (datetime.now() - timedelta(hours=24),))
    
    suspicious_ips = []
    for row in cursor.fetchall():
        suspicious_ips.append({
            'ip_address': row[0],
            'request_count': row[1],
            'first_seen': row[2].isoformat() if row[2] else None,
            'last_seen': row[3].isoformat() if row[3] else None
        })
    
    return {
        'endpoint_stats': endpoint_stats,
        'suspicious_ips': suspicious_ips
    }
