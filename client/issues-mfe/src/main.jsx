import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { client } from './apolloClient'
import Dashboard   from './pages/Dashboard'
import SubmitIssue from './pages/SubmitIssue'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <Routes>
        <Route path="*"       element={<Dashboard />} />
        <Route path="/submit" element={<SubmitIssue />} />
      </Routes>
    </BrowserRouter>
  </ApolloProvider>
)
