import React, { useEffect, useState } from 'react';

import { createUser } from './CreateUser.api';
import '../pages/ImportHistory.css';

interface CreateUserProps {
  onClose: () => void;
}

const CreateUser: React.FC<CreateUserProps> = ({ onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const user = await createUser({ User_Name: username, User_Password: password });
            if (user) {
                setMessage('User created successfully.');
            } else {
                setMessage('Invalid credentials.');
            }
        } catch (error) {
            setMessage('Creation failed: ' + (error as Error).message);
        }
    };

  return (
        <div className="model-overlay">
            <div className="model-content">
                <button className="model-close" onClick={onClose}>×</button>
                <h2 className="model-title">Create User</h2>
                <form onSubmit={handleCreate}>
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
                    <button type="submit">Create User</button>
                </form>
            {message && <p>{message}</p>}
            </div>
        </div>
    );
};
    

export default CreateUser;
