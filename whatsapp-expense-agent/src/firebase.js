import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function getExpenseSummary(category, period) {
  const transactionsRef = collection(db, "transactions");
  const q = query(transactionsRef, where("category", "==", category));
  const querySnapshot = await getDocs(q);

  let total = 0;
  querySnapshot.forEach((doc) => (total += doc.data().amount));

  return `Total spent on ${category} in ${period}: ₹${total}`;
}

export async function recordTransaction(date, category, amount) {
  await addDoc(collection(db, "transactions"), { date, category, amount });
  return `Transaction recorded: ₹${amount} for ${category} on ${date}.`;
}
