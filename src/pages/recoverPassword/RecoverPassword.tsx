import React, {useState, useEffect} from 'react';
import classes from '../../../styles/main.module.css';
import {Typography} from "@mui/material";
import {Button, Card, Form} from "react-bootstrap";
import {Link, useNavigate} from "react-router-dom";
import {useAppDispatch} from "../../redux/hooks";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";

const RecoverPassword = () => {
   const navigate = useNavigate();
   const dispatch = useAppDispatch();
   const {showToast} = toastSlice.actions;
   const [email, setEmail] = useState<string>('');
   const [formCode, setFormCode] = useState<string>('');
   const [restoreCode, setRestoreCode] = useState<string>('');
   const [newPassword, setNewPassword] = useState<string>('');
   const [newConfirmPassword, setNewConfirmPassword] = useState<string>('');
   const [isStartChangePassword, setIsStartChangePassword] = useState<boolean>(false);

   const generateFourDigits = (): string => {
      const digits: number[] = [];

      for (let i = 0; i < 4; i++) {
         const randomDigit = Math.floor(Math.random() * 10); // from 0 to 9
         digits.push(randomDigit);
      }

      return digits.join('');
   }

   const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!restoreCode) {
         const code = generateFourDigits()
         setRestoreCode(code);
         dispatch(showToast({toastMessage: code, toastType: 'info'}));
      } else {
         if (newPassword !== newConfirmPassword) {
            dispatch(showToast({toastMessage: 'Password doesn\'t match', toastType: 'danger'}));
         } else {
            dispatch(showToast({toastMessage: 'Password successfully changes', toastType: 'success'}));
            navigate('/login');
         }
      }
   }

   useEffect(() => {
      if (formCode.length !== 4) return;
      if (formCode === restoreCode) {
         setIsStartChangePassword(!!restoreCode);
      } else {
         dispatch(showToast({toastMessage: 'Wrong code', toastType: 'danger'}));
         setIsStartChangePassword(false);
      }
   }, [formCode]);

   useEffect(() => {
      console.log(isStartChangePassword)
   }, [isStartChangePassword])

   return (
       <div className={classes.wrapperLoginPage}>
          <Typography variant="h4" gutterBottom={true} style={{textAlign: 'center'}}>
             People Meet
          </Typography>
          <Card style={{boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px'}}>
             <Card.Body className='p-0 w-100'>
                <h2 className="text-center mb-4">Recover password</h2>
                <Form onSubmit={submitHandler}>
                   <Form.Group id="email" className="text-start mb-2" >
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" required disabled={isStartChangePassword} onChange={(e) => setEmail(e.target.value)}/>
                   </Form.Group>

                   {restoreCode && !isStartChangePassword &&
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
                           <Form.Control type="password" required onChange={(e) => setNewConfirmPassword(e.target.value)}/>
                       </Form.Group>
                   }

                   {!isStartChangePassword && !restoreCode &&
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
       </div>
   )
}

export default RecoverPassword;

