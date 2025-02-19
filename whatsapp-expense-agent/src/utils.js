import nodemailer from "nodemailer";

export function extractTransactionDetails(text) {
  const amountRegex = /\b(?:Rs|₹)?\s*(\d{1,7}(?:\.\d{1,2})?)\b/;
  const dateRegex = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/;
  const merchantRegex =
    /(Swiggy|Zomato|Amazon|Uber|Flipkart|GPay|Paytm|PhonePe|McDonald's)/i;

  const amountMatch = text.match(amountRegex);
  const dateMatch = text.match(dateRegex);
  const merchantMatch = text.match(merchantRegex);

  return {
    amount: amountMatch ? parseFloat(amountMatch[1]) : null,
    date: dateMatch ? dateMatch[1] : "Unknown",
    merchant: merchantMatch ? merchantMatch[1] : "Other",
  };
}

export function categorizeTransaction(transaction) {
  const categories = {
    Food: ["Swiggy", "Zomato", "McDonald's", "Domino's"],
    Shopping: ["Amazon", "Flipkart", "Myntra"],
    Transport: ["Uber", "Ola", "Fuel"],
    Bills: ["Electricity", "Water", "Gas", "DTH"],
  };

  for (const [category, merchants] of Object.entries(categories)) {
    if (merchants.some((m) => transaction.merchant == m)) {
      return category;
    }
  }
  return "Miscellaneous";
}

// Send email with transaction CSV
export async function sendEmail(to, subject, csvContent) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject,
    text: "Please find your expense report attached.",
    attachments: [
      {
        filename: "transactions.csv",
        content: csvContent,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  return "Email sent successfully.";
}
