import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAllTabelData, TabelData } from "./Tabel.api";

export function TabelDetails() {
    const { cdrId } = useParams<{ cdrId: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<TabelData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const allData = await getAllTabelData();
            const found = allData.find(d => d.CDR_ID === cdrId);
            setItem(found || null);
            setLoading(false);
        }
        fetchData();
    }, [cdrId]);

    if (loading) return <div>Loading...</div>;
    if (!item) return <div>Item not found.</div>;

    return (
        <div style={{ padding: "1rem" }}>
            <h2>Details for CDR ID: {item.CDR_ID}</h2>
            <ul>
                {Object.entries(item).map(([key, value]) => (
                    <li key={key}><strong>{key}</strong>: {String(value)}</li>
                ))}
            </ul>
            <button onClick={() => navigate(-1)}>Back</button>
        </div>
    );
}
