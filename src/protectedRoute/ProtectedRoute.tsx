import {Navigate} from 'react-router-dom';
import React, {FC} from "react";

interface ProtectedRouteProps {
   children: React.ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({children}) => {

   const isAuthenticated = localStorage.getItem('accessToken');
   console.log('isAuthenticated', isAuthenticated);
   if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
   }

   return <>{children}</>;
};

export default ProtectedRoute;
