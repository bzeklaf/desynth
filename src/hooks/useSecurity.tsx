import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

// Rate limiting hook
export const useRateLimit = (maxRequests = 10, windowMs = 60000) => {
  const requestsRef = useRef<number[]>([]);

  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove requests outside the current window
    requestsRef.current = requestsRef.current.filter(time => time > windowStart);
    
    // Check if we're over the limit
    return requestsRef.current.length >= maxRequests;
  }, [maxRequests, windowMs]);

  const recordRequest = useCallback(() => {
    if (!isRateLimited()) {
      requestsRef.current.push(Date.now());
      return true;
    }
    return false;
  }, [isRateLimited]);

  return { isRateLimited, recordRequest };
};

// Input sanitization utilities
export const sanitizeInput = {
  // Remove potentially dangerous characters
  basic: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  },
  
  // Sanitize for SQL-like operations (though we use Supabase client)
  sql: (input: string): string => {
    return input
      .replace(/[';-]/g, '')
      .replace(/\b(DROP|DELETE|UPDATE|INSERT|SELECT)\b/gi, '')
      .trim();
  },
  
  // Sanitize numeric input
  number: (input: string): number | null => {
    const num = parseFloat(input.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? null : num;
  },
  
  // Sanitize email
  email: (input: string): string => {
    return input.toLowerCase().trim().replace(/[^\w@.\-]/g, '');
  }
};

// Security validation
export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length < 255;
  },
  
  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  amount: (amount: string | number): { isValid: boolean; error?: string } => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(num)) {
      return { isValid: false, error: 'Invalid number format' };
    }
    
    if (num < 0) {
      return { isValid: false, error: 'Amount cannot be negative' };
    }
    
    if (num > 1000000) {
      return { isValid: false, error: 'Amount exceeds maximum limit' };
    }
    
    return { isValid: true };
  }
};

// Security monitoring hook
export const useSecurityMonitoring = () => {
  const { user } = useAuth();
  const suspiciousActivityRef = useRef<Array<{ type: string; timestamp: number }>>([]);

  const logSecurityEvent = useCallback(async (
    eventType: 'failed_login' | 'suspicious_request' | 'rate_limit_exceeded' | 'invalid_input',
    details?: Record<string, any>
  ) => {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      userId: user?.id,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...details
    };

    // Log locally for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security event:', event);
    }

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      try {
        await supabase.functions.invoke('security-logger', {
          body: {
            eventType,
            details: event,
            userId: user?.id,
            severity: eventType === 'failed_login' ? 'medium' : 'low',
          }
        });
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    }

    // Track suspicious activity locally
    suspiciousActivityRef.current.push({ type: eventType, timestamp: Date.now() });
    
    // Clean old events (keep last hour)
    const oneHourAgo = Date.now() - 3600000;
    suspiciousActivityRef.current = suspiciousActivityRef.current.filter(
      event => event.timestamp > oneHourAgo
    );

    // Check for patterns that might indicate an attack
    if (suspiciousActivityRef.current.length > 10) {
      console.warn('High suspicious activity detected');
      // Could implement automatic lockout here
    }
  }, [user]);

  // Detect potential XSS attempts
  const detectXSS = useCallback((input: string): boolean => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /eval\(/gi,
      /document\.cookie/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }, []);

  // Content Security Policy violation detector
  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      logSecurityEvent('suspicious_request', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI
      });
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, [logSecurityEvent]);

  return {
    logSecurityEvent,
    detectXSS,
    suspiciousActivityCount: suspiciousActivityRef.current.length
  };
};

// Secure local storage wrapper
export const secureStorage = {
  set: (key: string, value: any): boolean => {
    try {
      // Don't store sensitive data in localStorage in production
      if (process.env.NODE_ENV === 'production' && 
          (key.includes('password') || key.includes('token') || key.includes('secret'))) {
        console.warn('Attempting to store sensitive data in localStorage');
        return false;
      }
      
      const encrypted = btoa(JSON.stringify(value)); // Basic encoding (not encryption)
      localStorage.setItem(`desynth_${key}`, encrypted);
      return true;
    } catch {
      return false;
    }
  },
  
  get: function<T>(key: string, defaultValue?: T): T | null {
    try {
      const stored = localStorage.getItem(`desynth_${key}`);
      if (!stored) return defaultValue || null;
      
      return JSON.parse(atob(stored));
    } catch {
      return defaultValue || null;
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(`desynth_${key}`);
  },
  
  clear: (): void => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('desynth_'))
      .forEach(key => localStorage.removeItem(key));
  }
};
