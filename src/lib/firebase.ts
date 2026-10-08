import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBjOV47XytBvKHSAMeYcGxd9Nu9Z4hv_xs",
  authDomain: "roxten-os.firebaseapp.com",
  projectId: "roxten-os",
  storageBucket: "roxten-os.firebasestorage.app",
  messagingSenderId: "751961467176",
  appId: "1:751961467176:web:32d0d8ca1b8410914e881d",
  measurementId: "G-3SEP213C7H"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
