import React, { useState, useEffect } from 'react';
import { 
    Droplets, Sun, Sparkles, Wind, CheckCircle2, ArrowLeft, 
    Loader2, Sparkle, Plus, X, ListChecks, HeartPulse, ShieldCheck,
    Moon, Calendar, Zap, Droplet
} from 'lucide-react';
import { logRitual, fetchSkincareProducts, saveSkincareProducts, getPersonalizedSkincare } from '../services/api';
import './SkinCare.css';

const PRODUCT_TYPES = ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Night Cream', 'Sunscreen', 'Exfoliator', 'Mask'];
const BRAND_SUGGESTIONS = ['CeraVe', 'La Roche-Posay', 'The Ordinary', 'Paula\'s Choice', 'Laneige', 'SkinCeuticals'];

const IconMap = {
    sun: <Sun size={20} color="#fbbf24" />,
    moon: <Moon size={20} color="#818cf8" />,
    droplet: <Droplet size={20} color="#38bdf8" />,
    droplets: <Droplets size={20} color="#0ea5e9" />,
    shield: <ShieldCheck size={20} color="#10b981" />,
    sparkle: <Sparkle size={20} color="#f472b6" />,
    wind: <Wind size={20} color="#94a3b8" />
};

const SkinCare = ({ onBack, showToast, dashboardData }) => {
    const [view, setView] = useState('loading');
    const [userProducts, setUserProducts] = useState([]);
    const [completingId, setCompletingId] = useState(null);
    const [completedRituals, setCompletedRituals] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [tempProducts, setTempProducts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fetchSkincareProducts();
            if (res.data && res.data.length > 0) {
                setUserProducts(res.data);
                setView('rituals');
            } else {
                setView('questionnaire');
            }
        } catch (e) {
            console.error(e);
            setView('rituals');
        }
    };

    const handleSaveProducts = async () => {
        if (tempProducts.length === 0) {
            showToast("Please add at least one product to personalize your rituals.");
            return;
        }
        setIsSaving(true);
        try {
            await saveSkincareProducts(tempProducts);
            setUserProducts(tempProducts);
            setView('rituals');
            showToast("Your personalized skincare plan is ready! ✨");
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleComplete = async (ritualId) => {
        if (completedRituals.has(ritualId)) return;
        setCompletingId(ritualId);
        try {
            await logRitual('skincare', ritualId);
            setCompletedRituals(prev => new Set(prev).add(ritualId));
            showToast(`Routine logged! Your consistency is glowing. ✨`);
        } catch (e) {
            console.error(e);
        } finally {
            setCompletingId(null);
        }
    };

    const addTempProduct = (type) => {
        if (tempProducts.find(p => p.type === type)) return;
        setTempProducts([...tempProducts, { type, brand: '' }]);
    };

    if (view === 'loading') {
        return (
            <div className="skincare-loading">
                <Loader2 className="animate-spin" size={40} color="#7c52aa" />
                <p>Generating your engine...</p>
            </div>
        );
    }

    if (view === 'questionnaire') {
        return (
            <div className="skincare-page questionnaire-view fade-in">
                <header className="skincare-header">
                    <button className="back-btn" onClick={userProducts.length > 0 ? () => setView('rituals') : onBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="skincare-title-wrap">
                        <h1 className="skincare-title">Your Shelf</h1>
                        <p className="skincare-subtitle">What's in your cabinet currently?</p>
                    </div>
                </header>

                <div className="product-selector-grid">
                    {PRODUCT_TYPES.map(type => {
                        const isSelected = tempProducts.find(p => p.type === type);
                        return (
                            <div key={type} className={`product-type-card ${isSelected ? 'selected' : ''}`} onClick={() => !isSelected && addTempProduct(type)}>
                                <div className="product-type-header">
                                    <span className="type-label">{type}</span>
                                    {isSelected ? <CheckCircle2 size={18} color="#10b981" /> : <Plus size={18} color="#9ca3af" />}
                                </div>
                                {isSelected && (
                                    <div className="brand-input-wrap" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="text" 
                                            placeholder="Brand (optional)" 
                                            value={isSelected.brand} 
                                            onChange={(e) => setTempProducts(tempProducts.map(p => p.type === type ? { ...p, brand: e.target.value } : p))}
                                            list={`brands-${type}`}
                                        />
                                        <datalist id={`brands-${type}`}>
                                            {BRAND_SUGGESTIONS.map(b => <option key={b} value={b} />)}
                                        </datalist>
                                        <button className="remove-prod-btn" onClick={() => setTempProducts(tempProducts.filter(p => p.type !== type))}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="save-actions">
                    <button className="btn-primary-skincare" onClick={handleSaveProducts} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Generate My Smart Engine'}
                    </button>
                </div>
            </div>
        );
    }

    const phase = dashboardData?.upcomingDates?.cyclePhase || 'Luteal';
    const riskScore = dashboardData?.pcodInsights?.score || 40;
    const symptoms = dashboardData?.profile?.symptoms || [];
    const personalized = getPersonalizedSkincare(phase, riskScore, symptoms, userProducts, dashboardData?.profile);

    const RoutineSection = ({ title, icon, rituals, colorClass }) => (
        <div className={`routine-section ${colorClass}`}>
            <div className="section-header">
                {icon}
                <h3>{title}</h3>
            </div>
            <div className="routine-cards-list">
                {rituals.length === 0 ? (
                    <p className="empty-ritual-placeholder">No rituals assigned for this segment.</p>
                ) : (
                    rituals.map(ritual => {
                        const isDone = completedRituals.has(ritual.id);
                        const isCompleting = completingId === ritual.id;
                        return (
                            <div key={ritual.id} className={`routine-card-item ${isDone ? 'done' : ''}`}>
                                <div className="card-top">
                                    <div className="ritual-icons-box">
                                        {IconMap[ritual.icon] || IconMap.sparkle}
                                    </div>
                                    <div className="ritual-main-info">
                                        <h4 className="ritual-sub-title">{ritual.title}</h4>
                                        <p className="ritual-sub-desc">{ritual.desc}</p>
                                    </div>
                                    <button 
                                        className={`log-mini-btn ${isDone ? 'checked' : ''}`}
                                        onClick={() => handleComplete(ritual.id)}
                                        disabled={isDone || isCompleting}
                                    >
                                        {isCompleting ? <Loader2 className="animate-spin" size={16} /> : 
                                         isDone ? <CheckCircle2 size={18} /> : <Zap size={18} />}
                                    </button>
                                </div>
                                {ritual.why && (
                                    <div className="ritual-why-tag">
                                        <Sparkles size={10} />
                                        <span>{ritual.why}</span>
                                    </div>
                                )}
                                <div className="card-tags-row">
                                    {ritual.tags.map(t => <span key={t} className="card-mini-tag">#{t}</span>)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    return (
        <div className="skincare-page engine-view fade-in">
            <header className="skincare-header">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <div className="skincare-title-wrap">
                    <h1 className="skincare-title">Smart Engine</h1>
                    <p className="skincare-subtitle">Adaptive {phase} care activated</p>
                </div>
                <button className="edit-shelf-btn" onClick={() => { setTempProducts([...userProducts]); setView('questionnaire'); }}>
                    <ListChecks size={20} />
                    <span>Shelf</span>
                </button>
            </header>

            <section className="skincare-hero-compact">
                <div className="hero-insight-pill">
                    <HeartPulse size={14} />
                    <span>Focus: {personalized.focus}</span>
                </div>
            </section>

            <div className="routines-dashboard">
                <RoutineSection 
                    title="Morning Routine" 
                    icon={<Sun size={24} color="#fbbf24" />} 
                    rituals={personalized.morning}
                    colorClass="morning-group"
                />
                <RoutineSection 
                    title="Evening Routine" 
                    icon={<Moon size={24} color="#818cf8" />} 
                    rituals={personalized.evening}
                    colorClass="evening-group"
                />
                <RoutineSection 
                    title="Weekly Add-ons" 
                    icon={<Calendar size={24} color="#f472b6" />} 
                    rituals={personalized.weekly}
                    colorClass="weekly-group"
                />
            </div>

            {personalized.suggestions.length > 0 && (
                <div className="engine-suggestions-box">
                    <h4 className="suggestion-head">Optimization Opportunities</h4>
                    <div className="suggestions-flex">
                        {personalized.suggestions.map((s, i) => (
                            <div key={i} className="mini-suggestion-card">
                                <Plus size={14} />
                                <span>{s}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <footer className="engine-footer">
                <div className="engine-status-pill">
                    <ShieldCheck size={14} />
                    <span>Intelligence V2.0 Active</span>
                </div>
            </footer>
        </div>
    );
};

export default SkinCare;
