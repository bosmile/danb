import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  "projectId": "studio-6183366381-f15fd",
  "appId": "1:866741763698:web:f8edddf0aa62bde6e2cceb",
  "apiKey": "AIzaSyBtR2SscBC1Gl6_4WRoD7TDZp3eInwcqEY",
  "authDomain": "studio-6183366381-f15fd.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "866741763698"
};

function initialize() {
    if (getApps().length) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

export function getUnauthenticatedFirestore() {
    return getFirestore(initialize());
}
