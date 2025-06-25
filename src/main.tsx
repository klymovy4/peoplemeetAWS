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
      // MuiTextField: {
      //    styleOverrides: {
      //       root: {
      //          '--TextField-brandBorderColor': '#E0E3E7',
      //          '--TextField-brandBorderHoverColor': '#B2BAC2',
      //          '--TextField-brandBorderFocusedColor': '#559b93',
      //          '& label.Mui-focused': {
      //             color: 'var(--TextField-brandBorderFocusedColor)',
      //          },
      //       },
      //    },
      // },
      MuiTextField: {
         styleOverrides: {
            root: {
               // boxShadow: '0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12)',
               borderRadius: '8px',
            },
         },
      },
      MuiOutlinedInput: {
         styleOverrides: {
            root: {
               '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#559b93',
               },
               '&.Mui-focused fieldset': {
                  // borderColor: '#559b93',
               },
            },
         },
      },
      MuiInputLabel: {
         styleOverrides: {
            root: {
               '&.Mui-focused': {
                  color: '#559b93',
               },
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
