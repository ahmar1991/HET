import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function sendWhatsAppMessage(recipient, message) {
  try {
    const response = await axios.post(
      "https://api.engagespot.co/v3/notifications",
      {
        recipients: [recipient], // Ensure this is an array
        notification: {
          title: message,
        },
      },
      {
        headers: {
          "X-ENGAGESPOT-API-KEY": process.env.ENGAGESPOT_API_KEY,
          "X-ENGAGESPOT-API-SECRET": process.env.ENGAGESPOT_API_SECRET,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("WhatsApp API Error:", error.response?.data || error.message);
    throw new Error("Failed to send WhatsApp message.");
  }
}
