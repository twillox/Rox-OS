const fetch = require('node-fetch');

async function testApi() {
  try {
    // We need to bypass or supply a businessId cookie.
    // The API uses `const cookieStore = await cookies(); const businessId = cookieStore.get('businessId')?.value;`
    // We can just send a Cookie header.
    const res = await fetch('http://localhost:3000/api/os/voice/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'businessId=system'
      },
      body: JSON.stringify({ employeeId: 'jarvis' })
    });
    
    const text = await res.text();
    console.log('START API Response:', res.status, text);

    if (res.ok) {
       const data = JSON.parse(text);
       const turnRes = await fetch('http://localhost:3000/api/os/voice/session/turn', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Cookie': 'businessId=system'
         },
         body: JSON.stringify({ sessionId: data.id, text: 'Hello' })
       });
       const turnText = await turnRes.text();
       console.log('TURN API Response:', turnRes.status, turnText);
    }
  } catch (e) {
    console.error(e);
  }
}
testApi();
