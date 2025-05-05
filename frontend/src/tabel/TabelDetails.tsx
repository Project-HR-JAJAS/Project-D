import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GetDataByCDR, RawApiResponse } from "./Tabel.api";
import '../home/ChargeDetail.css'; // Make sure this imports the CSS file with the class names

// Field name mapping
const fieldMapping: { [key: string]: string } = {
    Start_datetime: "Start datetime",
    End_datetime: "End datetime",
    Duration: "Duration",
    Volume: "Volume",
    Charge_Point_Address: "Address",
    Charge_Point_ZIP: "ZIP",
    Charge_Point_City: "City",
    Charge_Point_Country: "Country",
    Charge_Point_Type: "Type",
    Charge_Point_ID: "Charge Point ID",
    Calculated_Cost: "Cost",
};

export function TabelDetails() {
    const { cdrId } = useParams<{ cdrId: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<RawApiResponse | null>(null); // Updated to handle a single RawApiResponse
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                if (cdrId) {
                    const data = await GetDataByCDR(cdrId); // Fetching data by cdrId
                    setItem(data); // Set the single object as the state
                } else {
                    setItem(null);
                }
            } catch (err) {
                console.error("Error fetching raw data:", err);
                setItem(null);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [cdrId]);

    if (loading) return <div className="loading-message">Loading...</div>;
    if (!item) return <div className="no-data-message">Item not found.</div>;

    // Formatting helper functions
    const formatDatetime = (datetime: string | undefined) => {
        if (!datetime) return "Invalid Date";
        const date = new Date(datetime);
        if (isNaN(date.getTime())) return "Invalid Date"; // Check if the date is valid
        return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}, ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    };

    const formatCost = (cost: number | undefined) => {
        if (cost == null || isNaN(cost)) return "€0.00";
        return `€${cost.toFixed(2)}`;
    };

    return (
        <div className="charge-details-container">
            <h2 className="time-range-title">Details for CDR ID: {cdrId}</h2>
            <div className="table-container">
                <table className="charge-details-table">
                    <thead>
                        <tr className="table-row">
                            {/* Table Headers */}
                            {Object.entries(fieldMapping).map(([key]) => (
                                <th key={key} className="table-header">
                                    {fieldMapping[key]} {/* Display mapped header name */}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                    <tr className="table-row">
                        {/* Render the data for the single item */}
                        {Object.entries(fieldMapping).map(([key]) => {
                            const rawKey = key as keyof RawApiResponse;
                            return (
                                <td key={rawKey} className="table-cell">
                                    {rawKey === "Start_datetime" || rawKey === "End_datetime"
                                        ? formatDatetime(item[rawKey])
                                        : rawKey === "Calculated_Cost"
                                        ? formatCost(item[rawKey])
                                        : String(item[rawKey] ?? "N/A")}
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
                </table>
            </div>
            <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
}
