/**
 * Centralized API Client for Email Productivity Agent Backend
 * Provides typed functions for all backend endpoints with consistent error handling
 */
import axios from 'axios';

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================
api.interceptors.request.use(
  (config) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${config.method?.toUpperCase()} ${config.url}`);
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  },
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================
api.interceptors.response.use(
  (response) => {
    const duration = response.config.metadata
      ? Date.now() - response.config.metadata.startTime
      : 0;
    console.log(`Response time: ${duration}ms`);
    return response;
  },
  (error) => {
    const duration = error.config?.metadata
      ? Date.now() - error.config.metadata.startTime
      : 0;

    // Handle different error types
    let errorMessage = 'An unexpected error occurred';

    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      if (status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (status === 404) {
        errorMessage = 'Resource not found.';
      } else if (status === 401) {
        errorMessage = 'Unauthorized. Please check your credentials.';
      } else if (status === 403) {
        errorMessage = 'Forbidden. You do not have permission.';
      } else {
        errorMessage =
          error.response.data?.error || error.response.data?.message || `Error ${status}`;
      }
    }

    console.error(`API Error [${duration}ms]:`, {
      message: errorMessage,
      status: error.response?.status,
      url: error.config?.url,
    });

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  },
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Wraps API calls with consistent error handling
 * @param {Promise} apiCall - The axios promise
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
const handleApiCall = async (apiCall) => {
  try {
    const response = await apiCall;
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: error.data,
    };
  }
};

// ============================================================================
// EMAIL APIs
// ============================================================================

/**
 * Load mock emails from JSON file into database
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const loadMockEmails = async () => {
  return handleApiCall(api.post('/api/emails/load'));
};

/**
 * Get all emails with optional filters
 * @param {{category?: string, processed?: boolean, search?: string}} filters
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getAllEmails = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.processed !== undefined) params.append('processed', filters.processed.toString());
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = queryString ? `/api/emails?${queryString}` : '/api/emails';
  return handleApiCall(api.get(url));
};

/**
 * Get single email by ID with related data
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const getEmailById = async (id) => {
  return handleApiCall(api.get(`/api/emails/${id}`));
};

/**
 * Process all unprocessed emails
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const processAllEmails = async () => {
  return handleApiCall(api.post('/api/emails/process'));
};

/**
 * Process single email by ID
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const processEmail = async (id) => {
  return handleApiCall(api.post(`/api/emails/${id}/process`));
};

/**
 * Get emails by category
 * @param {string} category
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getEmailsByCategory = async (category) => {
  return handleApiCall(api.get(`/api/emails/category/${category}`));
};

/**
 * Get email statistics
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const getEmailStats = async () => {
  return handleApiCall(api.get('/api/emails/stats'));
};

/**
 * Delete email by ID
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const deleteEmail = async (id) => {
  return handleApiCall(api.delete(`/api/emails/${id}`));
};

/**
 * Reprocess email with current prompts
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const reprocessEmail = async (id) => {
  return handleApiCall(api.post(`/api/emails/${id}/reprocess`));
};

// ============================================================================
// PROMPT APIs
// ============================================================================

/**
 * Get all prompts
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getAllPrompts = async () => {
  return handleApiCall(api.get('/api/prompts'));
};

/**
 * Get prompt by name
 * @param {string} name - Prompt name (categorization, action_item, auto_reply, summarization)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const getPromptByName = async (name) => {
  return handleApiCall(api.get(`/api/prompts/${name}`));
};

/**
 * Create new prompt
 * @param {{name: string, prompt_text: string, description?: string}} data
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const createPrompt = async (data) => {
  return handleApiCall(api.post('/api/prompts', data));
};

/**
 * Update prompt by ID
 * @param {number|string} id
 * @param {{prompt_text?: string, description?: string}} data
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const updatePrompt = async (id, data) => {
  return handleApiCall(api.put(`/api/prompts/${id}`, data));
};

/**
 * Delete prompt by ID
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const deletePrompt = async (id) => {
  return handleApiCall(api.delete(`/api/prompts/${id}`));
};

/**
 * Reset all prompts to defaults
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const resetPrompts = async () => {
  return handleApiCall(api.post('/api/prompts/reset'));
};

/**
 * Test a prompt against sample email
 * @param {{prompt_text: string, email_id: number, prompt_type: string}} data
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const testPrompt = async (data) => {
  return handleApiCall(api.post('/api/prompts/test', data));
};

// ============================================================================
// AGENT APIs
// ============================================================================

/**
 * Chat with email agent
 * @param {string} query - User's question
 * @param {string} context - Context type (all_emails, urgent, specific_email)
 * @param {number|string} emailId - Optional email ID for specific_email context
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const chatWithAgent = async (query, context, emailId = null) => {
  const body = { query, context };
  if (emailId) body.emailId = emailId;
  return handleApiCall(api.post('/api/agent/chat', body));
};

/**
 * Generate draft reply for email
 * @param {number|string} emailId
 * @param {string} instructions - Optional custom instructions
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const generateDraft = async (emailId, instructions = null) => {
  const body = { emailId };
  if (instructions) body.customInstructions = instructions;
  return handleApiCall(api.post('/api/agent/draft', body));
};

/**
 * Get all drafts
 * @param {number|string} emailId - Optional filter by email ID
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getAllDrafts = async (emailId = null) => {
  const url = emailId ? `/api/agent/drafts?emailId=${emailId}` : '/api/agent/drafts';
  return handleApiCall(api.get(url));
};

/**
 * Get draft by ID
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const getDraftById = async (id) => {
  return handleApiCall(api.get(`/api/agent/drafts/${id}`));
};

/**
 * Update draft
 * @param {number|string} id
 * @param {{subject?: string, body?: string}} data
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const updateDraft = async (id, data) => {
  return handleApiCall(api.put(`/api/agent/drafts/${id}`, data));
};

/**
 * Delete draft by ID
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const deleteDraft = async (id) => {
  return handleApiCall(api.delete(`/api/agent/drafts/${id}`));
};

// ============================================================================
// ACTION APIs
// ============================================================================

/**
 * Get all action items
 * @param {string} status - Optional filter by status (pending, completed)
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getAllActions = async (status = null) => {
  const url = status ? `/api/actions?status=${status}` : '/api/actions';
  return handleApiCall(api.get(url));
};

/**
 * Get action items by email ID
 * @param {number|string} emailId
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getActionsByEmailId = async (emailId) => {
  return handleApiCall(api.get(`/api/actions/email/${emailId}`));
};

/**
 * Create action item
 * @param {{email_id: number, task_description: string, deadline?: string}} data
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const createAction = async (data) => {
  return handleApiCall(api.post('/api/actions', data));
};

/**
 * Update action item
 * @param {number|string} id
 * @param {{task_description?: string, deadline?: string, status?: string}} data
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const updateAction = async (id, data) => {
  return handleApiCall(api.put(`/api/actions/${id}`, data));
};

/**
 * Update action item status
 * @param {number|string} id
 * @param {string} status - New status (pending, completed)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const updateActionStatus = async (id, status) => {
  return handleApiCall(api.patch(`/api/actions/${id}/status`, { status }));
};

/**
 * Delete action item
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const deleteAction = async (id) => {
  return handleApiCall(api.delete(`/api/actions/${id}`));
};

/**
 * Get pending action items
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getPendingActions = async () => {
  return handleApiCall(api.get('/api/actions/pending'));
};

/**
 * Get action item statistics
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const getActionStats = async () => {
  return handleApiCall(api.get('/api/actions/stats'));
};

// ============================================================================
// DEFAULT EXPORT (for backward compatibility)
// ============================================================================
export default api;
