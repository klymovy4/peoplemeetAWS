import React, {useRef, useState} from 'react'
import classes from '../../../styles/main.module.css';
import {Card, Button, Form, Container} from "react-bootstrap";
import {Link, useNavigate} from "react-router-dom";
import {Typography} from "@mui/material";
import {useAppDispatch} from "../../redux/hooks";
import {userSlice} from "../../redux/store/slices/userSlice.ts";
import {useLoginMutation} from "../../api/UserApi.ts";
import {getUser} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";

const Login = () => {
   const navigate = useNavigate();
   const {showToast} = toastSlice.actions;
   // const [loginUser, {isLoading, isError, error}] = useLoginMutation();
   const dispatch = useAppDispatch();
   const {setName, login} = userSlice.actions;
   const emailRef = useRef<any>();
   const passwordRef = useRef<any>();
   const [loading, setLoading] = useState<boolean>(false);
   const [email, setEmail] = useState<string>('');
   const [password, setPassword] = useState<string>('');

   const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const data = {
         email: email,
         password: password
      };

      const response  = await getUser(data)

      if (response.status === 'success') {
         localStorage.setItem('accessToken', response.data.token);
         dispatch(setName(email));
         dispatch(login());
         dispatch(showToast({toastMessage: 'Logged successfully', toastType: 'success'}));
         console.log('go to /profile')
         navigate('/profile');
      } else {
         dispatch(showToast({toastMessage: 'Something went wrong', toastType: 'error'}));
      }
   }

   return (
       <Container className={`w-100 ${classes.wrapperLoginPage}`}>
          <div>
             <Typography variant="h4" gutterBottom={true} style={{textAlign: 'center'}}>
                People Meet
             </Typography>
             <Card style={{boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px'}}>
                <Card.Body className='p-0'>
                   <h2 className="text-center mb-4">Log In</h2>

                   <Form onSubmit={submitHandler}>
                      <Form.Group id="email" className="text-start mb-2">
                         <Form.Label>Email</Form.Label>
                         <Form.Control type="email" ref={emailRef} onChange={(e) => setEmail(e.target.value)}
                                       required/>
                      </Form.Group>

                      <Form.Group id="password" className="text-start mb-2">
                         <Form.Label>Password</Form.Label>
                         <Form.Control type="password" ref={passwordRef}
                                       onChange={(e) => setPassword(e.target.value)} required/>
                      </Form.Group>

                      <Button disabled={loading} type="submit" className="w-100 mt-3">Log in</Button>
                   </Form>
                   <div className="w-100 text-center mt-3">
                      <Link to='/forgot-password'>Forgot Password</Link>
                   </div>
                </Card.Body>
             </Card>
             <div className="w-100 text-center mt-2">
                Or <Link to="/signup">Sign Up</Link>
             </div>

          </div>
       </Container>
   );
}

export default Login
