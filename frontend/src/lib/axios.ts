import axios from 'axios';

// Use relative paths that leverage nginx reverse proxy
// nginx reverse proxy at /api/ forwards to backend on port 8000
// This avoids CORS issues and firewall restrictions
const apiBaseUrl = '/api';

const api = axios.create({
    baseURL: apiBaseUrl,
    timeout: 30000,   // 30s default — AI short ops (DSA feedback, ATS analysis)
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh and error parsing
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Ensure error response has proper data structure - parse if needed
        if (error.response) {
            let responseData = error.response.data;
            
            // If data is a string, try to parse it as JSON
            if (typeof responseData === 'string') {
                try {
                    responseData = JSON.parse(responseData);
                } catch (parseErr) {
                    responseData = {
                        success: false,
                        message: `Server error: ${error.response.statusText || 'Unknown error'}`,
                        data: responseData,
                    };
                }
            }
            
            // If parsed data is not an object, wrap it
            if (!responseData || typeof responseData !== 'object') {
                responseData = {
                    success: false,
                    message: `Server error: ${error.response.statusText || 'Unknown error'}`,
                };
            }
            
            // Ensure it has required fields
            if (!responseData.success) {
                responseData.success = false;
            }
            if (!responseData.message) {
                responseData.message = error.response.statusText || 'An error occurred';
            }
            
            error.response.data = responseData;
        } else if (!error.response) {
            // Network error or timeout
            error.response = {
                status: error.code === 'ECONNABORTED' ? 504 : 503,
                statusText: 'Network Error',
                data: {
                    success: false,
                    message: error.message || 'Network error. Please check your connection.',
                },
            };
        }

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Refresh token
                const response = await axios.post(
                    `${apiBaseUrl}/auth/refresh`,
                    { refreshToken }
                );

                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                // Update tokens
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
