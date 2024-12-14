import {Outlet, useNavigate} from "react-router-dom";
import Header from "../Header.tsx";
import classes from './Layout.module.css'
import {useState} from "react";
import {Box, Drawer, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import {makeStyles} from "@mui/styles";
import List from '@mui/material/List';
import PersonIcon from '@mui/icons-material/Person';
import MailIcon from '@mui/icons-material/Mail';
import RoomIcon from '@mui/icons-material/Room';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import SmsFailedIcon from '@mui/icons-material/SmsFailed';
// import defaultAvatar from "../../assets/avatars/avatar.jpg";
import defaultAvatar from "../../assets/avatars/Sss.png";


const useStyles = makeStyles(() => ({
    drawerWrapper: {
        width: '250px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    },
    drawerHeader: {
        height: '200px!important',
        display: 'flex',
        alignItems: 'flex-start',
        padding: '10px 0',
        // ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    },
    userName: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translate(-50%)',
        color: 'white'
    },
    feedback: {
        marginTop: 'auto'
    },
    icons: {}
}))

const Layout = () => {
    const navigate = useNavigate();
    const cls = useStyles();
    const [drawerState, setDrawerState] = useState<boolean>(false);
    const [name, setName] = useState<string>('Ro..');
    const [avatar, setAvatar] = useState<any>('')
    const toggleDrawer = (open: boolean) => () => {
        setDrawerState(open);
    };

    return (
        <div className={classes.layout}>
            <Header setDrawerState={setDrawerState}/>
            <Drawer
                anchor="left"
                open={drawerState}
                onClose={toggleDrawer(false)}
            >
                <Box className={cls.drawerWrapper} onClick={toggleDrawer(false)}>
                    <Box className={cls.drawerHeader}
                         style={{
                             position: 'relative',
                             backgroundImage: `url(${avatar ? avatar : defaultAvatar})`,
                             backgroundRepeat: 'no-repeat',
                             backgroundPosition: 'center center',
                             backgroundSize: 'cover',
                             minHeight: '220px'
                         }}
                    >
                        <Typography variant="h4" align='center' className={cls.userName}>
                            {name}
                        </Typography>
                    </Box>
                    <List>
                        <ListItemButton onClick={() => navigate('/map')}>
                            <ListItemIcon>
                                <RoomIcon/>
                            </ListItemIcon>
                            <ListItemText primary={'Map'}/>
                        </ListItemButton>

                        <ListItemButton onClick={() => navigate('/chat')}>
                            <ListItemIcon>
                                <MailIcon/>
                            </ListItemIcon>
                            <ListItemText primary={'Messages'}/>
                        </ListItemButton>

                        <Divider/>

                        <ListItemButton onClick={() => navigate('/profile')}>
                            <ListItemIcon>
                                <PersonIcon/>
                            </ListItemIcon>
                            <ListItemText primary={'My account'}/>
                        </ListItemButton>
                    </List>

                    <List sx={{marginTop: 'auto'}}>
                        <Divider/>

                        <ListItemButton onClick={() => console.log('logoutuid)')}>
                            <ListItemIcon>
                                <LogoutIcon/>
                            </ListItemIcon>
                            <ListItemText primary={'Logout'}/>
                        </ListItemButton>


                        <ListItemButton onClick={() => console.log('logoutuid)')}>
                            <ListItemIcon>
                                <SmsFailedIcon/>
                            </ListItemIcon>
                            <ListItemText primary={'v: v0.0.2'}/>
                        </ListItemButton>
                    </List>
                </Box>
            </Drawer>

            <div className={classes.content}>
                <Outlet/>
            </div>
        </div>
    );
};

export default Layout;