import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './App.css';
import ProtectedRoute from "./protectedRoute/ProtectedRoute.tsx";
import Profile from "./pages/profilePage/Profile.tsx";
import LoginPage from "./pages/loginpage/LoginPage.tsx";
import SignupPage from "./pages/signupPage/SignupPage.tsx";
import Layout from "./components/layout/Layout.tsx";
import Dashboard from "./components/Dashboard.tsx";

function App() {
    const isAuthenticated = true;

    console.log('v0.0.2');

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
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
                </Route>
                <Route path="*" element={<LoginPage/>}/>
            </Routes>
        </Router>
    )
}

export default App
