import React from 'react';
import { X, CalendarDays } from 'lucide-react';
import './CalendarModal.css';

const CalendarModal = ({ isOpen, onClose, upcomingDates }) => {
    if (!isOpen) return null;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); 
    
    // Calculate mathematically exact calendar grid
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOffset = new Date(currentYear, currentMonth, 1).getDay();

    const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Helper mathematical parser to read strings like "Oct 14" or "Sep 28 - Oct 2"
    const parsePredictedDays = (dateStr) => {
        if (!dateStr) return [];
        const matches = dateStr.match(/\d+/g);
        if (!matches) return [];
        
        let days = matches.map(m => parseInt(m, 10));
        
        if (dateStr.includes('-') && days.length === 2) {
            let range = [];
            let current = days[0];
            while (current !== days[1]) {
                range.push(current);
                current++;
                if (current > daysInMonth) current = 1; 
            }
            range.push(days[1]);
            return range;
        }
        return days;
    };

    const periodStart = parsePredictedDays(upcomingDates?.nextPeriod)[0] || null;
    const fertileDays = parsePredictedDays(upcomingDates?.fertileWindow);

    return (
        <div className="calendar-backdrop">
            <div className="calendar-card">
                <div className="calendar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarDays color="#e040a0" />
                        <h2>Upcoming Cycle</h2>
                    </div>
                    <button className="calendar-close" onClick={onClose} title="Close Calendar">
                        <X size={20} />
                    </button>
                </div>

                <div className="month-label">{monthLabel}</div>

                <div className="calendar-grid-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="calendar-day-name">{d}</div>
                    ))}
                </div>

                <div className="calendar-grid">
                    {/* Render blank pad slots to push grid */}
                    {Array.from({ length: firstDayOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-day empty"></div>
                    ))}
                    
                    {/* Render actual 31 days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        let classNames = "calendar-day";
                        
                        // We will highlight 5 days of a period starting on the parsed NextPeriod integer
                        const isPeriod = periodStart && day >= periodStart && day <= (periodStart + 4);
                        const isFertile = fertileDays.includes(day);

                        if (isPeriod) classNames += " day-period";
                        else if (isFertile) classNames += " day-fertile";

                        return (
                            <div key={day} className={classNames}>
                                {day}
                            </div>
                        );
                    })}
                </div>

                <div className="calendar-legend">
                    <div className="legend-tag">
                        <span className="legend-dot" style={{ backgroundColor: '#e040a0'}}></span>
                        Predicted Period
                    </div>
                    <div className="legend-tag">
                        <span className="legend-dot" style={{ backgroundColor: '#0096cc'}}></span>
                        Fertile Window
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarModal;
