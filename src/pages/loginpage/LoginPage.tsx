import React, {useState} from 'react'
import classes from '../../../styles/main.module.css';
import {Card, Button, Form} from "react-bootstrap";
import {Link, useNavigate} from "react-router-dom";
import {Typography} from "@mui/material";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {userSlice} from "../../redux/store/slices/userSlice.ts";
import {loginUser, getSelf, getOnline} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";
import defAvtar from '../../assets/avatars/avatar.jpg'

const Login = () => {
   const baseUrl = import.meta.env.VITE_API_URL;
   const navigate = useNavigate();
   const {showToast} = toastSlice.actions;

   const dispatch = useAppDispatch();
   const {email: u} = useAppSelector(state => state.user);
   const {setUser, setUserEmail} = userSlice.actions;
   const [email, setEmail] = useState<string>(u ?? '');
   const [password, setPassword] = useState<string>('');

   const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const data = {
         email: email,
         password: password
      };

      const response = await loginUser(data);

      if (response.status === 'success') {
         localStorage.setItem('accessToken', response.data.token);
         dispatch(showToast({toastMessage: response?.data?.message, toastType: 'success'}));

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
         console.log(response);
         dispatch(showToast({toastMessage: response?.data?.message ?? 'Something went wrong', toastType: 'danger'}));
      }
   }

   const handleSelf = async (token: string) => {
      const self = await getSelf(token);
      console.log('self', self);
      if (self.status === 'success') {
         const {name, email, description, age, sex, image, is_online, lng, lat, id, thoughts} = self.data;
         dispatch(setUser({
            id,
            name,
            description,
            age,
            sex,
            image: image ? `${baseUrl}/uploads/${image}` : defAvtar,
            isOnline: is_online === 1,
            lat,
            lng,
            email,
            thoughts
         }));
      }
   }

   return (
       <div className={classes.wrapperLoginPage}>
          <Typography variant="h4" gutterBottom={true} style={{textAlign: 'center'}}>
             People Meet
          </Typography>
          <Card style={{boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px'}}>
             <Card.Body className='p-0'>
                <h4 className="text-center mb-4">Log In</h4>

                <Form onSubmit={submitHandler}>
                   <Form.Group id="email" className="text-start mb-2">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email"
                                    value={email}
                                    onChange={(e) => {
                         setEmail(e.target.value);
                         dispatch(setUserEmail(e.target.value));
                      }}
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
   );
}

export default Login
