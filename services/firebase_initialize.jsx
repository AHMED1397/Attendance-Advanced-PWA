import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDo8YLK8AWsEfYY_CVCN7iRdfoF8C26viE",
  authDomain: "attendance-final-54fa1.firebaseapp.com",
  databaseURL: "https://attendance-final-54fa1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "attendance-final-54fa1",
  storageBucket: "attendance-final-54fa1.firebasestorage.app",
  messagingSenderId: "326125956816",
  appId: "1:326125956816:web:3faa240688a2943d36f8d5"
};


const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
export default db