import { Card, Button, Form, Alert, Container } from "react-bootstrap";
import classes from '../../../styles/main.module.css';
import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { Typography } from "@mui/material";


const SignupPage = () => {
    const emailRef = useRef<any>();
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const passwordRef = useRef<any>()
    const passwordConfirmRef = useRef<any>()
    const [loading, setLoading] = useState<boolean>(false);
    console.log(password)

    const submitHandler = (e: any) => {
        e.preventDefault();
        const data = {
            email: email, // Replace with the actual email
            password: password        // Replace with the actual password
        };

        console.log(data)

        fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json(); // Assuming the server responds with JSON
            })
            .then(data => {
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        return false;
    }

    return (
        <Container className={classes.wrapperLoginPage}>
            <div>
                <Typography variant="h4" gutterBottom={true} style={{ textAlign: 'center' }}>
                    People Meet
                </Typography>
                <Card style={{ boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px' }}>
                    <Card.Body className='p-0 w-100'>
                        <h2 className="text-center mb-4">Signup</h2>

                        <Form  className="" >
                            <Form.Group id="email" className="text-start mb-2">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" ref={emailRef} required onChange={(e) => setEmail(e.target.value)} />
                            </Form.Group>

                            <Form.Group id="password" className="mb-2 text-start">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" ref={passwordRef} required onChange={(e) => setPassword(e.target.value)} />
                            </Form.Group>

                            <Form.Group id="password-confirm" className="mb-2 text-start">
                                <Form.Label>Password Confirmation</Form.Label>
                                <Form.Control type="password" ref={passwordConfirmRef} required />
                            </Form.Group>

                            <Button disabled={loading} type="submit" className="w-100 mt-3" onClick={submitHandler}>Sign up</Button>
                        </Form>
                    </Card.Body>
                </Card>
                <div className="w-100 text-center mt-2">
                    Or <Link to='/login'>Sign In</Link>
                </div>

            </div>


        </Container>
    )
}

export default SignupPage;