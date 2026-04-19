import axios from 'axios';
import { getAuthToken, logoutUser } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// Provide a mock mode if the API doesn't exist yet, we will just return promises with data.
const isMockAPI = !import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use((response) => response, async (error) => {
  if (error.response && error.response.status === 401) {
    await logoutUser();
    window.location.reload(); // Auto-redirect to login by reloading the state
  }
  return Promise.reject(error);
});

// APIs
let mockCurrentSymptoms = [];
let mockConsistencyScore = 65;
let mockTotalLogsCount = 0;
let mockCurrentStreak = 12; // Base global streak

// Ritual Streaks & Completion metadata
let mockRitualStreaks = {
    nutrition: 12,
    movement: 8,
    lifestyle: 15,
    skincare: 0
};

// Tracks if a ritual category has been completed today
let mockTodayCompletions = {
    nutrition: true,
    movement: false,
    lifestyle: true,
    skincare: false
};

// Real period start date — set when user logs flow. Defaults to ~day 14 of a synthetic cycle.
const _defaultPeriodStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - 13); // simulate being on day 14
    return d.toISOString().split('T')[0];
};
let mockPeriodStartDate = _defaultPeriodStart();
let mockFlowIntensity = 'Medium';

let mockProfileData = {
    name: 'Mona', displayName: 'Mona', age: 19,
    cycleLength: 30, periodLength: 5, privacy: true,
    sleepHours: '7–8 hrs', stressLevel: 'Moderate', exerciseFreq: '1–2× / week',
    symptoms: [],
    onboarded: true,
    anonymousAlias: '',
    aliasLocked: false,
    joinDate: '',      // e.g. "Apr 2026"
    profilePhoto: ''    // Base64 string or URL
};

// ─── Stable alias: persisted in localStorage so it survives page reloads ──────
const NATURE_ALIASES = [
    'Anonymous Sunflower', 'Moonlit Traveler', 'Quiet Storm',    'Rising Tide',
    'Velvet Moonrise',     'Silver Fern',      'Wandering Willow','Amber Nightfall',
    'Crimson Blossom',     'Gentle Raindrop',  'Golden Ember',    'Misty Meadow',
    'Violet Wave',         'Starling Bloom',   'Jade Horizon',    'Rose Ember',
    'Indigo Drift',        'Petal Storm',      'Cyan Breeze',     'Crimson Tide',
    'Lavender Echo',       'Ember Glow',       'Sage Wanderer',   'Lotus Rise',
];

// On first fetch: ensure the profile has a valid alias.
const _getAccountAliasKey  = (uid) => `predict_her_${uid}_alias`;
const _getAliasOriginalKey = (uid) => `predict_her_${uid}_alias_orig`;
const _getAliasCustomFlag  = (uid) => `predict_her_${uid}_alias_custom`;
const _getAliasLockedKey   = (uid) => `predict_her_${uid}_alias_locked`;
const _getAnonModeKey      = (uid) => `predict_her_${uid}_anon_mode`;
const _getSkincareProdsKey = (uid) => `predict_her_${uid}_skincare_prods`;

export const getSessionAlias = (uid = 'user-123') => {
    if (isMockAPI && mockProfileData.anonymousAlias) return mockProfileData.anonymousAlias;
    return localStorage.getItem(_getAccountAliasKey(uid)) || 'Anonymous';
};

export const getOriginalAlias = (uid = 'user-123') => {
    return localStorage.getItem(_getAliasOriginalKey(uid)) || getSessionAlias(uid);
};

export const isAliasCustom  = (uid = 'user-123') => localStorage.getItem(_getAliasCustomFlag(uid)) === 'true';

export const isAliasLocked  = (uid = 'user-123') => {
    if (isMockAPI) return mockProfileData.aliasLocked;
    return localStorage.getItem(_getAliasLockedKey(uid)) === 'true';
};

export const lockAlias = (uid = 'user-123') => {
    if (isMockAPI) mockProfileData.aliasLocked = true;
    localStorage.setItem(_getAliasLockedKey(uid), 'true');
    return getOriginalAlias(uid);
};

export const getAnonymousMode = (uid = 'user-123') => {
    const stored = localStorage.getItem(_getAnonModeKey(uid));
    return stored === null ? true : stored === 'true';
};

export const setAnonymousMode = (isAnonymous, uid = 'user-123') => {
    localStorage.setItem(_getAnonModeKey(uid), String(isAnonymous));
    if (!isAnonymous) {
        localStorage.setItem(_getAccountAliasKey(uid), mockProfileData.displayName);
    } else {
        const saved = localStorage.getItem(_getAliasOriginalKey(uid));
        localStorage.setItem(_getAccountAliasKey(uid), saved || NATURE_ALIASES[0]);
    }
};

export const regenerateAlias = (uid = 'user-123') => {
    if (isAliasLocked(uid)) return { ok: false, error: 'Alias is permanent and cannot be changed.' };
    const current = localStorage.getItem(_getAliasOriginalKey(uid));
    let picked;
    do { picked = NATURE_ALIASES[Math.floor(Math.random() * NATURE_ALIASES.length)]; }
    while (picked === current && NATURE_ALIASES.length > 1);

    localStorage.setItem(_getAliasOriginalKey(uid), picked);
    localStorage.setItem(_getAccountAliasKey(uid),  picked);
    localStorage.removeItem(_getAliasCustomFlag(uid));
    if (isMockAPI) mockProfileData.anonymousAlias = picked;
    return { ok: true, alias: picked };
};

