import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
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
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh for auth endpoints (login, register, refresh itself)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/refresh');

        // If 401 and not an auth endpoint and not already retrying
        if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const response = await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - clear token but don't force redirect
                localStorage.removeItem('accessToken');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// API helper functions
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh'),
};

export const resumeAPI = {
    upload: (formData) => api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getAll: () => api.get('/resumes'),
    getById: (id) => api.get(`/resumes/${id}`),
    getAnalysis: (id) => api.get(`/resumes/${id}/analysis`),
    delete: (id) => api.delete(`/resumes/${id}`),
};

export const jobAPI = {
    create: (data) => api.post('/jobs', data),
    getAll: (params) => api.get('/jobs', { params }),
    getById: (id) => api.get(`/jobs/${id}`),
    getMyJobs: () => api.get('/jobs/my-jobs'),
    update: (id, data) => api.put(`/jobs/${id}`, data),
    delete: (id) => api.delete(`/jobs/${id}`),
    toggleActive: (id) => api.post(`/jobs/${id}/toggle-active`),
    apply: (id, data) => api.post(`/jobs/${id}/apply`, data),
    getMyApplications: () => api.get('/jobs/my-applications'),
};

export const matchAPI = {
    matchResume: (resumeId) => api.post(`/match/resume/${resumeId}`),
    matchJob: (jobId) => api.post(`/match/job/${jobId}`),
    getResults: (resumeId) => api.get(`/match/results/${resumeId}`),
    getCandidates: (jobId) => api.get(`/match/candidates/${jobId}`),
    getJobMatches: (jobId) => api.get(`/match/candidates/${jobId}`),
    getDetail: (matchId) => api.get(`/match/detail/${matchId}`),
};

export const analyticsAPI = {
    getCandidate: () => api.get('/analytics/candidate'),
    getRecruiter: () => api.get('/analytics/recruiter'),
    getAdmin: () => api.get('/analytics/admin'),
    getSkillsDemand: () => api.get('/analytics/skills-demand'),
};

export const userAPI = {
    updateProfile: (data) => api.put('/users/me', data),
    changePassword: (data) => api.put('/users/me/password', data),
    deleteAccount: () => api.delete('/users/me'),
};

export const savedJobAPI = {
    getAll: () => api.get('/saved-jobs'),
    save: (jobId, notes) => api.post(`/saved-jobs/${jobId}`, { notes }),
    updateNotes: (jobId, notes) => api.patch(`/saved-jobs/${jobId}`, { notes }),
    remove: (jobId) => api.delete(`/saved-jobs/${jobId}`),
    check: (jobId) => api.get(`/saved-jobs/check/${jobId}`),
};

export const interviewAPI = {
    getAll: (params) => api.get('/interviews', { params }),
    getById: (id) => api.get(`/interviews/${id}`),
    schedule: (data) => api.post('/interviews', data),
    update: (id, data) => api.patch(`/interviews/${id}`, data),
    delete: (id) => api.delete(`/interviews/${id}`),
    getUpcoming: () => api.get('/interviews/stats/upcoming'),
};

export const emailAPI = {
    sendWelcome: () => api.post('/email/welcome'),
    resendInterview: (interviewId) => api.post(`/email/resend-interview/${interviewId}`),
    getPreferences: () => api.get('/email/preferences'),
    updatePreferences: (prefs) => api.put('/email/preferences', prefs),
};

export const gamificationAPI = {
    getStats: () => api.get('/gamification/stats'),
};

export const aiAPI = {
    enhance: (text, type) => api.post('/ai/enhance', { text, type }),
};

export const quizAPI = {
    generate: (data) => api.post('/quiz/generate', data),
    submit: (data) => api.post('/quiz/submit', data),
};

export const interviewPracticeAPI = {
    start: (data) => api.post('/interviews/start', data),
    chat: (data) => api.post('/interviews/chat', data),
    streamStart: async (data) => {
        const token = localStorage.getItem('accessToken');
        return fetch(`${API_URL}/interviews/stream-start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(data)
        });
    },
    streamChat: async (data) => {
        const token = localStorage.getItem('accessToken');
        return fetch(`${API_URL}/interviews/stream-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(data)
        });
    }
};

export const messageAPI = {
    getConversations: () => api.get('/messages/conversations'),
    getConversationMessages: (conversationId) => api.get(`/messages/${conversationId}/messages`),
    startConversation: (otherUserId, jobId) => api.post('/messages/start', { otherUserId, jobId }),
    sendMessage: (conversationId, content) => api.post(`/messages/${conversationId}/messages`, { content }),
};

