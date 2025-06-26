// src/lib/apiConfig.js - Updated with better error handling and CORS headers

const API_CONFIG = {
    // Base URL for the API - can be overridden by environment variables
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    
    // Backend service configuration
    BACKEND: {
        HOST: import.meta.env.VITE_BACKEND_HOST || 'localhost',
        PORT: import.meta.env.VITE_BACKEND_PORT || '8080',
        PROTOCOL: import.meta.env.VITE_BACKEND_PROTOCOL || 'http'
    },
    
    // Python server configuration
    PYTHON_BACKEND: {
        HOST: import.meta.env.VITE_PYTHON_HOST || 'localhost',
        PORT: import.meta.env.VITE_PYTHON_PORT || '5000',
        PROTOCOL: import.meta.env.VITE_PYTHON_PROTOCOL || 'http'
    },
    
    // Database configuration (for direct access if needed)
    DATABASE: {
        URL: import.meta.env.VITE_DB_URL || null,
        SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || null,
        SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || null,
    },
    
    // Timeout settings
    REQUEST_TIMEOUT: 30000, // 30 seconds for regular requests
    IMAGE_GENERATION_TIMEOUT: 60000, // 1 minute for image generation
    VIDEO_GENERATION_TIMEOUT: 300000, // 5 minutes for video generation (Stable Diffusion can be slow)
    
    // Endpoints
    ENDPOINTS: {
        // Media endpoints (Node.js backend)
        GENERATE_IMAGE: '/media/generateImage',
        GENERATE_VIDEO: '/media/generateVideo',
        GENERATE_VIDEO_WITH_PROGRESS: '/media/generateVideoWithProgress',
        FETCH_IMAGES: '/media/fetchAllImages',
        FETCH_VIDEOS: '/media/fetchAllVideos',
        FETCH_VIDEOS_BY_PARENT: '/media/fetchVideosByParent',
        FETCH_MEDIA_HIERARCHY: '/media/fetchMediaHierarchy',
        
        // Speech to Emoji endpoints (Node.js backend -> Python backend)
        CONVERT_TEXT_TO_EMOJI: '/smoji/translate',
        
        // Future endpoints (to be implemented)
        REQUESTS: '/requests',
        ITEMS: '/items',
        STATS: '/stats',
        USERS: '/users',
    },
    
    // Default headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    
    // SSE headers
    SSE_HEADERS: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
    },
    
    // Generation service types
    GENERATION_TYPES: {
        IMAGE: 'image',
        VIDEO: 'video'
    }
};

// Helper function to get full URL for Node.js backend
export const getApiUrl = (endpoint) => {
    const { PROTOCOL, HOST, PORT } = API_CONFIG.BACKEND;
    const baseUrl = `${PROTOCOL}://${HOST}:${PORT}/api`;
    return `${baseUrl}${endpoint}`;
};

// Helper function to get full URL for Python backend
export const getPythonApiUrl = (endpoint) => {
    const { PROTOCOL, HOST, PORT } = API_CONFIG.PYTHON_BACKEND;
    const baseUrl = `${PROTOCOL}://${HOST}:${PORT}`;
    return `${baseUrl}${endpoint}`;
};

// Helper function to get timeout based on operation type
export const getTimeoutForOperation = (operationType) => {
    switch (operationType) {
        case API_CONFIG.GENERATION_TYPES.IMAGE:
            return API_CONFIG.IMAGE_GENERATION_TIMEOUT;
        case API_CONFIG.GENERATION_TYPES.VIDEO:
            return API_CONFIG.VIDEO_GENERATION_TIMEOUT;
        default:
            return API_CONFIG.REQUEST_TIMEOUT;
    }
};

// Helper function to create request options with CORS handling
export const createRequestOptions = (method = 'GET', body = null, customHeaders = {}) => {
    const options = {
        method,
        headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
            ...customHeaders
        },
        // Add CORS mode for cross-origin requests
        mode: 'cors',
        credentials: 'omit'
    };
    
    if (body) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    return options;
};

