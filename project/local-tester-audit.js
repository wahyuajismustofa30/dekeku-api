import fs from 'fs';

async function auditLocalTester() {
  const baseUrl = 'https://dekeku-api-dev.wahyuajismustofa30.workers.dev';
  console.log('--- DEKEKU LOCAL TESTER AUDIT ---');
  
  try {
    // 1. Test Root HTML (Tester)
    console.log('Audit 1: GET / (HTML Tester)');
    const resHtml = await fetch(`${baseUrl}/`);
    const contentType = resHtml.headers.get('content-type');
    console.log(`Result: ${resHtml.status} ${resHtml.statusText}`);
    console.log(`Content-Type: ${contentType}`);
    
    if (resHtml.status === 200 && contentType?.includes('text/html')) {
      console.log('SUCCESS: Tester dashboard served.');
    } else {
      console.error('ERROR: Failed to serve HTML tester.');
    }

    // 2. Test Error Logging (Trigger 404)
    console.log('\nAudit 2: GET /non-existent (Error Logging)');
    const res404 = await fetch(`${baseUrl}/non-existent`);
    const data404 = await res404.json();
    console.log(`Result: ${res404.status} ${res404.statusText}`);
    console.log('Payload:', JSON.stringify(data404));

    if (res404.status === 404 && data404.success === false) {
      console.log('SUCCESS: 404 Error handled and logged correctly.');
    } else {
      console.error('ERROR: 404 Error NOT handled correctly.');
    }

    // 3. Test Invalid Auth (Trigger 401)
    console.log('\nAudit 3: POST /api/v1/admin/write/create (Unauthorized)');
    const res401 = await fetch(`${baseUrl}/api/v1/admin/write/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'test.json', content: {} })
    });
    const data401 = await res401.json();
    console.log(`Result: ${res401.status} ${res401.statusText}`);
    console.log('Payload:', JSON.stringify(data401));

    if (res401.status === 401) {
      console.log('SUCCESS: Auth failure handled and logged correctly.');
    }

  } catch (err) {
    console.error('\nFATAL AUDIT ERROR:');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.log('\nTIP: Make sure "npx wrangler dev" is running locally.');
  }
}

auditLocalTester();
