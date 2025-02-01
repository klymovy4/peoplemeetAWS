import React, {FormEvent} from 'react';
import {useNavigate} from "react-router-dom";
import Card from '@mui/material/Card';
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import {useEffect, useState} from "react";
import MenuItem from '@mui/material/MenuItem';
import {CardActions} from "@mui/material";
import {Button, Form} from "react-bootstrap";
import {makeStyles} from "@mui/styles";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {userSlice} from "../../redux/store/slices/userSlice";
import {debounce} from 'lodash';


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
   }
}))

const ProfileDetails = () => {
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
   const classes = useStyles();

   const {isOnline, age, sex, name, description, email} = useAppSelector(state => state.user);
   const {setUserField} = userSlice.actions;
   const [userAge, setUserAge] = useState<Array<number>>([]);

   const [values, setValues] = useState({
      name: 'auth.name',
      description,
      age: 18,
      sex,
      email,
      location: {lat: null, lng: null},
      isOnline,
   });

   const debouncedSetDescription = debounce((value: string) => {
      dispatch(setUserField({field: 'description', value}));
   }, 500);

   const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const {name, value} = event.target;

      setValues((prevValues) => ({
         ...prevValues,
         [name]: value
      }))

      if (name !== 'description') dispatch(setUserField({field: name, value}));
   }

   useEffect(() => {
      const delayInputTimeoutId = setTimeout(() => {
         debouncedSetDescription(values.description);
      }, 500);
      return () => clearTimeout(delayInputTimeoutId);
   }, [values.description, 500]);

   const handleOpen = () => {

   }

   const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      navigate('/map');
   }

   useEffect(() => {
      let age = []
      for (let i = 18; i <= 90; i++) {
         age.push(i)
      }
      setUserAge(age);
   }, [])

   return (
       <Card sx={{margin: '1rem', flex: 1, display: 'flex', flexDirection: 'column'}}>
          <Form onSubmit={handleSubmit} className="d-flex flex-column h-100">
             <CardHeader
                 subheader="The information can be edited"
                 title="Profile"
                 sx={{textAlign: 'start'}}
             />
             <Divider/>
             <CardContent>

                <Grid container spacing={1}>
                   <Grid
                       sx={{
                          mt: {xs: 2, md: 0}
                       }}

                       size={{md: 6, xs: 12}}
                   >
                      <TextField
                          // error={!!formik.errors.name && formik.touched.name}
                          fullWidth
                          label="Name"
                          name="name"
                          value={name}
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
                             label="Email Address"
                             name="email"
                             onChange={(e) => console.log(e.target.value)}
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
                          value={userAge.includes(age) ? age : ''}
                          fullWidth
                          label="Age"
                          select
                          name="age"
                          onChange={handleChange}
                          required
                          variant="outlined"
                          // error={!!formik.errors.age && formik.touched.age}
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
                          value={values.sex ? values.sex : ''}
                          variant="outlined"
                          // error={!!formik.errors.sex && formik.touched.sex}
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
                          // error={!!formik.errors.description && formik.touched.description}
                          fullWidth
                          name="description"
                          id="outlined-multiline-static"
                          label="Type something about you"
                          multiline
                          rows={4}
                          required
                          value={values.description ? values.description : ''}
                          variant="outlined"
                          onChange={handleChange}
                      />
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