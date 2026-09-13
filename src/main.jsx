import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminProvider } from './lib/admin.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AartiForm from './pages/AartiForm.jsx'
import AartiList from './pages/AartiList.jsx'
import ProgramForm from './pages/ProgramForm.jsx'
import ProgramList from './pages/ProgramList.jsx'
import ProgramWinners from './pages/ProgramWinners.jsx'
import EventsSchedule from './pages/EventsSchedule.jsx'
import Submit from './pages/Submit.jsx'
import Gallery from './pages/Gallery.jsx'
import Winners from './pages/Winners.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/aarti" element={<AartiForm />} />
          <Route path="/aarti/list" element={<AartiList />} />
          <Route path="/program" element={<ProgramForm />} />
          <Route path="/program/list" element={<ProgramList />} />
          <Route path="/program/winners" element={<ProgramWinners />} />
          <Route path="/events" element={<EventsSchedule />} />
          {/* Photo contest (kept alongside the events app) */}
          <Route path="/photo" element={<Submit />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/winners" element={<Winners />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  </React.StrictMode>
)
