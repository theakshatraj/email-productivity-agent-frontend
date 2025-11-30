/**
 * Email Productivity Agent - Global State Management Context
 *
 * Provides centralized state management for:
 * - Email data (list, selected, stats)
 * - Prompts configuration
 * - Drafts management
 * - Action items tracking
 * - Loading states and error handling
 *
 * @module EmailContext
 */
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '@/lib/api';

/**
 * EmailContext - React context for email state management
 */
const EmailContext = createContext(undefined);

/**
 * EmailProvider - Provides global email state and operations
 *
 * @param {{children: React.ReactNode}} props
 * @returns {JSX.Element}
 */
export const EmailProvider = ({ children }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /** @type {[Array, Function]} All emails from database */
  const [emails, setEmails] = useState([]);

  /** @type {[Object|null, Function]} Currently selected email with full details */
  const [selectedEmail, setSelectedEmail] = useState(null);

  /** @type {[Array, Function]} All AI prompts */
  const [prompts, setPrompts] = useState([]);

  /** @type {[Array, Function]} All email drafts */
  const [drafts, setDrafts] = useState([]);

  /** @type {[Array, Function]} All action items */
  const [actions, setActions] = useState([]);

  /** @type {[boolean, Function]} Global loading state */
  const [loading, setLoading] = useState(false);

  /** @type {[string|null, Function]} Error message */
  const [error, setError] = useState(null);

  /** @type {[Object, Function]} Email statistics */
  const [stats, setStats] = useState({});

  // ============================================================================
  // ERROR HANDLING HELPER
  // ============================================================================
  /**
   * Handles API errors with user-friendly messages
   * @param {Error|string} err - Error object or message
   * @param {string} defaultMessage - Default error message
   */
  const handleError = useCallback((err, defaultMessage = 'An error occurred') => {
    const message = typeof err === 'string' ? err : err?.message || defaultMessage;
    setError(message);
    console.error('EmailContext Error:', message, err);
  }, []);

  // ============================================================================
  // EMAIL FUNCTIONS
  // ============================================================================

  /**
   * Load all emails from API with optional filters
   * @param {{category?: string, processed?: boolean, search?: string}} filters
   */
  const loadEmails = useCallback(
    async (filters = {}) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getAllEmails(filters);
        if (result.success) {
          setEmails(result.data || []);
        } else {
          handleError(result.error, 'Failed to load emails');
        }
      } catch (err) {
        handleError(err, 'Failed to load emails');
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  /**
   * Select email by ID and load full details with related data
   * @param {number|string} id - Email ID
   */
  const selectEmail = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getEmailById(id);
        if (result.success) {
          setSelectedEmail(result.data || null);
          // Also load related drafts and actions
          await loadDrafts(id);
          await loadActions(id);
        } else {
          handleError(result.error, 'Failed to load email details');
          setSelectedEmail(null);
        }
      } catch (err) {
        handleError(err, 'Failed to load email details');
        setSelectedEmail(null);
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  /**
   * Process all unprocessed emails
   * @returns {Promise<{success: boolean, summary?: Object}>}
   */
  const processEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.processAllEmails();
      if (result.success) {
        // Reload emails after processing
        await loadEmails();
        await refreshStats();
        return { success: true, summary: result.data };
      } else {
        handleError(result.error, 'Failed to process emails');
        return { success: false };
      }
    } catch (err) {
      handleError(err, 'Failed to process emails');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [loadEmails, handleError]);

  /**
   * Load mock emails from JSON file
   */
  const loadMockEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.loadMockEmails();
      if (result.success) {
        await loadEmails();
        await refreshStats();
      } else {
        handleError(result.error, 'Failed to load mock emails');
      }
    } catch (err) {
      handleError(err, 'Failed to load mock emails');
    } finally {
      setLoading(false);
    }
  }, [loadEmails, handleError]);

  /**
   * Delete email by ID
   * @param {number|string} id
   */
  const deleteEmail = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.deleteEmail(id);
        if (result.success) {
          // Remove from local state
          setEmails((prev) => prev.filter((email) => email.id !== id));
          if (selectedEmail?.id === id) {
            setSelectedEmail(null);
          }
          await refreshStats();
        } else {
          handleError(result.error, 'Failed to delete email');
        }
      } catch (err) {
        handleError(err, 'Failed to delete email');
      } finally {
        setLoading(false);
      }
    },
    [selectedEmail, handleError],
  );

  /**
   * Reprocess email with current prompts
   * @param {number|string} id
   */
  const reprocessEmail = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.reprocessEmail(id);
        if (result.success) {
          await loadEmails();
          await selectEmail(id);
        } else {
          handleError(result.error, 'Failed to reprocess email');
        }
      } catch (err) {
        handleError(err, 'Failed to reprocess email');
      } finally {
        setLoading(false);
      }
    },
    [loadEmails, selectEmail, handleError],
  );

  // ============================================================================
  // PROMPT FUNCTIONS
  // ============================================================================

  /**
   * Load all prompts from API
   */
  const loadPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAllPrompts();
      if (result.success) {
        setPrompts(result.data || []);
      } else {
        handleError(result.error, 'Failed to load prompts');
      }
    } catch (err) {
      handleError(err, 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * Update prompt and refresh list
   * @param {number|string} id - Prompt ID
   * @param {{prompt_text?: string, description?: string}} data - Update data
   */
  const updatePrompt = useCallback(
    async (id, data) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.updatePrompt(id, data);
        if (result.success) {
          await loadPrompts();
        } else {
          handleError(result.error, 'Failed to update prompt');
        }
      } catch (err) {
        handleError(err, 'Failed to update prompt');
      } finally {
        setLoading(false);
      }
    },
    [loadPrompts, handleError],
  );

  /**
   * Reset prompts to defaults
   */
  const resetPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.resetPrompts();
      if (result.success) {
        await loadPrompts();
      } else {
        handleError(result.error, 'Failed to reset prompts');
      }
    } catch (err) {
      handleError(err, 'Failed to reset prompts');
    } finally {
      setLoading(false);
    }
  }, [loadPrompts, handleError]);

  // ============================================================================
  // DRAFT FUNCTIONS
  // ============================================================================

  /**
   * Load all drafts, optionally filtered by email ID
   * @param {number|string|null} emailId - Optional email ID filter
   */
  const loadDrafts = useCallback(
    async (emailId = null) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getAllDrafts(emailId);
        if (result.success) {
          setDrafts(result.data || []);
        } else {
          handleError(result.error, 'Failed to load drafts');
        }
      } catch (err) {
        handleError(err, 'Failed to load drafts');
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  /**
   * Generate draft for email
   * @param {number|string} emailId
   * @param {string} instructions - Optional custom instructions
   */
  const generateDraft = useCallback(
    async (emailId, instructions = null) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.generateDraft(emailId, instructions);
        if (result.success) {
          await loadDrafts(emailId);
        } else {
          handleError(result.error, 'Failed to generate draft');
        }
      } catch (err) {
        handleError(err, 'Failed to generate draft');
      } finally {
        setLoading(false);
      }
    },
    [loadDrafts, handleError],
  );

  /**
   * Update draft
   * @param {number|string} id - Draft ID
   * @param {{subject?: string, body?: string}} data - Update data
   */
  const updateDraft = useCallback(
    async (id, data) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.updateDraft(id, data);
        if (result.success) {
          await loadDrafts();
        } else {
          handleError(result.error, 'Failed to update draft');
        }
      } catch (err) {
        handleError(err, 'Failed to update draft');
      } finally {
        setLoading(false);
      }
    },
    [loadDrafts, handleError],
  );

  /**
   * Delete draft
   * @param {number|string} id - Draft ID
   */
  const deleteDraft = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.deleteDraft(id);
        if (result.success) {
          setDrafts((prev) => prev.filter((draft) => draft.id !== id));
        } else {
          handleError(result.error, 'Failed to delete draft');
        }
      } catch (err) {
        handleError(err, 'Failed to delete draft');
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  // ============================================================================
  // ACTION FUNCTIONS
  // ============================================================================

  /**
   * Load all action items, optionally filtered by email ID
   * @param {number|string|null} emailId - Optional email ID filter
   */
  const loadActions = useCallback(
    async (emailId = null) => {
      setLoading(true);
      setError(null);
      try {
        const result = emailId
          ? await api.getActionsByEmailId(emailId)
          : await api.getAllActions();
        if (result.success) {
          setActions(result.data || []);
        } else {
          handleError(result.error, 'Failed to load action items');
        }
      } catch (err) {
        handleError(err, 'Failed to load action items');
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  /**
   * Create action item
   * @param {{email_id: number, task_description: string, deadline?: string}} data
   */
  const createAction = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.createAction(data);
        if (result.success) {
          await loadActions(data.email_id);
        } else {
          handleError(result.error, 'Failed to create action item');
        }
      } catch (err) {
        handleError(err, 'Failed to create action item');
      } finally {
        setLoading(false);
      }
    },
    [loadActions, handleError],
  );

  /**
   * Update action item status
   * @param {number|string} id - Action ID
   * @param {string} status - New status (pending, completed)
   */
  const updateActionStatus = useCallback(
    async (id, status) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.updateActionStatus(id, status);
        if (result.success) {
          await loadActions();
        } else {
          handleError(result.error, 'Failed to update action status');
        }
      } catch (err) {
        handleError(err, 'Failed to update action status');
      } finally {
        setLoading(false);
      }
    },
    [loadActions, handleError],
  );

  // ============================================================================
  // STATS FUNCTIONS
  // ============================================================================

  /**
   * Refresh email statistics
   */
  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsResult = await api.getEmailStats();
      const actionsResult = await api.getActionStats();

      if (statsResult.success && actionsResult.success) {
        setStats({
          emails: statsResult.data || {},
          actions: actionsResult.data?.stats || {},
        });
      } else {
        handleError('Failed to load statistics');
      }
    } catch (err) {
      handleError(err, 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // HELPER FUNCTIONS (Computed Values)
  // ============================================================================

  /**
   * Get emails filtered by category
   * @param {string} category - Category name
   * @returns {Array}
   */
  const getEmailsByCategory = useCallback(
    (category) => {
      return emails.filter((email) => email.category === category);
    },
    [emails],
  );

  /**
   * Get all pending action items
   * @returns {Array}
   */
  const getPendingActions = useCallback(() => {
    return actions.filter((action) => action.status === 'pending');
  }, [actions]);

  /**
   * Get all unprocessed emails
   * @returns {Array}
   */
  const getUnprocessedEmails = useCallback(() => {
    return emails.filter((email) => !email.is_processed || email.is_processed === 0);
  }, [emails]);

  // ============================================================================
  // COMPUTED VALUES (Memoized)
  // ============================================================================

  /** Emails grouped by category */
  const emailsByCategory = useMemo(() => {
    const grouped = {};
    emails.forEach((email) => {
      const cat = email.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(email);
    });
    return grouped;
  }, [emails]);

  /** Pending action items count */
  const pendingActionsCount = useMemo(() => {
    return actions.filter((action) => action.status === 'pending').length;
  }, [actions]);

  /** Unprocessed emails count */
  const unprocessedEmailsCount = useMemo(() => {
    return emails.filter((email) => !email.is_processed || email.is_processed === 0).length;
  }, [emails]);

  // ============================================================================
  // INITIAL DATA LOADING
  // ============================================================================

  useEffect(() => {
    // Load initial data on mount
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadEmails(),
          loadPrompts(),
          loadDrafts(),
          loadActions(),
          refreshStats(),
        ]);
      } catch (err) {
        handleError(err, 'Failed to initialize data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = useMemo(
    () => ({
      // State
      emails,
      selectedEmail,
      prompts,
      drafts,
      actions,
      loading,
      error,
      stats,

      // Email functions
      loadEmails,
      selectEmail,
      processEmails,
      loadMockEmails,
      deleteEmail,
      reprocessEmail,

      // Prompt functions
      loadPrompts,
      updatePrompt,
      resetPrompts,

      // Draft functions
      loadDrafts,
      generateDraft,
      updateDraft,
      deleteDraft,

      // Action functions
      loadActions,
      createAction,
      updateActionStatus,

      // Stats functions
      refreshStats,

      // Helper functions
      getEmailsByCategory,
      getPendingActions,
      getUnprocessedEmails,

      // Computed values
      emailsByCategory,
      pendingActionsCount,
      unprocessedEmailsCount,

      // Utility
      clearError: () => setError(null),
    }),
    [
      emails,
      selectedEmail,
      prompts,
      drafts,
      actions,
      loading,
      error,
      stats,
      loadEmails,
      selectEmail,
      processEmails,
      loadMockEmails,
      deleteEmail,
      reprocessEmail,
      loadPrompts,
      updatePrompt,
      resetPrompts,
      loadDrafts,
      generateDraft,
      updateDraft,
      deleteDraft,
      loadActions,
      createAction,
      updateActionStatus,
      refreshStats,
      getEmailsByCategory,
      getPendingActions,
      getUnprocessedEmails,
      emailsByCategory,
      pendingActionsCount,
      unprocessedEmailsCount,
    ],
  );

  return <EmailContext.Provider value={value}>{children}</EmailContext.Provider>;
};

/**
 * useEmail - Custom hook to access email context
 *
 * @returns {Object} Email context value with state and functions
 * @throws {Error} If used outside EmailProvider
 *
 * @example
 * const { emails, loadEmails, loading } = useEmail();
 */
export const useEmail = () => {
  const context = useContext(EmailContext);

  if (!context) {
    throw new Error('useEmail must be used within EmailProvider');
  }

  return context;
};