export const setCustomAlias = (raw, uid = 'user-123') => {
    if (isAliasLocked(uid)) return { ok: false, error: 'Alias is permanent and cannot be changed.' };
    const trimmed = raw.trim();
    if (trimmed.length < 2)  return { ok: false, error: 'Alias must be at least 2 characters.' };
    if (trimmed.length > 24) return { ok: false, error: 'Alias must be 24 characters or fewer.' };
    if (!/^[a-zA-Z0-9 \-]+$/.test(trimmed))
        return { ok: false, error: 'Only letters, numbers, spaces, and hyphens allowed.' };
    localStorage.setItem(_getAccountAliasKey(uid),  trimmed);
    localStorage.setItem(_getAliasOriginalKey(uid), trimmed);
    localStorage.setItem(_getAliasCustomFlag(uid),  'true');
    if (isMockAPI) mockProfileData.anonymousAlias = trimmed;
    return { ok: true, alias: trimmed };
};

export const fetchProfile = async (uid = 'user-123') => {
    if (isMockAPI) {
        // Init alias for this user if missing
        if (!mockProfileData.anonymousAlias) {
            const stored = localStorage.getItem(_getAccountAliasKey(uid));
            if (stored) {
                mockProfileData.anonymousAlias = stored;
            } else {
                const fresh = NATURE_ALIASES[Math.floor(Math.random() * NATURE_ALIASES.length)];
                mockProfileData.anonymousAlias = fresh;
                localStorage.setItem(_getAccountAliasKey(uid), fresh);
                localStorage.setItem(_getAliasOriginalKey(uid), fresh);
            }
        }
        // Set Join Date if missing (first fetch)
        if (!mockProfileData.joinDate) {
            const now = new Date();
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            mockProfileData.joinDate = `${months[now.getMonth()]} ${now.getFullYear()}`;
        }
        return { data: { ...mockProfileData, anonymousMode: getAnonymousMode(uid) } };
    }
    return apiClient.get('/profile/get');
};

export const updateProfile = async (payload) => {
    if (isMockAPI) {
        if (payload.displayName)          { mockProfileData.name = payload.displayName; mockProfileData.displayName = payload.displayName; }
        if (payload.age)                  mockProfileData.age = payload.age;
        if (payload.baselineCycleLength)  mockProfileData.cycleLength = payload.baselineCycleLength;
        if (payload.periodLength)         mockProfileData.periodLength = payload.periodLength;
        // Lifestyle fields from onboarding / profile page
        if (payload.sleepHours)           mockProfileData.sleepHours = payload.sleepHours;
        if (payload.stressLevel)          mockProfileData.stressLevel = payload.stressLevel;
        if (payload.exerciseFreq)         mockProfileData.exerciseFreq = payload.exerciseFreq;
        if (payload.symptoms)             mockProfileData.symptoms = payload.symptoms;
        if (payload.onboarded !== undefined) mockProfileData.onboarded = !!payload.onboarded;
        if (payload.anonymousAlias)       mockProfileData.anonymousAlias = payload.anonymousAlias;
        if (payload.aliasLocked !== undefined) mockProfileData.aliasLocked = !!payload.aliasLocked;
        if (payload.profilePhoto)         mockProfileData.profilePhoto = payload.profilePhoto;

        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ data: { success: true, profile: mockProfileData } });
            }, 600);
        });
    }
    return apiClient.post('/profile/update', payload);
};

export const fetchCycleHistory = async () => {
    if (isMockAPI) return { data: { history: [ { date: '2026-03-01', length: 28 }, { date: '2026-04-01', length: 29 } ] } };
    return apiClient.get('/cycle/history');
};

export const fetchCycleStreak = async () => {
    if (isMockAPI) return { data: { streak: 12 } };
    return apiClient.get('/cycle/streak');
};

export const fetchUpcomingDates = async () => {
    if (isMockAPI) return { data: { nextPeriod: 'Oct 14', fertileWindow: 'Sep 28 - Oct 2', cyclePhase: 'Luteal' } };
    return apiClient.get('/cycle/upcoming');
};

const getHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

const insightsPool = {
    "Menstrual": [
        { title: "MENSTRUAL TIP", text: "Your body is working hard. Prioritize rest and hydration today.", articleId: "menstrual_rest" },
        { title: "MENSTRUAL TIP", text: "Gentle stretching can help relieve lower back cramps.", articleId: "menstrual_yoga" }
    ],
    "Follicular": [
        { title: "FOLLICULAR TIP", text: "Your energy is returning. Time to try that new workout class!", articleId: "follicular_energy" },
        { title: "FOLLICULAR TIP", text: "Focus on nutrient-dense foods to rebuild your iron levels.", articleId: "follicular_diet" }
    ],
    "Ovulation": [
        { title: "OVULATION TIP", text: "Embrace your creative peak. Start that project today!", articleId: "ovulation_creativity" },
        { title: "OVULATION TIP", text: "You're at your most social and communicative. Shine brightly!", articleId: "ovulation_social" }
    ],
    "Luteal": [
        { title: "LUTEAL TIP", text: "Your body is preparing for rest. Treat yourself to a warm bath.", articleId: "article-123" },
        { title: "LUTEAL TIP", text: "Cravings are normal right now. Opt for dark chocolate and complex carbs.", articleId: "luteal_cravings" }
    ]
};

