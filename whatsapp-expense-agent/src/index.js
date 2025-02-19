import express from "express";
import { processUserQuery } from "./agent.js";
import { sendWhatsAppMessage } from "./engagespot.js";
import { recordTransaction } from "./firebase.js";
import { processReceiptImage } from "./ocr.js";

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const { message, from } = req.body;
    if (!message) return res.status(400).send("No message received");

    let response;

    if (message.image) {
      // Process receipt image
      const transactionDetails = await processReceiptImage(message.image.url);
      if (transactionDetails.amount) {
        await recordTransaction(
          transactionDetails.date,
          transactionDetails.merchant,
          transactionDetails.amount
        );
        response = `Transaction recorded: ₹${transactionDetails.amount} at ${transactionDetails.merchant} on ${transactionDetails.date}.`;
      } else {
        response = "Could not extract transaction details from the image.";
      }
    } else {
      // Process text-based messages
      response = await processUserQuery(message.text);
    }

    await sendWhatsAppMessage(from, response);
    res.status(200).json({ reply: response });
  } catch (error) {
    console.error("Error in webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
