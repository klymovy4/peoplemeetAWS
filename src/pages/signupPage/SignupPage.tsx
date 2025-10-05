import {Card, Button, Form, Container} from "react-bootstrap";
import classes from '../../../styles/main.module.css';
import {useNavigate} from "react-router-dom";
import {Link} from "react-router-dom";
import {useState} from "react";
import {Typography} from "@mui/material";
import {signUpUser} from "../../api/tempApi/userApi.ts";
import {useAppDispatch} from "../../redux/hooks";
import {showToast} from "../../utils/toast.ts";

const SignupPage = () => {
   const navigate = useNavigate();
   const dispatch = useAppDispatch();
   const [email, setEmail] = useState<string>('');
   const [password, setPassword] = useState<string>('');
   const [confirmPassword, setConfirmPassword] = useState<string>('');

   const submitHandler = async (e: any) => {
      e.preventDefault();
      const data = {
         email: email,
         password: password
      };

      if (password !== confirmPassword) {
         showToast({toastMessage: 'Passwords do not match', toastType: "error"});
         return;
      }

      const response = await signUpUser(data);
      if (response.status === 'success') {
         localStorage.setItem('accessToken', response.data.token);
         navigate('/profile');
         showToast({toastMessage: response?.data?.message, toastType: "success"});
      } else {
         showToast({toastMessage: response?.data?.message, toastType: "error"});
      }
   }

   return (
       <div className={classes.wrapperLoginPage}>
          <Typography variant="h4" gutterBottom={true} style={{textAlign: 'center'}}>
             People Meet
          </Typography>
          <Card style={{boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px'}}>
             <Card.Body className='p-0 w-100'>
                <h4 className="text-center mb-4">Signup</h4>

                <Form onSubmit={submitHandler}>
                   <Form.Group id="email" className="text-start mb-2">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" required onChange={(e) => setEmail(e.target.value)}/>
                   </Form.Group>

                   <Form.Group id="password" className="mb-2 text-start">
                      <Form.Label>Password</Form.Label>
                      <Form.Control type="password" required onChange={(e) => setPassword(e.target.value)}/>
                   </Form.Group>

                   <Form.Group id="password-confirm" className="mb-2 text-start">
                      <Form.Label>Password Confirmation</Form.Label>
                      <Form.Control type="password" required onChange={(e) => setConfirmPassword(e.target.value)}/>
                   </Form.Group>

                   <Button
                       style={{backgroundColor: 'rgba(62, 186,164, 0.96)', border: 'none', color: 'white'}}
                       type="submit" className="w-100 mt-3">Sign up</Button>
                </Form>
             </Card.Body>
          </Card>
          <div className="w-100 text-center mt-2">
             Or <Link
              style={{color: 'rgba(62, 186,164, 0.96)'}}
              to='/login'>Sign In</Link>
          </div>
       </div>
   )
}

export default SignupPage;