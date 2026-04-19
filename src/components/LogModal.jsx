import React, { useState, useEffect } from 'react';
import { X, Droplet, SmilePlus, Pill, Moon, Thermometer } from 'lucide-react';
import { logCycleEvent } from '../services/api';
import { useDashboardContext } from '../context/DashboardContext';
import './LogModal.css';

const LogModal = ({ isOpen, mode, onClose, showToast }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [value, setValue] = useState('');
  const [symptomsList, setSymptomsList] = useState([]);
  const { triggerDashboardRefresh } = useDashboardContext();

  // Reset states on open
  useEffect(() => {
     if (isOpen) {
         setValue('');
         setSymptomsList([]);
     }
  }, [isOpen]);

  if (!isOpen) return null;

  let title, Icon, colorMap, endpoint;
  switch (mode) {
    case 'flow':
      title = 'Track Flow'; Icon = Droplet; colorMap = { txt: '#e040a0', bg: '#fce8f3' }; endpoint = 'logFlow';
      break;
    case 'mood':
      title = 'Log Mood'; Icon = SmilePlus; colorMap = { txt: '#7c52aa', bg: '#f3e8ff' }; endpoint = 'logMood';
      break;
    case 'meds':
      title = 'Medications'; Icon = Pill; colorMap = { txt: '#0096cc', bg: '#e0f2fe' }; endpoint = 'medications';
      break;
    case 'sleep':
      title = 'Sleep Stats'; Icon = Moon; colorMap = { txt: '#f97316', bg: '#ffedd5' }; endpoint = 'sleep';
      break;
    case 'symptoms':
      title = 'Log Symptoms'; Icon = Thermometer; colorMap = { txt: '#a020f0', bg: '#f3e8ff' }; endpoint = 'logSymptoms';
      break;
    default:
      return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payloadValue = mode === 'symptoms' ? symptomsList : value;
      const res = await logCycleEvent(endpoint, { value: payloadValue });
      showToast(`${title} logged successfully! ✨`);
      
      let toastDelay = 3200;
      
      // Fire prediction engine toast if dates were mathematically shifted
      if (res.data?.shiftedDates) {
          setTimeout(() => {
              showToast(`Upcoming dates recalculated based on your log! 🧬`);
          }, toastDelay); 
          toastDelay += 3200;
      }
      
      // Fire Consistency growth toast logic
      if (res.data?.updatedConsistency) {
          setTimeout(() => {
              showToast(`Consistency tracker updated! 📈`);
          }, toastDelay);
          toastDelay += 3200;
      }

      // Fire PCOD Insights recalculation toast
      if (res.data?.updatedInsights) {
          setTimeout(() => {
              showToast(`Insights updated based on your latest logs. 🩺`);
          }, toastDelay);
      }

      triggerDashboardRefresh();
      onClose();
    } catch (err) {
      showToast(`Failed to log ${title.toLowerCase()}. Please try again.`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content fade-up">
        
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="modal-icon-wrap" style={{ backgroundColor: colorMap.bg, color: colorMap.txt }}>
              <Icon size={24} />
            </div>
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {mode === 'flow' && (
            <div className="input-group">
              <label>Flow Intensity</label>
              <select className="modal-input" required onChange={(e) => setValue(e.target.value)}>
                <option value="">Select intensity...</option>
                <option value="light">Light Flow</option>
                <option value="medium">Medium Flow</option>
                <option value="heavy">Heavy Flow</option>
                <option value="spotting">Spotting Only</option>
              </select>
            </div>
          )}

          {mode === 'mood' && (
            <div className="input-group">
              <label>How are you feeling today?</label>
              <input type="text" className="modal-input" placeholder="e.g., Anxious, energetic, calm..." required onChange={(e) => setValue(e.target.value)} />
            </div>
          )}

          {mode === 'meds' && (
            <div className="input-group">
              <label>Medication Name & Dosage</label>
              <input type="text" className="modal-input" placeholder="e.g., Ibuprofen 400mg" required onChange={(e) => setValue(e.target.value)} />
            </div>
          )}

          {mode === 'sleep' && (
            <div className="input-group">
              <label>Hours of Sleep</label>
              <input type="number" step="0.5" className="modal-input" placeholder="e.g., 7.5" required onChange={(e) => setValue(e.target.value)} />
            </div>
          )}

          {mode === 'symptoms' && (
            <div className="input-group">
              <label>Select Symptoms</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                {['Cramps', 'Fatigue', 'Bloating', 'Mood swings', 'Headache', 'Backache', 'Acne', 'Oily skin'].map(symp => {
                    const id = symp.toLowerCase();
                    return (
                      <label key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8f0ff', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid #eaddff' }}>
                        <input 
                            type="checkbox" 
                            name="symptoms" 
                            value={id}
                            checked={symptomsList.includes(id)}
                            onChange={(e) => {
                                if (e.target.checked) setSymptomsList([...symptomsList, id]);
                                else setSymptomsList(symptomsList.filter(s => s !== id));
                            }} 
                            style={{ accentColor: '#a020f0', width: '1.2rem', height: '1.2rem' }}
                        />
                        <span style={{ color: '#4a044e', fontWeight: 500, fontSize: '0.9rem' }}>{symp}</span>
                      </label>
                    );
                })}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-modal-submit" style={{ backgroundColor: colorMap.txt }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default LogModal;
