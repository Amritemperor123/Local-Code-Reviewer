import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ReviewPage from './pages/ReviewPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/review" element={<ReviewPage />} />
    </Routes>
  );
}

export default App;
