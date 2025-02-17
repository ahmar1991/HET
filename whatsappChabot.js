import { Engagespot } from "engagespot";
import { Agent, Tool } from "envoyjs";
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import Tesseract from "tesseract.js";
import {
  categorizeTransaction,
  extractTransactionDetails,
  sendEmail,
} from "./utils";

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Engagespot for WhatsApp & Email notifications
const engagespot = new Engagespot({ apiKey: "YOUR_ENGAGESPOT_API_KEY" });

// Define tools for the agent
const OCRProcessor = new Tool({
  name: "ocr_processor",
  description:
    "Extracts text from receipt images using Tesseract.js and processes transaction details.",
  function: async (imageUrl) => {
    const {
      data: { text },
    } = await Tesseract.recognize(imageUrl, "eng");
    const transactionDetails = extractTransactionDetails(text);
    return transactionDetails;
  },
});

const Categorizer = new Tool({
  name: "transaction_categorizer",
  description: "Categorizes transactions into different spending categories.",
  function: async (transaction) => {
    return categorizeTransaction(transaction);
  },
});

const ExpenseSummarizer = new Tool({
  name: "expense_summarizer",
  description:
    "Fetches and summarizes expenses based on category and time period.",
  function: async ({ category, period }) => {
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef, where("category", "==", category));
    const querySnapshot = await getDocs(q);
    let total = 0;
    querySnapshot.forEach((doc) => {
      total += doc.data().amount;
    });
    return `Total spent on ${category} in ${period}: ₹${total}`;
  },
});

const AlertManager = new Tool({
  name: "spending_alert",
  description:
    "Sets up alerts for spending limits on categories like Swiggy, Uber, etc.",
  function: async ({ category, limit }) => {
    return `Alert set! You'll be notified if ${category} expenses exceed ₹${limit}.`;
  },
});

const CSVExporter = new Tool({
  name: "csv_exporter",
  description: "Exports transaction history to CSV and sends it via email.",
  function: async ({ email }) => {
    const csvData = "Date,Category,Amount\n01-02-2025,Food,₹500"; // Placeholder data
    await sendEmail(email, "Your Expense Report", csvData);
    return `CSV sent to ${email}.`;
  },
});

const TransactionRecorder = new Tool({
  name: "transaction_recorder",
  description: "Records transactions into Firestore.",
  function: async ({ date, category, amount }) => {
    await addDoc(collection(db, "transactions"), { date, category, amount });
    return `Transaction recorded: ₹${amount} for ${category} on ${date}.`;
  },
});

// Define the AI agent
const ExpenseAgent = new Agent({
  name: "ExpenseTrackerAI",
  description:
    "An AI agent that helps track expenses, set alerts, and generate reports.",
  tools: [
    OCRProcessor,
    Categorizer,
    ExpenseSummarizer,
    AlertManager,
    CSVExporter,
    TransactionRecorder,
  ],
  async respond(userInput) {
    if (userInput.includes("spent on")) {
      return this.useTool("expense_summarizer", {
        category: "food",
        period: "this month",
      });
    } else if (userInput.includes("alert me")) {
      return this.useTool("spending_alert", {
        category: "Swiggy",
        limit: 5000,
      });
    } else if (userInput.includes("send CSV")) {
      return this.useTool("csv_exporter", { email: "user@example.com" });
    } else if (userInput.includes("record transaction")) {
      return this.useTool("transaction_recorder", {
        date: "01-02-2025",
        category: "Food",
        amount: 500,
      });
    } else if (userInput.includes("extract text from image")) {
      return this.useTool("ocr_processor", userInput.imageUrl);
    } else {
      return "I can help track expenses! Try asking about your spending or setting an alert.";
    }
  },
});

// Handle incoming WhatsApp messages via Engagespot
engagespot.onMessage(async (message) => {
  const response = await ExpenseAgent.respond(message.text);
  engagespot.sendMessage(message.from, response);
});

console.log("ExpenseTrackerAI is running...");
