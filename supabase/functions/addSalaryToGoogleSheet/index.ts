import { google } from 'npm:googleapis';
// Function to format date to YYYY-MM-DD HH:MM:SS
const formatDate = (date: Date): string => {
  return date.toISOString().replace('T', ' ').split('.')[0];
};

// Main function
Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    // Get transaction data from request
    const { transactionData } = await req.json();

    // Format current timestamp
    const timestamp = formatDate(new Date());

    // Prepare the data for Google Sheets
    const values = [
      timestamp,
      transactionData.employeeName,
      transactionData.designation || 'N/A',
      transactionData.transactionNumber,
      transactionData.transactionAmount.toString(),
      formatDate(new Date(transactionData.transactionDate)),
      transactionData.createdBy || 'System',
      transactionData.receiptUrl || 'No Receipt'
    ];

    // Get credentials from environment variables
    const credentials = {
      client_email: "supabase-salary-sheet@healthy-feat-453411-g7.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDHWrBWu8sMzm+D\n047YZ1ZhQ9TmVpDVO8rkWG0NMUziCh3XRGqbKiD9vtVrCShyzVJ6wP8Ik/e2Uet1\nqnhkjBFlMnoBdwXjGZ0eJnZ47SFnD2UNtmfoUNbsiJgnIsknl11YmrOXKoS0xtpr\n4y6NPhr3jH6/QpUSDK0iNrw6rQN1Vv77bSWNBD4i9HHS7yuoDxtcFQh2gvcIztsz\nRqYMUsIs8Pd3RWZgTyDqo0XQrUQd1oc/CN+XRt5eVR+EgqyOjeMPiSMP/HgbFXvq\ntGtl7S90ii/j2izDhu6w+nfJ82N7UdhOJhvEajrwzpt7Vk2wMEV1PtfqH1voNYyo\n66rHqLNzAgMBAAECggEABFjI4YtEuSnDKrexNKzEKGjHOqKGk++y09nNvuzlRUR9\nNBVs0adQgtfnZWcUt7QcaUrOBMzdKN+OZ8loyKB5PKCmImQK/9GuKFskWCyrfsjK\nJktk5p7koNG1p5zNkAxv35+37MLjk+GGH7YbbL7+7YjltpvoDjWyjL1uy0S8f5F1\nHrBw/puC2Ngr4GIw8qe+CVeMnsv83bsk1NwNINDNIBX82JaueFlJ6UVndu5oWBBA\nKzeJt34XqUcgMJKvR/BnbhAbaht4hrzWgnFlDgopnIV37OlYPgypTtYEdPnI+Cg7\nUW0R1cU5zdwzxg3fM9LBaMQ3X+mgyvrWaJz7TFp9iQKBgQD/fHY9TR1bPOfnm0rO\nT3rDe1MElU5jQqqe3/5KWtkCvn05+xT1Ho5DVDU8YVtLrAbe3Ev5ZD6GubhttlB/\nPPTS1CGM0BFroqyeFOo4TgkjiJzAJZ8jd2x2BEgj2ZbunXrXdn/xtybh3R8hmyUz\nY3SPRe8y7ICOApR/0C7F+NIZPwKBgQDHwVPC+ntRMGQxQuqH1MiHseVQUCrI2gZl\nh0GNhQ9YcUxXFuCIXH1H5nOjQuoyC5ddPVlORyGTDaFEwmUUqfky5xwUsENu9qR6\nW87yhdkAg0qxEDswGfWusArGDmoU2sIjHuE8WnbW0nmeYCptqEjWVm6cjDhiqJs/\ndtql3hqEzQKBgH46hEDtZN+7S+kGtQMSCdmjiPTuv/gS7DHrAbzC/g15CG4pO8WP\n/0IMzPC0OWM973cU6QSjHrF5+UFbnpH/EAdKf/kOpEzF5vuD4eVHyQQhbzEQZXwk\neRYmL25nB0eFzze9eKF4mGFn2wXDnbGyJdjT+Mb0St/fLnen6DQwJ74JAoGASQX9\nruuOpTGBjxidUCaTYDfCUsfbvC0n5Xm6lxercnOIqtWsI21cRyqR338Yyk6+eNFy\nklEijvWOnOpLtXAlr1wZQd7l5+y2WByz3KjdmXhll7ENUhpLXB7y8VBXq2QFUH17\nbWrMwt+SojkZiZjZd7GFIimIe1iT2HGEoNo+64kCgYBz6xrf1CnSxkduqXWT/Ajr\ncld46Nq8FXRsyTIAtOhncFoIDuetMbWSoFzZdKKlVdm6gSrEC9Ua2fpxQOYFw/W2\npPhNTzpamuCcezFdxjENqhBCFPBqANZm1q2aTU1fmTeYnOM11XKbJAelwm/B1yUK\npSCLcxVlVK/TA5GbxuNpXw==\n-----END PRIVATE KEY-----",
      sheet_id: "1BZrBitd2uphGIciHWVnx9JEjMpjx5v73NRpjjTChnJ4"
    };

    // Verify credentials
    if (!credentials.client_email || !credentials.private_key || !credentials.sheet_id) {
      throw new Error('Missing required credentials');
    }

    // Initialize Google Sheets API
    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // Append data to sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: credentials.sheet_id,
      range: 'Sheet1!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: [values]
      }
    });

    return new Response(
      JSON.stringify({
        status: 'success',
        data: response.data,
        timestamp
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});