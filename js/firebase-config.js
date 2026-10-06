const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDKtzMgOdFDP10rurlQiu7qzvJ01dOPwDI",
  authDomain: "vispora-87e0b.firebaseapp.com",
  projectId: "vispora-87e0b",
  storageBucket: "vispora-87e0b.firebasestorage.app",
  messagingSenderId: "70942466391",
  appId: "1:70942466391:web:2a82c398d6a6ad73aa9e12",
  measurementId: "G-X975FHZNPJ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

window.VFirebase = {
  auth: firebase.auth(),
  db:   firebase.firestore(),
};
