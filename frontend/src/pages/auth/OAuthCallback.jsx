import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const handleOAuthCallback = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');
            const error = params.get('error');

            if (error) {
                toast.error(`Google Login failed: ${error}`);
                navigate('/login');
                return;
            }

            if (token) {
                try {
                    const user = await loginWithToken(token);

                    toast.success(`Welcome back, ${user.firstName || 'User'}!`);

                    // Redirect based on role
                    switch (user.role) {
                        case 'CANDIDATE':
                            navigate('/candidate');
                            break;
                        case 'RECRUITER':
                            navigate('/recruiter');
                            break;
                        case 'ADMIN':
                            navigate('/admin');
                            break;
                        default:
                            navigate('/');
                    }
                } catch (err) {
                    console.error("OAuth login error", err);
                    toast.error("Failed to complete Google login");
                    navigate('/login');
                }
            } else {
                toast.error("Invalid OAuth callback");
                navigate('/login');
            }
        };

        handleOAuthCallback();
    }, [location, navigate, loginWithToken]);

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', color: 'white', flexDirection: 'column', gap: '1rem' }}>
            <Loader2 size={48} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <style>
                {`
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                `}
            </style>
            <h2>Completing login...</h2>
        </div>
    );
};

export default OAuthCallback;
