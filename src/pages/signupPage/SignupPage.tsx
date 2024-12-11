import {Card, Button, Form, Alert, Container} from "react-bootstrap";
import {Link} from "react-router-dom";
import {useRef, useState} from "react";
import {Typography} from "@mui/material";


const SignupPage = () => {
    const emailRef = useRef<any>()
    const nameRef = useRef<any>()
    const passwordRef = useRef<any>()
    const passwordConfirmRef = useRef<any>()
    const [loading, setLoading] = useState<boolean>(false);


    return (
        <Container className="col-12">
            <div style={{minWidth: '350px'}}>
                <Typography variant="h4" gutterBottom={true} style={{textAlign: 'center'}}>
                    People Meet
                </Typography>
                <Card style={{boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px'}}>
                    <Card.Body className='p-0 w-100'>
                        <h2 className="text-center mb-4">Signup</h2>

                        <Form className="">
                            <Form.Group id="email" className="text-start mb-2">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" ref={emailRef} required/>
                            </Form.Group>

                            <Form.Group id="name" className="mb-2 text-start">
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    ref={nameRef}
                                    required
                                />
                            </Form.Group>

                            <Form.Group id="password" className="mb-2 text-start">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" ref={passwordRef} required/>
                            </Form.Group>

                            <Form.Group id="password-confirm" className="mb-2 text-start">
                                <Form.Label>Password Confirmation</Form.Label>
                                <Form.Control type="password" ref={passwordConfirmRef} required/>
                            </Form.Group>

                            <Button disabled={loading} type="submit" className="w-100 mt-3">Sign up</Button>
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