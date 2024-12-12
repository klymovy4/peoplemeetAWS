import {Outlet} from "react-router-dom";
import Header from "../Header.tsx";
import classes from './Layout.module.css'

const Layout = () => {
    return (
        <div className={classes.layout}>
            <Header />
            <div className={classes.content}>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;