export const fetchDailyRecommendation = async (params) => {
    const { userId = "guest", cycleDay = 1, phase = "Luteal", symptoms = [] } = params || {};
    
    if (isMockAPI) {
        // Step 3 - Daily Rotation Logic
        const userIdHash = getHash(userId);
        const pool = insightsPool[phase] || insightsPool["Luteal"];
        const index = (cycleDay + userIdHash) % pool.length;
        let selectedInsight = { ...pool[index] };
        
        // Step 4 - Personalization Layer
        if (symptoms.includes("fatigue")) {
            selectedInsight.title = `${phase.toUpperCase()} TIP (REST)`;
            selectedInsight.text = "You've logged fatigue. Don't push yourself today—a 20 min nap works wonders.";
        } else if (symptoms.includes("mood swings")) {
            selectedInsight.title = `${phase.toUpperCase()} TIP (MINDFULNESS)`;
            selectedInsight.text = "Experiencing mood swings? Try a 5-minute guided meditation to center your thoughts.";
        } else if (symptoms.includes("high energy")) {
            selectedInsight.title = `${phase.toUpperCase()} TIP (PRODUCTIVITY)`;
            selectedInsight.text = "Capitalize on your high energy! It's a great day to tackle complex tasks.";
        }

        return { 
            data: { 
                phase: phase,
                tipTitle: selectedInsight.title,
                tipText: selectedInsight.text,
                articleUrl: `/recommendations/article?id=${selectedInsight.articleId}`,
                articleId: selectedInsight.articleId
            } 
        };
    }
    
    return apiClient.post(`/recommendations/daily`, { userId, cycleDay, phase, symptoms });
};

export const logCycleEvent = async (endpoint, payload) => {
    if (isMockAPI) {
        if (endpoint === 'logSymptoms' && payload.value && Array.isArray(payload.value)) {
            mockCurrentSymptoms = payload.value;
        }

        // Flow log: store actual start date + optional duration
        if (endpoint === 'flow') {
            if (payload.date) {
                mockPeriodStartDate = payload.date;
            }
            if (payload.value) {
                mockFlowIntensity = payload.value;
            }
            // If a duration was provided (from "last period" branch), update periodLength
            if (payload.duration && payload.duration >= 1 && payload.duration <= 10) {
                mockProfileData = { ...mockProfileData, periodLength: payload.duration };
            }
        }

        mockConsistencyScore = Math.min(100, mockConsistencyScore + 5);
        mockTotalLogsCount  += 1;
        mockCurrentStreak   += 1;

        return { data: { success: true, updatedConsistency: true, updatedInsights: true } };
    }
    return apiClient.post(`/cycle/${endpoint}`, payload);
};

export const logRitual = async (category, ritualId = 'default') => {
    if (isMockAPI) {
        if (!mockTodayCompletions[category]) {
            mockTodayCompletions[category] = true;
            mockRitualStreaks[category] += 1;
            mockCurrentStreak += 1; // Increment global streak too
        }
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ data: { success: true, streaks: mockRitualStreaks, completions: mockTodayCompletions } });
            }, 600);
        });
    }
    return apiClient.post('/tips/log', { category, ritualId });
};

export const fetchTipsAction = async (tipId) => {
    if (isMockAPI) {
        // Map tip buttons to specific actions
        const actionsMap = {
            'ovulation_social': { type: 'redirect', target: 'community' },
            'peak_today': { type: 'action', category: 'skincare', ritualId: 'morning_glow', redirect: 'skincare' },
            'luteal_cravings': { type: 'redirect', target: 'nutrition' }
        };
        return { data: actionsMap[tipId] || { type: 'none' } };
    }
    return apiClient.get(`/tips/action`, { params: { tipId } });
};

export const fetchSkincareProducts = async (uid = 'user-123') => {
    if (isMockAPI) {
        const stored = localStorage.getItem(_getSkincareProdsKey(uid));
        return { data: stored ? JSON.parse(stored) : [] };
    }
    return apiClient.get('/skincare/products');
};

export const saveSkincareProducts = async (products, uid = 'user-123') => {
    if (isMockAPI) {
        localStorage.setItem(_getSkincareProdsKey(uid), JSON.stringify(products));
        return { data: { success: true } };
    }
    return apiClient.post('/skincare/products', { products });
};

