import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { client } from './apolloClient'
import Analytics      from './pages/Analytics'
import StaffDashboard from './pages/StaffDashboard'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <Routes>
        <Route path="*"      element={<Analytics />} />
        <Route path="/staff" element={<StaffDashboard />} />
      </Routes>
    </BrowserRouter>
  </ApolloProvider>
)
