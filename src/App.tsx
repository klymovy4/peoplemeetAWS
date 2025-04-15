import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import './App.css';
import ProtectedRoute from "./protectedRoute/ProtectedRoute.tsx";
import Profile from "./pages/profilePage/Profile.tsx";
import LoginPage from "./pages/loginpage/LoginPage.tsx";
import SignupPage from "./pages/signupPage/SignupPage.tsx";
import Map from './pages/MapPage/Map.tsx';
import Layout from "./components/layout/Layout.tsx";
import 'leaflet/dist/leaflet.css';
import ChatDrawer from "./components/chatComponent/ChatDrawer.tsx";
import ToastComponent from "./components/toastComponent/toastComponent.tsx";

// const messageInput = document.getElementById('messageInput') as HTMLInputElement;
// const ws = new WebSocket('wss://ws.peoplemeet.com.ua');
//
// ws.onopen = () => {
//    console.log('Connected to WebSocket server');
// };
//
// ws.onmessage = (event) => {
//    console.log(`Received: ${event.data}`);
// };
//
// ws.onclose = () => {
//    console.log('Disconnected from WebSocket server');
// };
//
// ws.onerror = (error) => {
//    console.error(`WebSocket error: ${error}`);
// };

// function sendMessage() {
//    if (ws.readyState === WebSocket.OPEN) {
//       const now = new Date()
//       const message = 'test: ' + now;
//       ws.send(message);
//       console.log(`You sent: ${message}`);
//    } else {
//       console.log('Not connected to the server');
//    }
// }

function App() {
   const isAuthenticated = localStorage.getItem('accessToken');

   return (
       <Router>
          <ToastComponent/>
          <ChatDrawer/>
          <Routes>
             <Route path="/"
                    element={isAuthenticated ? <Navigate to="/profile" replace/> : <Navigate to="/login" replace/>}
             />
             <Route path="/signup" element={<SignupPage/>}/>

             <Route path="/" element={<Layout/>}>
                <Route
                    path="/profile"
                    element={
                       <ProtectedRoute>
                          <Profile/>
                       </ProtectedRoute>
                    }
                />
                <Route
                    path="/map"
                    element={
                       <ProtectedRoute>
                          <Map/>
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
