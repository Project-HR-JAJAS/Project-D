interface DataTableItem {
    id: number;
    authentication_id: string;
    duration: string;
    volume: number;
    charge_point_id: string;
    calculated_cost: number;
}

const PAGE_SIZE = 20;

export const fetchDataTable = async (): Promise<DataTableItem[]> => {
    const response = await fetch('http://localhost:8000/api/data-table-all');
    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export { PAGE_SIZE }; 