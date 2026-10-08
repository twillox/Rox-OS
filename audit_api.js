import http from 'http';

const checkRoute = (path) => {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      resolve({ path, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ path, status: 'error', message: e.message });
    });
  });
};

async function runAudit() {
  const routes = [
    '/api/os/workforce/employee',
    '/api/os/voice',
    '/api/os/workforce/departments',
    '/api/os/boardroom/meetings',
    '/api/os/workforce/hire',
  ];
  
  console.log('Running API audit...');
  for (const route of routes) {
    const res = await checkRoute(route);
    console.log(`[${res.status}] ${res.path}`);
  }
}

runAudit();
