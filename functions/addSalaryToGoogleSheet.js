import { serve } from "https://deno.land/std@0.113.0/http/server.ts";
import { google } from "https://deno.land/x/googleapis@0.1.0/mod.ts";

serve(async (req) => {
  try {
    const { transactionData } = await req.json();

    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const client = await auth.getClient();

    const sheets = google.sheets({ version: "v4", auth: client });

    const spreadsheetId = "1BZrBitd2uphGIciHWVnx9JEjMpjx5v73NRpjjTChnJ4"; // Replace with your Google Sheet ID
    const range = "Sheet1"; // Adjust the range as necessary

    const values = [
      [
        transactionData.employeeName,
        transactionData.transactionAmount,
        transactionData.transactionDate,
        transactionData.transactionNumber,
        transactionData.receiptUrl,
      ],
    ];

    const resource = {
      values,
    };

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      resource,
    });

    return new Response(JSON.stringify({ status: "success", data: response.data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error adding data to Google Sheets:", error);
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});