import { useCallback, useRef } from 'react';

const RATE_LIMITER_URL = 'https://functions.poehali.dev/dd760420-6c65-41e9-bd95-171dec0f3ac9';

interface RateLimiterConfig {
  endpoint: string;
  maxRequestsPerMinute?: number;
  enabled?: boolean;
}

export const useRateLimiter = (config: RateLimiterConfig) => {
  const requestTimestamps = useRef<number[]>([]);
  const fingerprint = useRef<string>(generateFingerprint());
  
  const checkLocalRateLimit = useCallback(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    requestTimestamps.current = requestTimestamps.current.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    const maxRequests = config.maxRequestsPerMinute || 20;
    
    if (requestTimestamps.current.length >= maxRequests) {
      return false;
    }
    
    return true;
  }, [config.maxRequestsPerMinute]);
  
  const checkRateLimit = useCallback(async (): Promise<{ allowed: boolean; reason?: string }> => {
    if (config.enabled === false) {
      return { allowed: true };
    }
    
    if (!checkLocalRateLimit()) {
      return { 
        allowed: false, 
        reason: 'Слишком много запросов. Пожалуйста, подождите немного.' 
      };
    }
    
    try {
      const ipAddress = await getClientIP();
      
      const response = await fetch(RATE_LIMITER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          ip: ipAddress,
          endpoint: config.endpoint,
          fingerprint: fingerprint.current
        })
      });
      
      const data = await response.json();
      
      if (!data.allowed) {
        return { allowed: false, reason: data.reason };
      }
      
      requestTimestamps.current.push(Date.now());
      
      fetch(RATE_LIMITER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record',
          ip: ipAddress,
          endpoint: config.endpoint,
          fingerprint: fingerprint.current
        })
      }).catch(() => {});
      
      return { allowed: true };
    } catch (error) {
      console.error('Rate limiter error:', error);
      return { allowed: true };
    }
  }, [config.endpoint, config.enabled, checkLocalRateLimit]);
  
  return { checkRateLimit };
};

function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    canvas.toDataURL()
  ];
  
  return simpleHash(components.join('|||'));
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}