export const getPersonalizedSkincare = (phase, riskScore, symptoms, userProducts, profile = {}) => {
    const has = (type) => userProducts.some(p => p.type.toLowerCase() === type.toLowerCase());
    const getBrand = (type) => userProducts.find(p => p.type.toLowerCase() === type.toLowerCase())?.brand || 'your product';

    const routines = {
        morning: [],
        evening: [],
        weekly: [],
        focus: phase === 'Follicular' ? 'Luminous Vitality' : 'Barrier Resilience',
        suggestions: []
    };

    const stress = profile.stressLevel || 'Moderate';
    const sleep = profile.sleepHours || '7–8 hrs';

    // 1. MORNING ROUTINE (Protection & Hydration)
    if (has('Cleanser')) {
        routines.morning.push({
            id: 'm_cleanse',
            title: 'Morning Refresh',
            desc: `Start with your ${getBrand('Cleanser')} to clear overnight sebum.`,
            tags: ['Prep'],
            icon: 'sun'
        });
    }

    if (phase === 'Follicular' || phase === 'Ovulation') {
        if (has('Sunscreen')) {
            routines.morning.push({
                id: 'm_spf',
                title: 'Phase-Locked SPF',
                desc: `Estrogen is rising. Protect your "Follicular Glow" with ${getBrand('Sunscreen')}.`,
                tags: ['Protection', 'Phase'],
                why: 'Follicular Defense',
                icon: 'shield'
            });
        }
    }

    // 2. EVENING ROUTINE (Repair & Calm)
    if (has('Serum')) {
        const isLuteal = phase === 'Luteal' || phase === 'Menstrual';
        routines.evening.push({
            id: 'e_serum',
            title: isLuteal ? 'Androgen Shield' : 'Repair Serum',
            desc: isLuteal 
                ? `Progesterone is high. Use ${getBrand('Serum')} to prevent jawline sensitivity.`
                : `Nightly repair with ${getBrand('Serum')} to support cell turnover.`,
            tags: ['Repair', isLuteal ? 'Hormonal' : 'Core'],
            why: isLuteal ? 'Luteal Support' : 'Nightly Repair',
            icon: 'moon'
        });
    }

    if (stress === 'High' || stress === 'Very High') {
        if (has('Mask')) {
            routines.evening.push({
                id: 'e_stress_mask',
                title: 'Cortisol Calm Mask',
                desc: `You've logged high stress. A 10-min session with ${getBrand('Mask')} helps lower skin cortisol.`,
                tags: ['Calming', 'Lifestyle'],
                why: 'Stress Rescue',
                icon: 'sparkle'
            });
        }
    }

    if (has('Moisturizer')) {
        routines.evening.push({
            id: 'e_moisturizer',
            title: 'Barrier Seal',
            desc: `Lock in hydration for 8 hours with your ${getBrand('Moisturizer')}.`,
            tags: ['Hydration'],
            icon: 'droplet'
        });
    }

    // 3. WEEKLY ADD-ONS
    if (has('Exfoliator') && phase !== 'Menstrual') {
        routines.weekly.push({
            id: 'w_exfoliate',
            title: 'Cycle Renewal',
            desc: `Use ${getBrand('Exfoliator')} today to remove dead cells and brighten your tone.`,
            tags: ['Renewal'],
            why: 'Weekly Glow',
            icon: 'wind'
        });
    }

    // 4. PCOD / Symptom Specifics (Force priority)
    if (riskScore > 60 && has('Toner')) {
        routines.morning.push({
            id: 'special_toner',
            title: 'pH-Balance Ritual',
            desc: `PCOD risk is elevated. Use ${getBrand('Toner')} to stabilize skin pH and reduce inflammation.`,
            tags: ['Treatment', 'PCOD'],
            why: 'Metabolic Balance',
            icon: 'droplets'
        });
    }

    // Suggestions
    if (!has('Sunscreen')) routines.suggestions.push('Add a Mineral SPF for Follicular protection.');
    if (!has('Toner')) routines.suggestions.push('A pH-balancing toner helps stabilize PCOD-related oiliness.');
    if (!has('Night Cream')) routines.suggestions.push('Consider a rich night cream for Evening repair.');

    return routines;
};

