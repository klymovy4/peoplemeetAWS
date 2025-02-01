import {Navigate} from 'react-router-dom';
import React, {FC} from "react";

interface ProtectedRouteProps {
   isAuthenticated: string | null;
   children: React.ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({isAuthenticated, children}) => {
   console.log('isAuthenticated', isAuthenticated);
   console.log(localStorage.getItem('accessToken'));
   if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
   }

   return <>{children}</>;
};

export default ProtectedRoute;
