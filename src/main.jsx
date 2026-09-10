import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Submit from './pages/Submit.jsx'
import Gallery from './pages/Gallery.jsx'
import Winners from './pages/Winners.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Submit />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/winners" element={<Winners />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
