import {useRef, useState} from 'react'
import {Card, Button, Form, Container} from "react-bootstrap";

import {Link} from "react-router-dom";

import {Typography} from "@mui/material";

export function Login() {
    const emailRef = useRef<any>();
    const passwordRef = useRef<any>();
    const [loading, setLoading] = useState<boolean>(false);

    return (
        <Container

        >
            <div className="w-100" style={{minWidth: '350px'}}>
                <Typography variant="h4" gutterBottom={true} style={{textAlign: 'center'}}>
                    People Meet
                </Typography>
                <Card style={{boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px'}}>
                    <Card.Body className='p-0'>
                        <h2 className="text-center mb-4">Log In</h2>

                        <Form>
                            <Form.Group id="email" className="text-start mb-2">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" ref={emailRef} required/>
                            </Form.Group>

                            <Form.Group id="password" className="text-start mb-2">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" ref={passwordRef} required/>
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
