import dotenv from "dotenv";
import OpenAI from "openai";
import { getExpenseSummary, recordTransaction } from "./firebase.js";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processUserQuery(userInput) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "You are an AI assistant for expense tracking.",
      },
      { role: "user", content: userInput },
    ],
    functions: [
      {
        name: "get_expense_summary",
        description: "Fetches total expenses by category and time.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string" },
            period: { type: "string" },
          },
        },
      },
      {
        name: "record_transaction",
        description: "Records a new transaction.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string" },
            category: { type: "string" },
            amount: { type: "number" },
          },
        },
      },
    ],
  });

  const functionCall = response.choices[0].message.function_call;
  if (functionCall) {
    const args = JSON.parse(functionCall.arguments);
    if (functionCall.name === "get_expense_summary")
      return getExpenseSummary(args.category, args.period);
    if (functionCall.name === "record_transaction") {
      const args = JSON.parse(functionCall.arguments);
      const category = categorizeTransaction(args);
      return recordTransaction(args.date, category, args.amount);
    }
  }
  return "I can track expenses! Ask me about your spending.";
}
