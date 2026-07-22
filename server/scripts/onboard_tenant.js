#!/usr/bin/env node

const https = require('https');

// Usage: node onboard_tenant.js "Institution Name" "slug" "admin@email.com" "FirstName" "LastName" "Password123"

const args = process.argv.slice(2);
if (args.length !== 6) {
  console.log('Usage: node onboard_tenant.js <InstitutionName> <slug> <email> <firstName> <lastName> <password>');
  console.log('Example: node onboard_tenant.js "Elite Coaching" "elite-coaching" "admin@elite.com" "Jane" "Doe" "SecurePass1!"');
  process.exit(1);
}

const [institutionName, slug, email, firstName, lastName, password] = args;

// Read secret from local .env if available, or fallback
require('dotenv').config({ path: __dirname + '/../.env' });
const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET;

if (!SUPERADMIN_SECRET) {
  console.error('❌ Error: SUPERADMIN_SECRET is missing from server/.env');
  process.exit(1);
}

const API_URL = 'https://ck-classes-erp-team.onrender.com/api/v1/tenants/register';

const payload = JSON.stringify({
  institutionName,
  slug,
  email,
  firstName,
  lastName,
  password
});

const url = new URL(API_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-superadmin-secret': SUPERADMIN_SECRET,
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Success! Tenant provisioned successfully:');
      console.log(JSON.parse(data).data);
    } else {
      console.error(`❌ Error (${res.statusCode}):`);
      try {
        console.error(JSON.parse(data).error.message);
      } catch (e) {
        console.error(data);
      }
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.write(payload);
req.end();
