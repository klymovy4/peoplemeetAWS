import {Outlet} from "react-router-dom";
import Header from "../Header.tsx";
import classes from './Layout.module.css'
import SideBar from "../sideBar/SideBar.tsx";

const Layout = () => {
    return (
        <div className={classes.layout}>
            <Header/>
            <SideBar/>
            <div className={classes.content}>
                <Outlet/>
            </div>
        </div>
    );
};

export default Layout;