import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inbox from './pages/Inbox.jsx'
import Orders from './pages/Orders.jsx'
import Products from './pages/Products.jsx'
import TokenAnalytics from './pages/TokenAnalytics.jsx'
import Settings from './pages/settings/index.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/products" element={<Products />} />
        <Route path="/tokens" element={<TokenAnalytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
