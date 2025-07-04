import React, {FormEvent, useState, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import Card from '@mui/material/Card';
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import {CardActions} from "@mui/material";
import {Button, Form} from "react-bootstrap";
import {makeStyles} from "@mui/styles";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {userSlice} from "../../redux/store/slices/userSlice";
import {editProfile, sendThoughts} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";

const useStyles = makeStyles(() => ({
   avatar: {
      // height: 200,
      // width: 200
   },
   center: {
      textAlign: 'center'
   },
   activeButtons: {
      width: '100%',
      background: 'rgba(85, 155, 147, 1)',
      color: 'white',
      transition: 'background 0.3s ease',
      '&:hover': {
         background: 'rgba(70, 140, 130, 1)',
         color: 'white'
      }
   },
}))

const ProfileDetails = () => {
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
   const {showToast} = toastSlice.actions;
   const {setUserName, setUserField} = userSlice.actions;
   const classes = useStyles();
   const user = useAppSelector(state => state.user);
   const [userAge, setUserAge] = useState<Array<number>>([]);

   const [values, setValues] = useState({
      name: '',
      description: '',
      age: 18,
      sex: '',
      email: '',
      thoughts: ''
   });

   useEffect(() => {
      if (user.name === values.name) {
         return;
      }
      setValues({
         name: user.name,
         description: user.description,
         age: user.age,
         sex: user.sex,
         email: user.email,
         thoughts: user.thoughts,
      })
   }, [user]);

   const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const {name, value} = event.target;

      setValues((prevValues) => ({
         ...prevValues,
         [name]: value
      }))

      if (name === 'name') {
         dispatch(setUserName(value));
      }
   }

   const handleOpen = () => {
   }

   const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();

      const data = {
         age: values.age,
         name: values.name,
         sex: values.sex,
         description: values.description,
         thoughts: values.thoughts,
         email: values.email,
         token: localStorage.getItem('accessToken')
      }
      const response = await editProfile(data);

      if (response.status === 'success') {
         dispatch(setUserField({field: 'name', value: values.name}));
         dispatch(setUserField({field: 'email', value: values.email}));
         dispatch(setUserField({field: 'age', value: values.age}));
         dispatch(setUserField({field: 'sex', value: values.sex}));
         dispatch(setUserField({field: 'description', value: values.description}));
         dispatch(setUserField({field: 'thoughts', value: values.thoughts}));

         navigate('/map');
         dispatch(showToast({toastMessage: response?.data?.message, toastType: 'success'}));
      } else {
         dispatch(showToast({toastMessage: response?.data?.message ?? 'Something went wrong', toastType: 'danger'}));
      }
   }

   useEffect(() => {
      let age = []
      for (let i = 18; i <= 90; i++) {
         age.push(i)
      }
      setUserAge(age);
   }, [])

   const handleChangeThoughts = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target.value;
      const token = localStorage.getItem('accessToken');
      if (target.length > 5 && token) {
         const response = await sendThoughts(token, target);
         if (response.status === 'success') {
            console.log('Thoughts has been changed');
         } else {
            dispatch(showToast({toastMessage: response.data.message, toastType: 'danger'}));
         }
      }
   }

   return (
       <Card sx={{margin: '1rem', flex: 1, display: 'flex', flexDirection: 'column'}}>
          <Form onSubmit={handleSubmit} className="d-flex flex-column h-100">

             <CardHeader
                 title="Profile"
                 sx={{textAlign: 'start', padding: '0.5rem 0.5rem 0'}}
             />
            {/*<Typography variant="h4" color="textSecondary" component="div" sx={{textAlign: 'start'}}>Profile</Typography>*/}



             <CardContent>
                <Grid
                    sx={{
                       textAlign: 'start',
                       mb: 2
                    }}
                    // size={{md: 6, xs: 12}}
                >
                   {/*<TextField*/}
                   {/*    id="input-with-icon-textfield"*/}
                   {/*    label="TextField"*/}

                   {/*    variant="standard"*/}
                   {/*/>*/}
                   <TextField
                       fullWidth
                       size="small"
                       name="thoughts"
                       label="Your thoughts"
                       slotProps={{ htmlInput: { maxLength: 50 } }}
                       rows={1}
                       value={values.thoughts}
                       onChange={handleChange}
                   />
                </Grid>
                <Divider/>
                <Grid container spacing={1}>
                   <Grid
                       sx={{
                          mt: {xs: 2, md: 0}
                       }}

                       size={{md: 6, xs: 12}}
                   >
                      <TextField
                          fullWidth
                          label="Name"
                          name="name"
                          value={values.name}
                          slotProps={{ htmlInput: { maxLength: 20 } }}
                          onChange={handleChange}
                          required
                          variant="outlined">
                      </TextField>
                   </Grid>

                   <Grid
                       sx={{
                          mt: {xs: 2, md: 0}
                       }}

                       size={{md: 6, xs: 12}}
                   >
                      <Tooltip title='Click on change email?'>
                         <TextField
                             // className={classes.changeEmail}
                             fullWidth
                             // label="Email Address"
                             name="email"
                             value={values.email}
                             variant="outlined"
                             disabled
                             onClick={handleOpen}
                         />
                      </Tooltip>
                   </Grid>

                   <Grid
                       sx={{
                          textAlign: 'start',
                          mt: 2
                       }}
                       size={{md: 6, xs: 12}}
                   >
                      <TextField
                          value={userAge.includes(values.age) ? values.age : ''}
                          fullWidth
                          label="Age"
                          select
                          name="age"
                          onChange={handleChange}
                          required
                          variant="outlined"
                      >
                         {userAge.map((option) => (
                             <MenuItem key={option} value={option}>
                                {option}
                             </MenuItem>
                         ))}
                      </TextField>
                   </Grid>

                   <Grid
                       sx={{
                          textAlign: 'start',
                          mt: 2
                       }}
                       size={{md: 6, xs: 12}}
                   >
                      <TextField
                          fullWidth
                          select
                          label="Sex"
                          name="sex"
                          required
                          onChange={handleChange}
                          value={values.sex}
                          variant="outlined"
                      >
                         {['female', 'male'].map(sex => {
                            return (
                                <MenuItem key={sex} value={sex}>
                                   {sex}
                                </MenuItem>
                            )
                         })}
                      </TextField>
                   </Grid>

                   <Grid
                       sx={{
                          textAlign: 'start',
                          mt: 2
                       }}
                       size={{xs: 12}}
                   >
                      <TextField
                          fullWidth
                          name="description"
                          id="outlined-multiline-static"
                          label="Type something about you"
                          slotProps={{ htmlInput: { maxLength: 121 } }}
                          multiline
                          rows={4}
                          required
                          value={values.description}
                          variant="outlined"
                          onChange={handleChange}
                      />
                   </Grid>
                   <Grid
                       sx={{
                          textAlign: 'start',
                          mt: 2
                       }}
                       size={{xs: 12}}
                   >

                   </Grid>
                </Grid>
             </CardContent>

             <Box sx={{marginTop: 'auto'}}>
                <Divider/>

                <CardActions>
                   <Button
                       type={'submit'}
                       className={classes.activeButtons}
                       variant="contained"
                   >
                      Save details
                   </Button>

                </CardActions>
             </Box>
          </Form>
       </Card>
   )
}

export default ProfileDetails;
