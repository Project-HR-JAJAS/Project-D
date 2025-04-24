import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChargeDetails from './home/ChargeDetail';
import Home from './home/Home';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/charges/:timeRange" element={<ChargeDetails />} />
            </Routes>
        </Router>
    );
};

export default App;