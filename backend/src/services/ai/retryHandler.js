const BASE_RETRY_DELAY_MS = 2000; // 2 seconds base
const MAX_RETRIES = 2; // allow 2 retries (3 total attempts)

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
    
    // Retry on 429 (Rate Limited) — wait longer
    if (status === 429 || message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
        return true;
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
 * Executes a function with retry logic and exponential backoff.
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
            // Use longer delay for rate limits (429), standard for others
            const msg = (error.message || '').toLowerCase();
            const isRateLimit = msg.includes('429') || msg.includes('rate limit') || msg.includes('quota');
            const delay = isRateLimit ? BASE_RETRY_DELAY_MS * attempt * 2 : BASE_RETRY_DELAY_MS * attempt;
            console.log(`[AI] ${context} failed -> retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})...`);
            await sleep(delay);
        }
    }
}

module.exports = { executeWithRetry, isRetryableError };
