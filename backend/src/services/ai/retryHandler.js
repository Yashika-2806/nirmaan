const RETRY_DELAY_MS = 2500; // 2.5 seconds
const MAX_RETRIES = 3;

/**
 * Determines if an error is retryable based on specific conditions.
 */
function isRetryableError(error) {
    if (!error) return false;
    
    const message = (error.message || '').toLowerCase();
    const name = (error.name || '').toLowerCase();
    const status = error.status || error.code || 0;
    
    // Do NOT retry for invalid API key or 400 Bad Request
    if (
        message.includes('api key not valid') || 
        message.includes('invalid api key') || 
        status === 401 || 
        status === 403
    ) {
        return false;
    }
    
    if (
        status === 400 || 
        message.includes('400') || 
        message.includes('bad request')
    ) {
        return false;
    }
    
    // ONLY retry for 503 errors, network failures, timeout
    if (
        name === 'timeouterror' || 
        message.includes('timeout') || 
        message.includes('time out') || 
        message.includes('timed out')
    ) {
        return true;
    }
    
    if (
        status === 503 || 
        message.includes('503') || 
        message.includes('service unavailable')
    ) {
        return true;
    }
    
    if (
        message.includes('network') || 
        message.includes('fetch') || 
        message.includes('econnreset') || 
        message.includes('conn') || 
        message.includes('socket')
    ) {
        return true;
    }
    
    if (message.includes('overloaded')) {
        return true;
    }
    
    // As per requirement: "Only retry for: 503 errors, network failures, timeout"
    return false;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a function with retry logic.
 */
async function executeWithRetry(operation, context = 'AI Operation') {
    let attempt = 0;
    
    while (attempt <= MAX_RETRIES) {
        try {
            return await operation();
        } catch (error) {
            
            if (attempt >= MAX_RETRIES || !isRetryableError(error)) {
                throw error;
            }
            
            attempt++;
            console.log(`[AI] ${context} failed -> retrying...`);
            await sleep(RETRY_DELAY_MS);
        }
    }
}

module.exports = { executeWithRetry, isRetryableError };
