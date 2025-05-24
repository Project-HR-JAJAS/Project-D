import React, { useState } from 'react';
import { fetchUser, UserData } from './LoginPage.api'; // adjust the path if needed
import { useNavigate } from 'react-router-dom';


const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const user = await fetchUser({ User_Name: username, User_Password: password });
            if (user) {
                localStorage.setItem('token', 'your_token_value');
                localStorage.setItem('username', user.User_Name);
                navigate('/home');
            } else {
                setMessage('Invalid credentials.');
            }
        } catch (error) {
            setMessage('Login failed: ' + (error as Error).message);
        }
    };

    return (
        <div style={{ maxWidth: '300px', margin: 'auto', paddingTop: '100px' }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default LoginPage;
