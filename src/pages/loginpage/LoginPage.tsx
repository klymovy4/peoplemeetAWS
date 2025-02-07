import React, {useState} from 'react'
import classes from '../../../styles/main.module.css';
import {Card, Button, Form, Container} from "react-bootstrap";
import {Link, useNavigate} from "react-router-dom";
import {Typography} from "@mui/material";
import {useAppDispatch} from "../../redux/hooks";
import {userSlice} from "../../redux/store/slices/userSlice.ts";
import {loginUser, getSelf, getOnline} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";
import defAvtar from '../../assets/avatars/avatar.jpg'

const Login = () => {
   const navigate = useNavigate();
   const {showToast} = toastSlice.actions;
   // const [loginUser, {isLoading, isError, error}] = useLoginMutation();
   const dispatch = useAppDispatch();
   const {setUser} = userSlice.actions;
   const [email, setEmail] = useState<string>('');
   const [password, setPassword] = useState<string>('');

   const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const data = {
         email: email,
         password: password
      };

      const response  = await loginUser(data);

      if (response.status === 'success') {
         localStorage.setItem('accessToken', response.data.token);
         // dispatch(setUserEmail(email));
         dispatch(showToast({toastMessage: response.data.message, toastType: 'success'}));

         const data = {
            token: response.data.token,
            is_online: 0,
            lat: null,
            lng: null
         }
         navigate('/profile');
         await getOnline(data);
         handleSelf(response.data.token).catch(console.error);
      } else {
         dispatch(showToast({toastMessage: response.data.message, toastType: 'danger'}));
      }
   }

   const handleSelf = async (token: string) => {
      const self = await getSelf(token);
      console.log('self', self);
      if (self.status === 'success') {
         const {name, description, age, sex, image, is_online, lng, lat} = self.data;
         dispatch(setUser({
            name,
            description,
            age,
            sex,
            image: image ? `/uploads/${image}` : defAvtar,
            isOnline: is_online === 1,
            lat,
            lng
         }));
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
                         <Form.Control type="email" onChange={(e) => setEmail(e.target.value)}
                                       required/>
                      </Form.Group>

                      <Form.Group id="password" className="text-start mb-2">
                         <Form.Label>Password</Form.Label>
                         <Form.Control type="password"
                                       onChange={(e) => setPassword(e.target.value)} required/>
                      </Form.Group>

                      <Button
                          style={{backgroundColor: 'rgba(62, 186,164, 0.96)', border: 'none', color: 'white'}}
                          type="submit" className="w-100 mt-3">Log in</Button>
                   </Form>
                   <div className="w-100 text-center mt-3">
                      <Link
                          style={{color: 'rgba(62, 186,164, 0.96)'}}
                          to='/forgot-password'>Forgot Password</Link>
                   </div>
                </Card.Body>
             </Card>
             <div className="w-100 text-center mt-2">
                Or <Link
                 style={{color: 'rgba(62, 186,164, 0.96)'}}
                 to="/signup">Sign Up</Link>
             </div>

          </div>
       </Container>
   );
}

export default Login
