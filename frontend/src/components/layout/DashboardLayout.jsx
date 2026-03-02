import { useState } from 'react';
import TopNavbar from './TopNavbar';

const DashboardLayout = ({ children, navGroups }) => {
    return (
        <div className="dashboard-layout-top">
            <TopNavbar navGroups={navGroups} />

            <div className="main-content-top">
                <div className="content-wrapper">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
