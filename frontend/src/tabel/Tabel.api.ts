export interface TabelData {
    CDR_ID: string;
    Authentication_ID: string;
    Duration: string;  
    Volume: number;
    Charge_Point_ID: string;
    Calculated_Cost: number;
  }

export interface RawApiResponse {
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

        const filteredData: TabelData[] = rawData.map(row => {
            // Safely convert Calculated_Cost to number
            let calculatedCost = 0;
            if (typeof row[19] === 'string') {
                calculatedCost = parseFloat(row[19].replace(',', '.'));
            } else if (typeof row[19] === 'number') {
                calculatedCost = row[19];
            }

            // Safely convert Volume to number
            let volume = 0;
            if (typeof row[4] === 'string') {
                volume = parseFloat(row[4].replace(',', '.'));
            } else if (typeof row[4] === 'number') {
                volume = row[4];
            }

            return {
                CDR_ID: row[0],
                Authentication_ID: row[11],
                Duration: row[3],
                Volume: volume,
                Charge_Point_ID: row[16],
                Calculated_Cost: calculatedCost
            };
        });

        return filteredData;
    } catch (error) {
        console.error('Error fetching tabel data:', error);
        throw error;
    }
};

export const GetDataByCDR = async (cdrID: string): Promise<RawApiResponse | null> => {
    try {
        const response = await fetch(`http://localhost:8000/tabel/${cdrID}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData: any[] = await response.json(); // Get the raw data as an array

        // Map the array to an object that matches RawApiResponse
        const mappedData: RawApiResponse = {
            CDR_ID: rawData[0],
            Start_datetime: rawData[1],
            End_datetime: rawData[2],
            Duration: rawData[3],
            Volume: parseFloat(rawData[4].replace(',', '.')), // Ensure it's a number
            Charge_Point_Address: rawData[5],
            Charge_Point_ZIP: rawData[6],
            Charge_Point_City: rawData[7],
            Charge_Point_Country: rawData[8],
            Charge_Point_Type: rawData[9],
            Product_Type: rawData[10],
            Tariff_Type: rawData[11],
            Authentication_ID: rawData[12] || '',
            Contract_ID: rawData[13] || '',
            Meter_ID: rawData[14] || '',
            OBIS_Code: rawData[15] || '',
            Charge_Point_ID: rawData[16],
            Service_Provider_ID: rawData[17],
            Infra_Provider_ID: rawData[18],
            Calculated_Cost: parseFloat(rawData[19].replace(',', '.')), // Ensure it's a number
        };

        console.log('Mapped Data:', mappedData); // Log the mapped data to ensure it's correct

        return mappedData;
    } catch (error) {
        console.error('Error fetching tabel data:', error);
        throw error;
    }
};