const generatePCODInsights = () => {
    let baseScore = 40;
    let tags = [];

    // Normalize symptoms to lowercase
    const symptoms = (mockCurrentSymptoms.length ? mockCurrentSymptoms : (mockProfileData.symptoms || []))
        .map(s => s.toLowerCase());

    // ── Cycle irregularity ───────────────────────────────────────────
    const baselineCycle = parseInt(mockProfileData.cycleLength) || 28;
    if (baselineCycle > 35 || baselineCycle < 21) {
        baseScore += 12;
        tags.push('Cycle Irregularity');
    }

    // ── Symptoms ────────────────────────────────────────────────────
    if (symptoms.includes('fatigue'))                          { baseScore += 15; tags.push('Metabolic Dip'); }
    if (symptoms.includes('bloating') || symptoms.includes('cramps')) { baseScore += 10; tags.push('Inflammatory Signifiers'); }
    if (symptoms.includes('mood swings'))                      { baseScore += 18; tags.push('Cortisol Volatility'); }
    if (symptoms.includes('headache'))                         { baseScore +=  8; tags.push('Hormonal Pressure'); }
    if (symptoms.includes('acne'))                             { baseScore +=  7; tags.push('Androgen Activity'); }
    if (symptoms.includes('insomnia'))                         { baseScore +=  9; tags.push('Sleep Disruption'); }

    // ── Sleep quality ────────────────────────────────────────────────
    const sleep = mockProfileData.sleepHours || '7–8 hrs';
    if (sleep === '< 5 hrs')  { baseScore += 14; tags.push('Severe Sleep Deficit'); }
    else if (sleep === '5–6 hrs') { baseScore += 7; tags.push('Sleep Deficit'); }

    // ── Stress level ─────────────────────────────────────────────────
    const stress = mockProfileData.stressLevel || 'Moderate';
    if (stress === 'Very High') { baseScore += 22; tags.push('Cortisol Overload'); }
    else if (stress === 'High') { baseScore += 13; tags.push('Elevated Stress'); }
    else if (stress === 'Moderate') { baseScore += 4; }

    // ── Exercise ──────────────────────────────────────────────────────
    const exercise = mockProfileData.exerciseFreq || '1–2× / week';
    if (exercise === 'Rarely')  { baseScore += 8; tags.push('Sedentary Patterns'); }
    else if (exercise === 'Daily' || exercise === '3–4× / week') { baseScore -= 5; } // protective

    let levelStr = 'Low Baseline';
    if (baseScore >= 50 && baseScore < 75) levelStr = 'Moderate High';
    if (baseScore >= 75) levelStr = 'Elevated Risk';

    return {
        score: Math.min(100, baseScore),
        level: levelStr,
        summary: `Your current score relies on predictive AI parsing. ${baseScore > 50 ? 'The intensity of your recent symptomatic markers suggests a hormonal disruption pattern worth actively monitoring.' : 'Your basal metabolic rates currently track as highly normalized.'}`,
        tags: tags.length > 0 ? tags : ['Stable Cycle'],
        androgenText: baseScore > 50 
            ? 'Indicators point towards an increased sensitivity to free circulating testosterone levels, manifesting actively within your log data.'
            : 'Your androgen receptor activity is sitting squarely within safe standard deviations.',
        metabolicText: baseScore > 60
            ? 'Your tracked logs act as a potential indicator of sluggish metabolic shifting and early-stage insulin resistance patterns.'
            : 'Your underlying insulin sensitivity mechanics exhibit no major deterministic signs of severe disruption.',
        androgenRec: baseScore > 50 ? 'Spearmint Tea' : 'Hydration Focus',
        metabolicRec: baseScore > 60 ? 'Strict Complex Carbs' : 'Standard Macros',

        // ─── Expandable detail content per section ───────────────────────────
        riskDetails: {
            what: baseScore >= 75
                ? 'Significant hormonal disruption detected. The LH/FSH ratio in your tracked cycle data shows elevated markers consistent with PCOD patterns. Cycle variability is increasing.'
                : baseScore >= 50
                ? 'Early-stage follicular imbalance detected. Your LH/FSH ratio suggests your body may be struggling to regulate ovulation consistently.'
                : 'Your hormonal markers are tracking within expected ranges. Your cycle shows regular patterns consistent with healthy ovulation.',
            tips: baseScore >= 75
                ? ['🩺 Schedule a consultation with a gynecologist', '🥗 Adopt a low-GI / anti-inflammatory diet immediately', '🏃 Resistance training 3x/week reduces androgen dominance', '😴 Prioritize 8+ hours of sleep to lower cortisol', '📊 Log symptoms daily for accurate risk tracking']
                : baseScore >= 50
                ? ['📅 Track ovulation windows closely each cycle', '🚫 Reduce refined sugar and processed carbs', '🍵 Spearmint or chamomile tea supports hormone balance', '🧘 30-min daily movement reduces LH volatility', '👩‍⚕️ Consult a gynecologist if irregularity persists 2+ months']
                : ['📋 Continue daily symptom logging', '🏃 Maintain consistent moderate exercise', '💧 Stay hydrated — supports hormonal regulation', '🛌 Consistent sleep schedule protects cycle health']
        },
        androgenDetails: {
            what: baseScore > 50
                ? 'Elevated androgen sensitivity means your body is reacting more strongly to testosterone. This can manifest as skin oiliness, hair changes, or acne flare-ups in the luteal phase.'
                : 'Your androgen receptor activity is well within healthy thresholds. No significant testosterone sensitivity indicators are present in your current log data.',
            tips: baseScore > 50
                ? ['🍵 Spearmint tea (2 cups/day) — clinically shown to reduce free testosterone', '🥦 Increase zinc and magnesium-rich foods (pumpkin seeds, spinach)', '🧴 Consult a dermatologist if skin or hair changes are severe', '⚖️ Maintain a healthy weight — adipose tissue amplifies androgen activity', '🚫 Limit dairy and high-glycemic foods which spike androgens']
                : ['💧 Maintain daily hydration (2L+ water)', '🌿 Anti-inflammatory diet supports receptor health', '🧘 Stress management keeps androgen levels balanced', '📝 Keep logging to detect any emerging patterns early']
        },
        metabolicDetails: {
            what: baseScore > 60
                ? 'Insulin resistance indicators suggest your cells are becoming less responsive to insulin signals. This is a common PCOD co-factor that amplifies hormonal disruption and fatigue cycles.'
                : 'Your metabolic markers show no significant signs of insulin resistance. Your energy regulation appears stable based on current logs.',
            tips: baseScore > 60
                ? ['🌾 Switch to complex carbs (quinoa, oats, sweet potato) over refined sugars', '🏋️ Strength training improves insulin sensitivity within 2–4 weeks', '🕐 Time-restricted eating (16:8) can reduce insulin peaks', '🧪 Ask your doctor about fasting insulin blood tests', '🍳 High-protein breakfast blunts morning glucose spikes']
                : ['🥗 Prioritize nutrient-dense whole foods', '🚶 A 20-min post-meal walk aids glucose metabolism', '🍓 Berries and leafy greens are anti-inflammatory staples', '📊 Monitor energy patterns through sleep and mood logs']
        },

        // ─── Personalized Protocol (score-driven) ────────────────────────────
        protocol: {
            nutrition: {
                summary: baseScore > 60
                    ? 'Prioritize low-glycemic, anti-inflammatory foods to reduce insulin spikes.'
                    : 'A balanced whole-food diet supports your current healthy hormone levels.',
                items: baseScore > 60
                    ? ['Probiotics (Kimchi, Yogurt)', 'Complex Carbs (Quinoa, Oats)', 'Spearmint Tea (2 cups/day)', 'Omega-3 Rich Foods (Salmon, Flaxseed)']
                    : ['Leafy Greens (Spinach, Kale)', 'Lean Protein (Chicken, Legumes)', 'Hydration (2L+ water daily)', 'Seasonal Fruits (Berries, Citrus)'],
                details: baseScore > 60
                    ? 'Your insulin sensitivity data suggests avoiding refined sugars and switching to complex carbs. Probiotics support gut-hormone signalling. Spearmint tea has clinical backing for reducing free testosterone in PCOD cases.'
                    : 'Your digestive and hormonal markers are stable. Focus on consistent micronutrient intake. A rainbow diet (varied colourful vegetables) provides the broadest antioxidant coverage.'
            },
            movement: {
                summary: baseScore > 50
                    ? 'Resistance training is more effective for your profile than HIIT.'
                    : 'Moderate aerobic activity maintains your current healthy cycle regularity.',
                items: baseScore > 50
                    ? ['Resistance Training 3x/week', '20-min Morning Walk (cortisol balance)', 'Yoga on rest days (parasympathetic reset)', 'Avoid aggressive HIIT (spikes cortisol)']
                    : ['30-min Brisk Walk daily', 'Yoga or Pilates 2x/week', 'Cycling or Swimming (low-impact)', 'Stretch routine before bed'],
                details: baseScore > 50
                    ? 'Strength training improves insulin response more effectively than cardio for elevated androgen profiles. Morning walks regulate cortisol which directly impacts LH/FSH balance. Avoid aggressive HIIT as it temporarily spikes cortisol, worsening androgen dominance.'
                    : 'Moderate, enjoyable movement keeps progesterone and oestrogen balanced. The goal is consistency over intensity. Activities you enjoy are more sustainable and lower stress-cortisol than forced exercise routines.'
            },
            lifestyle: {
                summary: baseScore > 50
                    ? 'Cortisol management is critical — stress directly amplifies androgen activity.'
                    : 'Your stress markers are manageable. Maintain good sleep hygiene for hormonal stability.',
                items: baseScore > 50
                    ? ['8+ Hours Sleep (hormone repair window)', 'Mindful Journaling (5 min/day)', 'Screen-free 30 min before bed', 'Limit alcohol + caffeine (amplifies cortisol)']
                    : ['Consistent Sleep Schedule (same time daily)', 'Gratitude Practice (mood regulation)', 'Social connection (reduces cortisol naturally)', 'Nature exposure (20 min outdoors)'],
                details: baseScore > 50
                    ? 'Chronically elevated cortisol suppresses progesterone and directly stimulates adrenal androgen production — a key PCOD feedback loop. Sleep is your primary hormonal repair window. Journaling reduces rumination, which is a significant cortisol driver in cycle-tracking users.'
                    : 'Your lifestyle markers are currently healthy. Maintaining your sleep schedule is the highest-leverage habit for keeping your cycle regular. Social connection and outdoor time have measurable effects on oxytocin and cortisol balance.'
            }
        }
    };
};


