async function testReports() {
  try {
    const res = await fetch('http://localhost:3000/api/os/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Need to pass cookie since the route checks cookieStore
        'Cookie': 'businessId=system;'
      },
      body: JSON.stringify({ timeframe: 'WEEKLY' })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testReports();