// Helper function to create SSE request options
export const createSSERequestOptions = (method = 'POST', body = null) => {
    return {
        method,
        headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
            ...API_CONFIG.SSE_HEADERS,
        },
        mode: 'cors',
        credentials: 'omit',
        body: body ? JSON.stringify(body) : null
    };
};

// Enhanced error handling for API responses
export const handleApiResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails = null;
        
        try {
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
                errorDetails = errorData.details || null;
            } else {
                const textError = await response.text();
                errorMessage = textError || errorMessage;
            }
        } catch (parseError) {
            console.warn('Failed to parse error response:', parseError);
        }
        
        // Enhanced error handling for common HTTP status codes
        switch (response.status) {
            case 400:
                errorMessage = `Bad Request: ${errorMessage}`;
                break;
            case 401:
                errorMessage = `Unauthorized: ${errorMessage}`;
                break;
            case 403:
                errorMessage = `Forbidden: ${errorMessage}`;
                break;
            case 404:
                errorMessage = `Not Found: The requested endpoint was not found. ${errorMessage}`;
                break;
            case 500:
                errorMessage = `Server Error: ${errorMessage}`;
                break;
            case 502:
                errorMessage = `Bad Gateway: The server is temporarily unavailable. ${errorMessage}`;
                break;
            case 503:
                errorMessage = `Service Unavailable: ${errorMessage}`;
                break;
            default:
                break;
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.details = errorDetails;
        throw error;
    }
    
    // Handle successful responses
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    } else {
        return response.text();
    }
};

// Enhanced fetch with timeout and better error handling
export const fetchWithTimeout = async (url, options = {}, timeout = API_CONFIG.REQUEST_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        console.log(`🌐 Making request to: ${url}`);
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log(`✅ Response received: ${response.status} ${response.statusText}`);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout}ms`);
        }
        
        // Enhanced error messages for common network issues
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Unable to connect to server. Please check if the server is running and your internet connection.');
        }
        
        if (error.message.includes('CORS')) {
            throw new Error('CORS error: Cross-origin request blocked. Please check server CORS configuration.');
        }
        
        throw error;
    }
};

// Progress tracking for long-running requests with specific messages for your services
export const createProgressTracker = (onProgress, operationType = 'default') => {
    const getProgressMessages = (type, stage) => {
        const messages = {
            image: {
                start: '🎨 Initializing Gemini AI for image generation...',
                processing: '🤖 Gemini AI is creating your image...',
                uploading: '☁️ Uploading to Supabase storage...',
                complete: '✅ Image generated and saved successfully!'
            },
            video: {
                start: '🎬 Initializing Runway AI for video generation...',
                processing: '🎥 Generating video frames (this may take 2-5 minutes)...',
                uploading: '☁️ Processing and saving video...',
                complete: '✅ Video generated and saved successfully!'
            },
            default: {
                start: '⏳ Processing request...',
                processing: '🔄 Working on it...',
                uploading: '☁️ Saving data...',
                complete: '✅ Complete!'
            }
        };
        
        return messages[type] || messages.default;
    };

    return {
        updateProgress: (stage, percentage = null) => {
            if (onProgress) {
                const messages = getProgressMessages(operationType, stage);
                onProgress({
                    message: messages[stage] || messages.processing,
                    percentage,
                    timestamp: new Date().toISOString(),
                    stage,
                    operationType
                });
            }
        }
    };
};

// Health check functions
export const checkNodeBackendHealth = async () => {
    try {
        const response = await fetchWithTimeout(
            getApiUrl(''),
            { method: 'GET' },
            5000 // 5 second timeout for health check
        );
        return response.ok;
    } catch (error) {
        console.warn('Node.js backend health check failed:', error.message);
        return false;
    }
};

export const checkPythonBackendHealth = async () => {
    try {
        const response = await fetchWithTimeout(
            getPythonApiUrl('/health'),
            { method: 'GET' },
            5000 // 5 second timeout for health check
        );
        return response.ok;
    } catch (error) {
        console.warn('Python backend health check failed:', error.message);
        return false;
    }
};

export default API_CONFIG;