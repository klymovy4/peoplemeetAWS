import React, {useState, useEffect} from 'react';
import classes from '../../../styles/main.module.css';
import {Typography} from "@mui/material";
import {Button, Card, Form} from "react-bootstrap";
import {Link, useNavigate} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {userSlice} from "../../redux/store/slices/userSlice.ts";
import {changePassword, checkRecoveryCode, getRecoverCode} from "../../api/tempApi/userApi.ts";
import {showToast} from "../../utils/toast.ts";

const RecoverPassword = () => {
   const navigate = useNavigate();
   const dispatch = useAppDispatch();
   const {email: tapedEmail} = useAppSelector(state => state.user);
   const {setUserEmail} = userSlice.actions;

   const [email, setEmail] = useState<string>(tapedEmail || '');
   const [formCode, setFormCode] = useState<string>('');
   const [isRestoreCode, setIsRestoreCode] = useState<boolean>(false);
   const [recoveryCode, setRecoveryCode] = useState<string>('');
   const [newPassword, setNewPassword] = useState<string>('');
   const [newConfirmPassword, setNewConfirmPassword] = useState<string>('');
   const [isStartChangePassword, setIsStartChangePassword] = useState<boolean>(false);

   const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!isRestoreCode) {
         const response = await getRecoverCode(email);
         if (response.status === 'success') {
            setIsRestoreCode(true);
            showToast({toastMessage: 'Check your email. Also check spam folder. It could take few minutes', toastType: 'info'});
         } else {
            showToast({toastMessage: response.data.message, toastType: 'error'});
         }
      } else {
         if (newPassword !== newConfirmPassword) {
            showToast({toastMessage: 'Password doesn\'t match', toastType: 'error'});
         } else {
            const response = await changePassword(email, recoveryCode, newPassword);
            if (response.status === 'success') {
               showToast({toastMessage: 'Password successfully changed', toastType: 'success'});
               navigate('/login');
            } else {
               showToast({toastMessage: response.data.message, toastType: 'error'});
            }
         }
      }
   }

   useEffect(() => {
      if (formCode.length !== 4) return;

      const sendCode = async () => {
         const response = await checkRecoveryCode(email, formCode);
         if (response.status === 'success') {
            setRecoveryCode(formCode);
            setIsStartChangePassword(true);
         } else {
            showToast({toastMessage: response.data.message, toastType: 'error'});
            setRecoveryCode('');
            setIsStartChangePassword(false);
         }
      }

      sendCode();
   }, [formCode]);

   return (
       <div className={classes.wrapperLoginPage}>
          <Typography variant="h4" gutterBottom={true} style={{textAlign: 'center'}}>
             People Meet
          </Typography>
          <Card style={{boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px'}}>
             <Card.Body className='p-0 w-100'>
                <h4 className="text-center mb-4">Recover password</h4>
                <Form onSubmit={submitHandler}>
                   <Form.Group id="email" className="text-start mb-2">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" required disabled={isStartChangePassword}
                                    value={email}
                                    onChange={(e) => {
                                       dispatch(setUserEmail(e.target.value));
                                       setEmail(e.target.value);
                                    }}/>
                   </Form.Group>

                   {isRestoreCode && !isStartChangePassword &&
                       <Form.Group id="code" className="mb-2 text-start">
                           <Form.Label>Code</Form.Label>
                           <Form.Control type="text" required onChange={(e) => setFormCode(e.target.value)}/>
                       </Form.Group>
                   }

                   {isStartChangePassword &&
                       <Form.Group id="password" className="mb-2 text-start">
                           <Form.Label>New password</Form.Label>
                           <Form.Control type="password" required onChange={(e) => setNewPassword(e.target.value)}/>
                       </Form.Group>
                   }

                   {isStartChangePassword &&
                       <Form.Group id="password-confirm" className="mb-2 text-start">
                           <Form.Label>New password confirmation</Form.Label>
                           <Form.Control type="password" required
                                         onChange={(e) => setNewConfirmPassword(e.target.value)}/>
                       </Form.Group>
                   }

                   {!isStartChangePassword && !isRestoreCode &&
                       <Button
                           style={{backgroundColor: 'rgba(62, 186,164, 0.96)', border: 'none', color: 'white'}}
                           type="submit"
                           className="w-100 mt-3"
                       >
                           Send code
                       </Button>
                   }

                   {isStartChangePassword &&
                       <Button
                           style={{backgroundColor: 'rgba(62, 186,164, 0.96)', border: 'none', color: 'white'}}
                           type="submit"
                           className="w-100 mt-3"
                       >
                           Reset password
                       </Button>
                   }
                </Form>
             </Card.Body>
          </Card>
          <div className="w-100 text-center mt-2">
             Or <Link
              style={{color: 'rgba(62, 186,164, 0.96)'}}
              to="/login">Log in</Link>
          </div>
       </div>
   )
}

export default RecoverPassword;

