export interface UserData {
    User_Name: string;
    User_Password: string;
}

export interface LoginResponse {
    session_token: string;
    user_id: string;
    user_name: string;
}

export const fetchUser = async (credentials: UserData): Promise<LoginResponse | null> => {
    const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        throw new Error('User and password combination not found');
    }

    const data = await response.json();
    return data;
};