import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

    useEffect(() => {
        if (accessToken) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            // Don't call logout() here as it can cause an infinite loop
            // Just clear the local state
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user: userData, accessToken: token } = response.data;

        localStorage.setItem('accessToken', token);
        setAccessToken(token);
        setUser(userData);

        return userData;
    };

    const loginWithToken = async (token) => {
        localStorage.setItem('accessToken', token);
        setAccessToken(token);

        // We set the default header temporarily so fetchUser succeeds immediately
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
            return response.data.user;
        } catch (error) {
            console.error('Failed to fetch user after token login:', error);
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setUser(null);
            throw error;
        }
    };

    const register = async (data) => {
        const response = await api.post('/auth/register', data);
        const { user: userData, accessToken: token } = response.data;

        localStorage.setItem('accessToken', token);
        setAccessToken(token);
        setUser(userData);

        return userData;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setUser(null);
        }
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithToken,
        register,
        logout,
        updateUser,
        accessToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