// ─── Dedup guards ────────────────────────────────────────────────────────────
// Tracks which reaction types the current user has already sent per post.
// Shape: { [postId]: Set<reactionType> }
const mockReactedPosts = {};

// Tracks the timestamp of the last comment per post to prevent double-sends.
// Shape: { [postId]: number (ms timestamp) }
const mockLastCommentTime = {};

// --- In-Memory Community Database ---
let mockCommunityFeed = [
    {
        postId: "p0",
        userAlias: "Anonymous Sunflower",
        content: "Feeling a bit overwhelmed today. Does anyone else get hit with sudden waves of anxiety right before their period starts? It feels like everything is moving too fast. Sending love to anyone else in the same boat. 🌸",
        timestamp: "2 hours ago • Cycle Day 24",
        tags: [],
        reactions: { likes: 24, comments: 8, hugs: 2 }
    },
    {
        postId: "p1",
        userAlias: "Moonlit Traveler",
        content: "Finally found a tea blend that helps with my luteal phase bloating! Peppermint, ginger, and a bit of honey. It's been a game changer for my sleep quality too. Has anyone tried similar herbal remedies? 🍵✨",
        timestamp: "5 hours ago • Recovery Phase",
        tags: [],
        reactions: { likes: 42, comments: 15, hugs: 10 }
    },
    {
        postId: "p2",
        userAlias: "Quiet Storm",
        content: "\"Self-care isn't selfish, especially when your body is working this hard. Reminding myself to rest today.\"",
        timestamp: "10 hours ago • Luteal Phase",
        tags: ["Mindfulness", "Rest"],
        reactions: { likes: 88, comments: 4, hugs: 30 }
    }
];

