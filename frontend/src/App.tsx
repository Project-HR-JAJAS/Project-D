import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './home/Home';
import UsageDetails from './home/UsageDetails';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/usage/:timeRange" element={<UsageDetails />} />
            </Routes>
        </Router>
    );
};

export default App;