/**
 * Comprehensive Validation Suite for Telegram Bot & PixelMind AI Integration
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api/v1';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING TELEGRAM BOT & PIXELMIND AI INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test Group 1: Telegram Service Diagnostic & Status Endpoint
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: Telegram Status & Configuration ---');
    const statusRes = await request('GET', '/telegram/status');
    assert(statusRes.status === 200, 'GET /telegram/status returned 200 OK');
    assert(statusRes.data.status === 'success', 'Status response contains success');
    assert(statusRes.data.data.defaultApplicantId === 'demo-applicant-123', 'Default applicant is Rahul Sharma (demo-applicant-123)');

    // -------------------------------------------------------------
    // Test Group 2: Basic Welcome & Slash Commands
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Greeting & Commands via Telegram ---');
    
    // /start command
    const startRes = await request('POST', '/telegram/simulate', {
      text: '/start',
      userId: 123456789,
      chatId: 123456789,
      username: 'rahul_telegram',
    });
    assert(startRes.status === 201 || startRes.status === 200, 'POST /telegram/simulate (/start) returned 200/201');
    assert(startRes.data.handled === true, '/start handled successfully');

    // /status command
    const cmdStatusRes = await request('POST', '/telegram/simulate', {
      text: '/status',
      userId: 123456789,
      chatId: 123456789,
    });
    assert(cmdStatusRes.data.handled === true, '/status command returned live status');

    // /help command
    const helpRes = await request('POST', '/telegram/simulate', {
      text: '/help',
      userId: 123456789,
      chatId: 123456789,
    });
    assert(helpRes.data.handled === true, '/help command handled successfully');

    // -------------------------------------------------------------
    // Test Group 3: Natural Language Reasoning & Live Applicant Records
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Live Applicant Data via Telegram ---');

    // Query 1: Uploaded documents
    const docQueryRes = await request('POST', '/ai/chat', {
      applicantId: 'demo-applicant-123',
      message: 'Which documents have I uploaded?',
    });
    assert(docQueryRes.status === 200 || docQueryRes.status === 201, 'Document query processed by AI');
    const docReply = docQueryRes.data.message || '';
    assert(
      docReply.toLowerCase().includes('degree') ||
      docReply.toLowerCase().includes('rnsit') ||
      docReply.toLowerCase().includes('german') ||
      docReply.toLowerCase().includes('goethe') ||
      docReply.toLowerCase().includes('b2'),
      'AI response cites Rahul Sharma actual verified documents'
    );

    // Query 2: Missing requirements
    const missingQueryRes = await request('POST', '/ai/chat', {
      applicantId: 'demo-applicant-123',
      message: 'What is missing for my German application?',
    });
    assert(missingQueryRes.status === 200 || missingQueryRes.status === 201, 'Missing items query processed');
    const missingReply = missingQueryRes.data.message || '';
    assert(missingReply.length > 20, 'AI returned detailed requirement analysis');

    // Query 3: Eligibility question
    const eligQueryRes = await request('POST', '/ai/chat', {
      applicantId: 'demo-applicant-123',
      message: 'Am I eligible to work at BMW in Germany?',
    });
    assert(eligQueryRes.status === 200 || eligQueryRes.status === 201, 'Eligibility query processed');
    const eligReply = eligQueryRes.data.message || '';
    assert(eligReply.length > 30, 'AI returned eligibility assessment');

    // -------------------------------------------------------------
    // Test Group 4: Webhook Payload Ingestion & Deduplication
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Telegram Webhook Ingestion ---');
    
    const updateId = Date.now();
    const webhookRes = await request('POST', '/telegram/webhook', {
      update_id: updateId,
      message: {
        message_id: 42,
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Rahul',
          username: 'rahul_s',
        },
        chat: {
          id: 123456789,
          type: 'private',
          first_name: 'Rahul',
        },
        date: Math.floor(Date.now() / 1000),
        text: 'What is my career goal?',
      },
    });

    assert(webhookRes.status === 200, 'POST /telegram/webhook returned 200 OK');
    assert(webhookRes.data.ok === true, 'Webhook acknowledged update');
    assert(webhookRes.data.handled === true, 'Webhook processed message successfully');

    // Invalid payload test
    const invalidWebhookRes = await request('POST', '/telegram/webhook', { foo: 'bar' });
    assert(invalidWebhookRes.status === 200, 'Invalid webhook handled gracefully with 200 (prevents retry loop)');
    assert(invalidWebhookRes.data.status === 'ignored_invalid_payload', 'Invalid payload flagged correctly');

    // -------------------------------------------------------------
    // Test Group 5: Clear Conversation Context via Telegram
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: /clear in Telegram ---');
    const clearRes = await request('POST', '/telegram/simulate', {
      text: '/clear',
      userId: 123456789,
      chatId: 123456789,
    });
    assert(clearRes.data.handled === true, '/clear handled successfully');

    // Verify profile is intact after clear
    const profileAfterClear = await request('GET', '/applicants/demo-applicant-123/profile');
    assert(profileAfterClear.status === 200, 'Applicant profile intact after Telegram clear');
    const profileObj = profileAfterClear.data?.data || profileAfterClear.data;
    assert(
      profileObj?.education?.institution === 'RNSIT' ||
      profileObj?.additionalInfo?.personal?.fullName === 'Rahul Sharma' ||
      profileObj?.skills?.length > 0,
      'Rahul Sharma verified records preserved'
    );

    // -------------------------------------------------------------
    // Test Group 6: Existing Features Regression Check
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Existing System Integrity ---');
    
    // Website chat
    const webChatRes = await request('POST', '/ai/chat', {
      applicantId: 'demo-applicant-123',
      message: 'Hello from website chat',
    });
    assert(webChatRes.status === 200 || webChatRes.status === 201, 'Website AI chat works concurrently');

    // Requirements generation
    const reqGenRes = await request('POST', '/ai/requirements/generate', {
      careerGoal: 'Registered Nurse in Germany',
    });
    const reqList = reqGenRes.data?.proposedRequirements || reqGenRes.data?.requirements || reqGenRes.data?.data?.requirements;
    assert(Array.isArray(reqList) && reqList.length > 0, 'Requirements generator returned structured items');

  } catch (err) {
    console.error('💥 Test suite crashed:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
