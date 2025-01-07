import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';
import './index.css';
import 'bootstrap/dist/css/bootstrap.css';
import store from './redux/store';
import App from './App.tsx';
import { createTheme, ThemeProvider } from '@mui/material/styles';
const theme = createTheme({
   components: {
      MuiCardContent: {
         styleOverrides: {
            root: {
               padding: '0.5rem',
               // backgroundColor: '#f8f9fa',
            },
         },
      },
      // MuiDrawer: {
      //    styleOverrides: {
      //       root: {
      //          '&.bottomDrawer': {
      //             backgroundColor: 'blue',
      //          },
      //       },
      //    },
      // },
   },
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
       <ThemeProvider theme={theme}>
          <Provider store={store}>
             <App/>
          </Provider>
       </ThemeProvider>

    </StrictMode>,
)
