import React, { useState, useEffect } from 'react';
import { X, Droplets, SmilePlus, Pill, Moon, Thermometer, Database, Loader2 } from 'lucide-react';
import { fetchHistoryLogs } from '../services/api';
import './HistoryModal.css';

const HistoryModal = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        const loadLogs = async () => {
            setIsLoading(true);
            try {
                const res = await fetchHistoryLogs();
                setHistory(res?.data || []);
            } catch (err) {
                console.error("Failed to fetch history logs", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadLogs();
    }, [isOpen]);

    if (!isOpen) return null;

    const getIconConfig = (type) => {
        switch (type) {
            case 'flow': return { icon: <Droplets size={20} />, bg: '#fce8f3', c: '#e040a0' };
            case 'mood': return { icon: <SmilePlus size={20} />, bg: '#f3e8ff', c: '#7c52aa' };
            case 'meds': return { icon: <Pill size={20} />, bg: '#e0f2fe', c: '#0096cc' };
            case 'sleep': return { icon: <Moon size={20} />, bg: '#ffedd5', c: '#f97316' };
            case 'symptoms': return { icon: <Thermometer size={20} />, bg: '#fdf4ff', c: '#d946ef' };
            default: return { icon: <Database size={20} />, bg: '#f4f4f5', c: '#71717a' };
        }
    };

    return (
        <div className="history-backdrop">
            <div className="history-card">
                <div className="history-header">
                    <h2>Your Activity Log</h2>
                    <button className="history-close-btn" onClick={onClose} title="Close History">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="history-timeline">
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#e040a0' }}>
                            <Loader2 className="animate-spin" size={32} />
                            <p style={{ marginTop: '1rem', fontWeight: 600 }}>Syncing historical records...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#a1a1aa', marginTop: '3rem' }}>
                            <Database size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                            <p>No recorded history yet.</p>
                        </div>
                    ) : (
                        history.map((log) => {
                            const conf = getIconConfig(log.type);
                            return (
                                <div key={log.id} className="history-row">
                                    <div className="history-icon-bubble" style={{ backgroundColor: conf.bg, color: conf.c }}>
                                        {conf.icon}
                                    </div>
                                    <div className="history-content">
                                        <div className="history-date">{log.date}</div>
                                        <div className="history-title">{log.type === 'meds' ? 'Medications' : log.type} Logged</div>
                                        <div className="history-value">{log.val}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
