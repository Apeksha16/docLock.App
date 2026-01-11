type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const loggerService = {
    log: (level: LogLevel, message: string, data?: any) => {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        if (data) {
            console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
        } else {
            console.log(`${prefix} ${message}`);
        }
    },

    info: (message: string, data?: any) => loggerService.log('info', message, data),
    warn: (message: string, data?: any) => loggerService.log('warn', message, data),
    error: (message: string, data?: any) => loggerService.log('error', message, data),
    debug: (message: string, data?: any) => loggerService.log('debug', message, data),

    // specific API helpers
    logRequest: (apiName: string, params?: any) => {
        loggerService.info(`[API REQUEST] ${apiName}`, params);
    },

    logResponse: (apiName: string, response: any) => {
        loggerService.info(`[API RESPONSE] ${apiName}`, response);
    },

    logApiError: (apiName: string, error: any) => {
        loggerService.error(`[API ERROR] ${apiName}`, error);
    }
};