export const fetchCommunityPosts = async () => {
    if (isMockAPI) {
        return { data: { success: true, posts: [...mockCommunityFeed] } };
    }
    return apiClient.get('/community/getPosts');
};

export const postCommunityItem = async (content) => {
    if (isMockAPI) {
        const cyclePhase = 'Luteal Phase';
        const newPost = {
            postId: `p${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            userAlias: getSessionAlias(),   // Always read from stable localStorage alias
            content: content,
            timestamp: `Just now • ${cyclePhase}`,
            tags: [],
            reactions: { likes: 0, comments: 0, hugs: 0 },
            commentsList: []
        };
        mockCommunityFeed.unshift(newPost);
        return { data: { success: true, post: newPost } };
    }
    return apiClient.post('/community/post', { content });
};

export const addCommunityComment = async (postId, comment) => {
    if (isMockAPI) {
        // ── Server-side 1-second debounce: reject duplicate submissions ──────
        const now = Date.now();
        if (mockLastCommentTime[postId] && now - mockLastCommentTime[postId] < 1000) {
            return { data: { success: false, reason: 'duplicate' } };
        }
        mockLastCommentTime[postId] = now;

        const postIndex = mockCommunityFeed.findIndex(p => p.postId === postId);
        if (postIndex > -1) {
            if (!mockCommunityFeed[postIndex].commentsList) {
                mockCommunityFeed[postIndex].commentsList = [];
            }
            // Unique ID: timestamp + random suffix prevents key collisions even under rapid fire
            const uniqueId = `c${now}-${Math.random().toString(36).slice(2, 7)}`;
            const alias = getSessionAlias();
            const newComment = { id: uniqueId, alias, text: comment, timestamp: 'Just now' };
            mockCommunityFeed[postIndex].commentsList.push(newComment);
            mockCommunityFeed[postIndex].reactions.comments += 1;
            return { data: { success: true, comment: newComment } };
        }
        return { data: { success: false } };
    }
    return apiClient.post('/community/comment', { postId, comment });
};


export const reactToCommunityItem = async (postId, type) => {
    if (isMockAPI) {
        // ── Guard: one reaction per type per post per session ────────────────
        if (!mockReactedPosts[postId]) mockReactedPosts[postId] = new Set();
        if (mockReactedPosts[postId].has(type)) {
            return { data: { success: false, alreadyReacted: true } };
        }
        mockReactedPosts[postId].add(type);

        const postIndex = mockCommunityFeed.findIndex(p => p.postId === postId);
        if (postIndex > -1) {
            mockCommunityFeed[postIndex].reactions[type] += 1;
            return { data: { success: true, reactions: mockCommunityFeed[postIndex].reactions } };
        }
        return { data: { success: false } };
    }
    return apiClient.post('/community/react', { postId, type });
};

// ─── Pure helpers for cycle math ─────────────────────────────────────────────
const _daysBetween = (dateStrA, dateStrB) => {
    const a = new Date(dateStrA);
    const b = new Date(dateStrB);
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
};

const _addDays = (dateStr, n) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d;
};

const _fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const _calcPhase = (day, cycleLen) => {
    // Standard four-phase model (approximate)
    if (day <= 5)                          return 'Menstrual';
    if (day <= Math.round(cycleLen * 0.43)) return 'Follicular';
    if (day <= Math.round(cycleLen * 0.57)) return 'Ovulation';
    return 'Luteal';
};

export const fetchDashboardData = async (userId = "guest") => {
    if (isMockAPI) {
        const cycleLen = parseInt(mockProfileData.cycleLength) || 28;
        const today    = new Date().toISOString().split('T')[0];

        // ── Cycle day from real period start date ────────────────────────────
        const rawDay = _daysBetween(mockPeriodStartDate, today) + 1;  // day 1 = start date
        // If rawDay > cycleLen the cycle has wrapped; show new cycle day
        const currentDay = rawDay > cycleLen ? ((rawDay - 1) % cycleLen) + 1 : Math.max(1, rawDay);
        const cyclePhase = _calcPhase(currentDay, cycleLen);

        // ── Upcoming dates ───────────────────────────────────────────────
        // Next period = start of last period + cycleLen (or next cycle if already past)
        const daysIntoCycle = Math.max(1, rawDay);
        const daysUntilNext = cycleLen - daysIntoCycle + 1;
        const nextPeriodDate = _addDays(today, daysUntilNext);

        // Ovulation ≈ cycleLen − 14; fertile window is 5 days ending on ovulation
        const ovulationDay = cycleLen - 14;
        const daysToOvulation = ovulationDay - currentDay;
        const fertileStart = _addDays(today, Math.max(0, daysToOvulation - 4));
        const fertileEnd   = _addDays(today, Math.max(0, daysToOvulation));

        const dates = {
            nextPeriod:   _fmtDate(nextPeriodDate),
            fertileWindow: daysToOvulation > 0
                ? `${_fmtDate(fertileStart)} – ${_fmtDate(fertileEnd)}`
                : 'Next cycle',
            cyclePhase,
        };

        const cycleProgress = { currentDay, totalDays: cycleLen };

        // ── Dynamic recommendation based on real phase ──────────────────────
        const recRes = await fetchDailyRecommendation({
            userId, cycleDay: currentDay, phase: cyclePhase, symptoms: mockCurrentSymptoms
        });

        // ── Consistency graph ────────────────────────────────────────────
        const graphLabels = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            graphLabels.push(d.toLocaleString('default', { month: 'short' }).toUpperCase());
        }
        const consistencyGraph = [
            { h1: '80%', h2: '75%', d: '28d', l: graphLabels[0], p: 75 },
            { h1: '100%', h2: '83%', d: '29d', l: graphLabels[1], p: 83 },
            { h1: '75%',  h2: '66%', d: '27d', l: graphLabels[2], p: 66 },
            { h1: '83%',  h2: '80%', d: '28d', l: graphLabels[3], p: 80 },
            { h1: '100%', h2: `${mockConsistencyScore}%`, d: 'Current', l: graphLabels[4], p: mockConsistencyScore },
        ];

        // ── Health overview ───────────────────────────────────────────────
        const basePeriod = parseInt(mockProfileData.periodLength) || 5;
        const healthOverview = {
            averageCycleLength:  cycleLen,
            averagePeriodLength: basePeriod + (mockCurrentSymptoms.length > 2 ? 1 : 0),
            symptomsLogged:      mockTotalLogsCount,
            currentStreak:       mockCurrentStreak,
        };

        return {
            data: {
                profile: {
                    name:         mockProfileData.displayName || mockProfileData.name,
                    age:          mockProfileData.age,
                    stressLevel:  mockProfileData.stressLevel,
                    sleepHours:   mockProfileData.sleepHours,
                    exerciseFreq: mockProfileData.exerciseFreq,
                },
                upcomingDates: dates,
                cycleProgress,
                streak:       mockCurrentStreak,
                ritualStreaks: mockRitualStreaks,
                ritualCompletions: mockTodayCompletions,
                recommendation: recRes.data,
                consistencyGraph,
                pcodInsights:   generatePCODInsights(),
                healthOverview,
                communityPosts: [...mockCommunityFeed],
            }
        };
    }
    return apiClient.get('/dashboard/get', { params: { userId } });
};

export const fetchHistoryLogs = async () => {
    if (isMockAPI) {
        const logs = [];
        const types = ['flow', 'mood', 'symptoms', 'sleep', 'meds'];
        const valuePool = ['Heavy', 'Anxious', 'Bloating', '5 Hours', 'Multivitamin'];
        const activeDate = new Date();
        
        for (let i = 0; i < 15; i++) {
            const d = new Date(activeDate);
            // Stagger records roughly every 1.5 days conceptually
            d.setDate(activeDate.getDate() - Math.floor(i * 1.5));
            logs.push({
                id: `log-${i}`,
                date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                type: types[i % 5],
                val: valuePool[i % 5]
            });
        }
        return { data: logs };
    }
    return apiClient.get('/cycle/history');
};

export const fetchArticleMetadata = async (id) => {
    if (isMockAPI) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (id === 'article-123') {
                    resolve({ data: { 
                        title: 'The Power of Rest: Honoring Your Luteal Phase', 
                        content: '<p>The luteal phase is your body’s natural time to wind down. Progesterone rises, which can bring a sense of calm, but also fatigue as your body prepares for either pregnancy or menstruation.</p><h3>Why Rest Matters</h3><p>Honoring this time prevents burnout and supports hormonal balance.</p><ul><li><b>Prioritize Sleep</b>: Aim for 8-9 hours to support recovery.</li><li><b>Gentle Movement</b>: Swap rigorous cardio for yoga or stretching.</li><li><b>Warmth</b>: A warm bath and cozy environment soothe the nervous system.</li></ul><p>Listen to your body. Rest is not a luxury; it is a vital part of your cycle.</p>', 
                        author: 'Dr. Elena Rostova', 
                        phaseTag: 'Luteal', 
                        url: null 
                    }});
                } else {
                    resolve({ data: { 
                        title: 'Understanding Your Cycle (External)', 
                        url: 'https://www.womenshealth.gov/menstrual-cycle', 
                        phaseTag: 'General' 
                    }});
                }
            }, 800);
        });
    }
    return apiClient.get(`/recommendations/article?id=${id}`);
};

export const fetchHealthOverview = async (profileData = {}) => {
    if (isMockAPI) {
        // AI calculate dynamic factors based on base user profile length and logs
        const baseCycle = parseInt(profileData.cycleLength) || 28;
        const basePeriod = parseInt(profileData.periodLength) || 5;

        // Dynamic deviation:
        const dynamicCycle = baseCycle + Math.floor(mockCycleOffsetDays * 0.5); 
        const dynamicPeriod = basePeriod + (mockCurrentSymptoms.length > 2 ? 1 : 0);

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: {
                        averageCycleLength: dynamicCycle,
                        averagePeriodLength: dynamicPeriod,
                        symptomsLogged: mockTotalLogsCount,
                        currentStreak: mockCurrentStreak
                    }
                });
            }, 600); // Simulate network latency for smooth frontend animation
        });
    }
    return apiClient.post('/health/overview', { profileData });
};
