import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isMock = !firebaseConfig.apiKey;

let auth;
if (!isMock) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export const loginUser = async (email, password) => {
  if (isMock) {
    const token = 'mock-jwt-token-123';
    localStorage.setItem('predict_her_token', token);
    return { user: { email, uid: 'mock-uid-999', displayName: 'Maya (Mock User)' }, token };
  } else {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem('predict_her_token', token);
    return { user: userCredential.user, token };
  }
};

export const signupUser = async (name, email, password) => {
  if (isMock) {
    const token = `mock-jwt-${Date.now()}`;
    localStorage.setItem('predict_her_token', token);
    return { user: { email, uid: `uid-${Date.now()}`, displayName: name } };
  } else {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await fbUpdateProfile(cred.user, { displayName: name });
    const token = await cred.user.getIdToken();
    localStorage.setItem('predict_her_token', token);
    return { user: cred.user, token };
  }
};

export const logoutUser = async () => {
  localStorage.removeItem('predict_her_token');
  if (!isMock && auth) {
    await firebaseSignOut(auth);
  }
};

export const subscribeToAuthChanges = (callback) => {
  if (isMock) {
    const mockUser = localStorage.getItem('predict_her_token') ? { email: 'mock@example.com', uid: 'mock-uid-999', displayName: 'Maya (Mock User)' } : null;
    callback(mockUser);
    return () => {}; // mock unsubscribe
  } else {
    return onAuthStateChanged(auth, callback);
  }
};

export const getAuthToken = async () => {
    if (isMock) return localStorage.getItem('predict_her_token');
    if (auth?.currentUser) {
        return await auth.currentUser.getIdToken();
    }
    return null;
};
