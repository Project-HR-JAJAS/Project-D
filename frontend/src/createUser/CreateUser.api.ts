export interface UserData {
    User_Name: string;
    User_Password: string;
}

export const createUser = async (credentials: UserData): Promise<UserData | null> => {
    const response = await fetch('http://localhost:8000/api/create/user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        throw new Error('Username already exists');
    }

    const data = await response.json();
    return data;
};