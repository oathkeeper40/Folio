import Rebase from "re-base";
import firebase from "@firebase/app";
import "@firebase/firestore";

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
};

const app = firebase.initializeApp(config);
const base = Rebase.createClass(app.database());
const store = Rebase.createClass(app.firestore());

const GoogleProvider = new firebase.auth.GoogleAuthProvider();

export { app, base, config, store, GoogleProvider };
