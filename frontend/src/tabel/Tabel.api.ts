export interface TabelData {
    CDR_ID: string;
    Authentication_ID: string;
    Duration: string;  
    Volume: number;
    Charge_Point_ID: string;
    Calculated_Cost: number;
  }

interface RawApiResponse {
    CDR_ID: string;
    Start_datetime: string;
    End_datetime: string;
    Duration: string;
    Volume: number;
    Charge_Point_Address: string;
    Charge_Point_ZIP: string;
    Charge_Point_City: string;
    Charge_Point_Country: string;
    Charge_Point_Type: string;
    Product_Type: string;
    Tariff_Type: string;
    Authentication_ID: string;
    Contract_ID: string;
    Meter_ID: string;
    OBIS_Code: string;
    Charge_Point_ID: string;
    Service_Provider_ID: string;
    Infra_Provider_ID: string;
    Calculated_Cost: number;
  }
  
  export const getAllTabelData = async (): Promise<TabelData[]> => {
    try {
        const response = await fetch('http://localhost:8000/tabel/all');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData: any[][] = await response.json();

        const filteredData: TabelData[] = rawData.map(row => ({
            CDR_ID: row[0],
            Authentication_ID: row[11],
            Duration: row[3],
            Volume: parseFloat(row[4].replace(',', '.')),
            Charge_Point_ID: row[16],
            Calculated_Cost: parseFloat(row[19].replace(',', '.'))
        }));

        return filteredData;
    } catch (error) {
        console.error('Error fetching tabel data:', error);
        throw error;
    }
};
