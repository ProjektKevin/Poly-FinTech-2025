// src/App.jsx
import React from 'react';
import './styles/index.css';
import IndexPage from './pages/IndexPage'
import GamePage from './pages/GamePage';
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;