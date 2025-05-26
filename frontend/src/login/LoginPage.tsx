import React, { useState } from 'react';
import { fetchUser, UserData, LoginResponse } from './LoginPage.api'; // adjust the path if needed
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const user: LoginResponse | null = await fetchUser({ User_Name: username, User_Password: password });
            if (user) {
                localStorage.setItem('token', user.session_token);
                localStorage.setItem('username', user.user_name);
                navigate('/home');
            } else {
                setMessage('Invalid credentials.');
            }
        } catch (error) {
            setMessage('Login failed: ' + (error as Error).message);
        }
    };

   return (
        <div className="login-container">
            <h2 className="login-title">Login</h2>
            <form className="login-form" onSubmit={handleLogin}>
                <div className="login-field">
                    <label>Username:</label>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="login-field">
                    <label>Password:</label>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button className="login-button" type="submit">Login</button>
            </form>
            {message && <p className="login-message">{message}</p>}
        </div>
    );
};

export default LoginPage;
