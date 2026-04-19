import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchDashboardData } from '../services/api';

// Create internal Context map
const DashboardContext = createContext();

// Create custom access Hook
export const useDashboardContext = () => {
    return useContext(DashboardContext);
};

// Global Provider Wrapper
export const DashboardProvider = ({ children, userId = "user-123" }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [isDashboardLoading, setDashboardLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Global refresh trigger command
    const triggerDashboardRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        
        const loadContextData = async () => {
            setDashboardLoading(true);
            try {
                const res = await fetchDashboardData(userId);
                if (isMounted && res.data) {
                    setDashboardData(res.data);
                }
            } catch (err) {
                console.error("Failed to load global dashboard data from API", err);
            } finally {
                if (isMounted) {
                    setDashboardLoading(false);
                }
            }
        };

        loadContextData();

        return () => { isMounted = false; };
    }, [refreshKey, userId]);

    return (
        <DashboardContext.Provider value={{ dashboardData, isDashboardLoading, triggerDashboardRefresh }}>
            {children}
        </DashboardContext.Provider>
    );
};
