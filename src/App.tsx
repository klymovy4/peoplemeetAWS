import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import './App.css';
import ProtectedRoute from "./protectedRoute/ProtectedRoute.tsx";
import Profile from "./pages/profilePage/Profile.tsx";
import LoginPage from "./pages/loginpage/LoginPage.tsx";
import SignupPage from "./pages/signupPage/SignupPage.tsx";
import Map from './pages/MapPage/Map.tsx';
import Layout from "./components/layout/Layout.tsx";
import Dashboard from "./components/Dashboard.tsx";
import ChatDepricated from "./components/ChatDepricated.tsx";
import 'leaflet/dist/leaflet.css';
import ChatDrawer from "./components/chatComponent/ChatDrawer.tsx";
import ToastComponent from "./components/toastComponent/toastComponent.tsx";

function App() {
   const isAuthenticated = localStorage.getItem('accessToken');

   return (
       <>
          <ToastComponent/>
          <ChatDrawer/>
          <Router>
             <Routes>
                <Route path="/"
                       element={isAuthenticated ? <Navigate to="/profile" replace/> : <Navigate to="/login" replace/>}
                />
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
                             <ChatDepricated/>
                          </ProtectedRoute>
                       }
                   />
                </Route>
                <Route path="*" element={<LoginPage/>}/>
             </Routes>
          </Router>
       </>
   )
}

export default App
