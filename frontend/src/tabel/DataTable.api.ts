interface DataTableItem {
    id: string;
    authentication_id: string;
    duration: string;
    volume: number;
    charge_point_id: string;
    calculated_cost: number;
}

const PAGE_SIZE = 20;

export const fetchDataTable = async (
    page: number,
    sort_by?: 'volume' | 'calculated_cost' | null,
    sort_dir?: 'asc' | 'desc' | null,
    page_size?: number,
    searchTerm?: string
  ): Promise<{ results: DataTableItem[], total: number }> => {
    let url = `http://localhost:8000/api/data-table?page=${page}&page_size=${page_size ?? PAGE_SIZE}`;
    
    if (sort_by && sort_dir) {
      url += `&sort_by=${sort_by}&sort_dir=${sort_dir}`;
    }
  
    if (searchTerm && searchTerm.trim() !== '') {
      url += `&search=${encodeURIComponent(searchTerm.trim())}`;
    }
  
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
  
    const data = await response.json();
    return {
      results: Array.isArray(data.results) ? data.results : [],
      total: typeof data.total === 'number' ? data.total : 0
    };
  };
  

export { PAGE_SIZE }; 