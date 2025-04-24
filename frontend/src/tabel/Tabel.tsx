import React from "react";
import './TabelForm.css';
import { getAllTabelData, TabelData } from "./Tabel.api"; // Adjust the import path as needed

interface TabelProps {
    backToHome: () => void;
}

interface TabelState {
    data: TabelData[];
    loading: boolean;
    error: string | null;
    currentPage: number;
}

export class TabelForm extends React.Component<TabelProps, TabelState> {
    constructor(props: TabelProps) {
        super(props);
        this.state = {
            data: [],
            loading: true,
            error: null,
            currentPage: 1,
        };
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        try {
            const data = await getAllTabelData();
            const limitedData = data;
            this.setState({ data: limitedData, loading: false });
        } catch (error) {
            this.setState({ 
                error: "Failed to load data", 
                loading: false 
            });
            console.error("Error fetching data:", error);
        }
    };

    ITEMS_PER_PAGE = 20;

    handlePageChange = (newPage: number) => {
        this.setState({ currentPage: newPage });
    };


    render() {
        const { data, loading, error, currentPage } = this.state;
        const totalPages = Math.ceil(data.length / this.ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * this.ITEMS_PER_PAGE;
        const visibleData = data.slice(startIndex, startIndex + this.ITEMS_PER_PAGE);

        if (loading) {
            return <div>Loading data...</div>;
        }

        if (error) {
            return <div>{error}</div>;
        }

        return (
            <div className="tabel-form">
                <h2>Tabel</h2>
                <div className="pagination-info aligned-right">
                    Showing {startIndex + 1} to {Math.min(startIndex + this.ITEMS_PER_PAGE, data.length)} of {data.length} records
                </div>
                <table className="tabel-table">
                    <thead>
                        <tr>
                            <th>CDR ID</th>
                            <th>Authentication ID</th>
                            <th>Duration</th>
                            <th>Volume</th>
                            <th>Charge Point ID</th>
                            <th>Calculated Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleData.map((item) => (
                            <tr key={item.CDR_ID}>
                                <td>{item.CDR_ID}</td>
                                <td>{item.Authentication_ID ?? 'null'}</td>
                                <td>{item.Duration}</td>
                                <td>{item.Volume}</td>
                                <td>{item.Charge_Point_ID}</td>
                                <td>{item.Calculated_Cost}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination-info">
                    Showing {startIndex + 1} to {Math.min(startIndex + this.ITEMS_PER_PAGE, data.length)} of {data.length} records
                </div>
                <div className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                            return (
                                page === 1 || 
                                page === totalPages || 
                                (page >= currentPage - 2 && page <= currentPage + 2)
                            );
                        })
                        .reduce((acc: (number | "...")[], page, i, arr) => {
                            if (i > 0 && page - (arr[i - 1] as number) > 1) {
                                acc.push("...");
                            }
                            acc.push(page);
                            return acc;
                        }, [])
                        .map((page, index) =>
                            page === "..." ? (
                                <span key={`ellipsis-${index}`} className="page-number-ellipsis">...</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => this.handlePageChange(page)}
                                    className={`page-number-button ${page === currentPage ? "active" : ""}`}
                                >
                                    {page}
                                </button>
                            )
                        )}
                </div>
            </div>
        );
        
    }
}