// netlify/functions/send-code.js
// Sends a Twilio Verify OTP to the provided phone number

const twilio = require('twilio');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let phone;
  try {
    ({ phone } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!phone) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Phone number required' }) };
  }

  // Sanitize â€” must start with + and contain only digits after
  const cleaned = phone.replace(/\s/g, '');
  if (!/^\+\d{7,15}$/.test(cleaned)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Phone must be in E.164 format, e.g. +15551234567' })
    };
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: cleaned, channel: 'sms' });

    return {
      statusCode: 200,
      body: JSON.stringify({ status: verification.status }) // 'pending'
    };
  } catch (err) {
    console.error('Twilio error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
