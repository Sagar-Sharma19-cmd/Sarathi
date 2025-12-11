import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SendMoneyPage from './pages/SendMoneyPage';
import ScorePage from './pages/ScorePage';
import LoanPage from './pages/LoanPage';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import SafeSendPage from './pages/SafeSendPage';
import SafeSendDetailsPage from './pages/SafeSendDetailsPage';
function App() {
    return (_jsx(BrowserRouter, { children: _jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/home", element: _jsx(ProtectedRoute, { children: _jsx(HomePage, {}) }) }), _jsx(Route, { path: "/send-money", element: _jsx(ProtectedRoute, { children: _jsx(SendMoneyPage, {}) }) }), _jsx(Route, { path: "/score", element: _jsx(ProtectedRoute, { children: _jsx(ScorePage, {}) }) }), _jsx(Route, { path: "/loan", element: _jsx(ProtectedRoute, { children: _jsx(LoanPage, {}) }) }), _jsx(Route, { path: "/transactions", element: _jsx(ProtectedRoute, { children: _jsx(TransactionsPage, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { children: _jsx(SettingsPage, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { children: _jsx(AdminPage, {}) }) }), _jsx(Route, { path: "/safesend", element: _jsx(ProtectedRoute, { children: _jsx(SafeSendPage, {}) }) }), _jsx(Route, { path: "/safesend/:escrowId", element: _jsx(ProtectedRoute, { children: _jsx(SafeSendDetailsPage, {}) }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/home", replace: true }) })] }) }) }));
}
export default App;
//# sourceMappingURL=App.js.map