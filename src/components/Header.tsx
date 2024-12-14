import {IconButton, Toolbar} from "@mui/material";
import {makeStyles} from "@mui/styles";

import Typography from '@mui/material/Typography';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import MenuIcon from '@mui/icons-material/Menu';
import {FC, useState} from "react";
import {useAppDispatch, useAppSelector} from "../redux/hooks";
import {userSlice} from "../redux/store/slices/userSlice.ts";

const useStyles = makeStyles({
    root: {
        backgroundColor: 'rgba(85, 155, 147, 1)',
        color: 'white',
    }
})

// const IOSSwitch = styled((props: SwitchProps) => (
//     <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
// ))(({ theme }) => ({
//     width: 42,
//     height: 26,
//     padding: 0,
//     '& .MuiSwitch-switchBase': {
//         padding: 0,
//         margin: 2,
//         transitionDuration: '300ms',
//         '&.Mui-checked': {
//             transform: 'translateX(16px)',
//             color: '#purpure',
//             '& + .MuiSwitch-track': {
//                 backgroundColor: '#65C466',
//                 opacity: 1,
//                 border: 0,
//                 ...theme.applyStyles('dark', {
//                     backgroundColor: '#2ECA45',
//                 }),
//             },
//             '&.Mui-disabled + .MuiSwitch-track': {
//                 opacity: 0.5,
//             },
//         },
//         '&.Mui-focusVisible .MuiSwitch-thumb': {
//             color: '#33cf4d',
//             border: '6px solid #fff',
//         },
//         '&.Mui-disabled .MuiSwitch-thumb': {
//             color: theme.palette.grey[100],
//             ...theme.applyStyles('dark', {
//                 color: theme.palette.grey[600],
//             }),
//         },
//         '&.Mui-disabled + .MuiSwitch-track': {
//             opacity: 0.7,
//             ...theme.applyStyles('dark', {
//                 opacity: 0.3,
//             }),
//         },
//     },
//     '& .MuiSwitch-thumb': {
//         boxSizing: 'border-box',
//         width: 22,
//         height: 22,
//     },
//     '& .MuiSwitch-track': {
//         borderRadius: 26 / 2,
//         backgroundColor: '#E9E9EA',
//         opacity: 1,
//         transition: theme.transitions.create(['background-color'], {
//             duration: 500,
//         }),
//         ...theme.applyStyles('dark', {
//             backgroundColor: '#39393D',
//         }),
//     },
// }));
interface IProps {
    setDrawerState: (flag: boolean) => void;
}

const Header: FC<IProps> = ({setDrawerState}) => {
    const classes = useStyles();
    const dispatch = useAppDispatch();
    const {isOnline} = useAppSelector(state => state.user);
    const {toggleIsOnline} = userSlice.actions;

    const handleDrawerOpen = () => {
        setDrawerState(true);
    };

    return (
        <Toolbar className={classes.root}>
            <IconButton
                onClick={handleDrawerOpen}
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{mr: 2}}
            >
                <MenuIcon/>
            </IconButton>
            <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                People Meet
            </Typography>
            <FormGroup>
                <FormControlLabel
                    label={isOnline ? 'Online' : 'Offline'}
                    labelPlacement="start"
                    className='switcher'
                    control={
                        <Switch
                            style={{margin: 0}}
                            checked={isOnline}
                            onChange={() => dispatch(toggleIsOnline())}
                            name="isonline"
                            sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: "rgba(39, 203, 202, 0.96)", // Цвет бегунка
                                },
                                "& .MuiSwitch-switchBase": {
                                    color: "rgba(209, 171, 225, 1)", // Цвет бегунка
                                },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                    backgroundColor: "#3ebaa4f5", // Цвет дорожки, когда включено
                                },
                                ".MuiSwitch-track": {
                                    backgroundColor: "#111", // Цвет дорожки, когда включено
                                },
                                "& .MuiSwitch-track": {
                                    backgroundColor: "rgba(62, 186,164, 0.96)", // Цвет дорожки, когда выключено
                                },
                            }}
                        />
                    }

                />
            </FormGroup>
            {/*<FormControlLabel*/}
            {/*    control={<IOSSwitch sx={{ m: 1 }} defaultChecked />}*/}
            {/*    label="iOS style"*/}
            {/*/>*/}

        </Toolbar>
    );
};

export default Header;