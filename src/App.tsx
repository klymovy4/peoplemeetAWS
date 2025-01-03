import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import './App.css';
import ProtectedRoute from "./protectedRoute/ProtectedRoute.tsx";
import Profile from "./pages/profilePage/Profile.tsx";
import LoginPage from "./pages/loginpage/LoginPage.tsx";
import SignupPage from "./pages/signupPage/SignupPage.tsx";
import Map from './pages/MapPage/Map.tsx';
import Layout from "./components/layout/Layout.tsx";
import Dashboard from "./components/Dashboard.tsx";
import Chat from "./components/Chat.tsx";
import 'leaflet/dist/leaflet.css';

function App() {
    const isAuthenticated = true;

    console.log('v0.0.3');

    return (
        <Router>
            <Routes>
                <Route path="/"
                       element={isAuthenticated ? <Navigate to="/profile" replace/> : <Navigate to="/login" replace/>}/>


                {/*<Route path="/login" element={<LoginPage/>}/>*/}
                <Route path="/signup" element={<SignupPage/>}/>


                <Route path="/" element={<Layout/>}>
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <Profile/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <Dashboard/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/map"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <Map/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/chat"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <Chat/>
                            </ProtectedRoute>
                        }
                    />
                </Route>
                <Route path="*" element={<LoginPage/>}/>
            </Routes>
        </Router>
    )
}

export default App
