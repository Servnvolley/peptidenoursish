const twilio = require('twilio');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Log env vars presence (not values) for debugging
  console.log('ENV CHECK:', {
    hasSID: !!process.env.TWILIO_ACCOUNT_SID,
    hasToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasVerify: !!process.env.TWILIO_VERIFY_SID,
    verifySID: process.env.TWILIO_VERIFY_SID
  });

  let phone;
  try {
    ({ phone } = JSON.parse(event.body));
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!phone) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Phone number required' }) };
  }

  const cleaned = phone.replace(/\s/g, '');

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SID) {
    console.error('Missing environment variables');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error — missing credentials' }) };
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: cleaned, channel: 'sms' });

    console.log('Verification status:', verification.status);
    return {
      statusCode: 200,
      body: JSON.stringify({ status: verification.status })
    };
  } catch (err) {
    console.error('Twilio error:', err.message, err.code);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
