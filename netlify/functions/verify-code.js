// netlify/functions/verify-code.js
// Checks the OTP code the user submitted against Twilio Verify

const twilio = require('twilio');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let phone, code;
  try {
    ({ phone, code } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!phone || !code) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Phone and code required' }) };
  }

  const cleaned = phone.replace(/\s/g, '');

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: cleaned, code: String(code) });

    if (result.status === 'approved') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, status: result.status })
      };
    }
  } catch (err) {
    console.error('Twilio error:', err.message);
    // Twilio throws a 404 if the code is wrong or expired
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
