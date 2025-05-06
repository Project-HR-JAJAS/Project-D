export const getDataTotal = async (): Promise<number> => {
    try {
        const response = await fetch('http://localhost:8000/tabel/allNumbers');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const total: number = await response.json();
        return total;
    } catch (error) {
        console.error('Error fetching suspicious total:', error);
        throw error;
    }
};



