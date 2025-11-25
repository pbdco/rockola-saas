/**
 * Comprehensive logging utility for Rockola
 * All logs go to stdout for Docker logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context,
    };

    return JSON.stringify(logEntry);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formatted = this.formatMessage(level, message, context);
    console.log(formatted);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  // Specialized logging methods

  /**
   * Log n8n webhook calls (Rockola → n8n)
   */
  n8nWebhookCall(
    webhookName: string,
    url: string,
    requestBody: any,
    response?: any,
    error?: any
  ): void {
    const context: LogContext = {
      type: 'n8n_webhook_call',
      webhook: webhookName,
      url,
      requestBody: this.sanitize(requestBody),
    };

    if (response) {
      context.response = this.sanitize(response);
      context.status = response.status || 'success';
    }

    if (error) {
      context.error = {
        message: error.message,
        stack: error.stack,
        status: error.status,
      };
      this.error(`N8N Webhook Call: ${webhookName}`, context);
    } else {
      this.info(`N8N Webhook Call: ${webhookName}`, context);
    }
  }

  /**
   * Log n8n webhook receipts (n8n → Rockola)
   */
  n8nWebhookReceived(
    webhookName: string,
    requestBody: any,
    response?: any,
    error?: any
  ): void {
    const context: LogContext = {
      type: 'n8n_webhook_received',
      webhook: webhookName,
      requestBody: this.sanitize(requestBody),
    };

    if (response) {
      context.response = this.sanitize(response);
    }

    if (error) {
      context.error = {
        message: error.message,
        stack: error.stack,
      };
      this.error(`N8N Webhook Received: ${webhookName}`, context);
    } else {
      this.info(`N8N Webhook Received: ${webhookName}`, context);
    }
  }

  /**
   * Log database operations
   */
  dbOperation(
    operation: string,
    model: string,
    query?: any,
    result?: any,
    error?: any
  ): void {
    const context: LogContext = {
      type: 'db_operation',
      operation,
      model,
    };

    if (query) {
      context.query = this.sanitize(query);
    }

    if (result) {
      context.result = this.sanitize(result);
      context.recordCount = Array.isArray(result) ? result.length : 1;
    }

    if (error) {
      context.error = {
        message: error.message,
        code: error.code,
        meta: error.meta,
      };
      this.error(`DB Operation: ${operation} on ${model}`, context);
    } else {
      this.info(`DB Operation: ${operation} on ${model}`, context);
    }
  }

  /**
   * Log API requests
   */
  apiRequest(
    method: string,
    path: string,
    userId?: string,
    body?: any,
    response?: any,
    error?: any
  ): void {
    const context: LogContext = {
      type: 'api_request',
      method,
      path,
    };

    if (userId) {
      context.userId = userId;
    }

    if (body) {
      context.requestBody = this.sanitize(body);
    }

    if (response) {
      context.statusCode = response.statusCode || 200;
      context.responseTime = response.responseTime;
    }

    if (error) {
      context.error = {
        message: error.message,
        statusCode: error.statusCode,
      };
      this.error(`API Request: ${method} ${path}`, context);
    } else {
      this.info(`API Request: ${method} ${path}`, context);
    }
  }

  /**
   * Log credit transactions
   */
  creditTransaction(
    type: string,
    venueId: string,
    clientId: string,
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    transactionId?: string
  ): void {
    this.info('Credit Transaction', {
      type: 'credit_transaction',
      transactionType: type,
      venueId,
      clientId,
      amount,
      balanceBefore,
      balanceAfter,
      transactionId,
    });
  }

  /**
   * Log song request operations
   */
  songRequest(
    operation: string,
    requestId: string,
    venueId: string,
    status?: string,
    context?: LogContext
  ): void {
    this.info(`Song Request: ${operation}`, {
      type: 'song_request',
      operation,
      requestId,
      venueId,
      status,
      ...context,
    });
  }

  /**
   * Log venue operations
   */
  venueOperation(
    operation: string,
    venueId: string,
    mode?: string,
    context?: LogContext
  ): void {
    this.info(`Venue Operation: ${operation}`, {
      type: 'venue_operation',
      operation,
      venueId,
      mode,
      ...context,
    });
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveKeys = [
      'password',
      'passwordHash',
      'accessToken',
      'refreshToken',
      'clientSecret',
      'secret',
      'apiKey',
      'token',
    ];

    const sanitized = { ...data };

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (
        typeof sanitized[key] === 'object' &&
        sanitized[key] !== null &&
        !Array.isArray(sanitized[key])
      ) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
