import Tesseract from "tesseract.js";
import { extractTransactionDetails } from "./utils.js";

export async function processReceiptImage(imageUrl) {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imageUrl, "eng");

    const transactionDetails = extractTransactionDetails(text);
    return transactionDetails;
  } catch (error) {
    console.error("OCR Processing Error:", error);
    return null;
  }
}
