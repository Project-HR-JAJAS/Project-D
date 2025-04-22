import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import ImportPage from './pages/ImportPage';

const App: React.FC = () => {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Project D
          </Typography>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/import">
            Import
          </Button>
        </Toolbar>
      </AppBar>

      <Container>
        <Routes>
          <Route path="/import" element={<ImportPage />} />
          <Route path="/" element={
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Typography variant="h4">Welcome to Project D</Typography>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/import"
                sx={{ mt: 2 }}
              >
                Go to Import Page
              </Button>
            </div>
          } />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
 