import { db } from './src/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function testReport() {
  const q = query(collection(db, 'companies'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const id = snap.docs[0].id;
    const userId = snap.docs[0].data().userId;
    console.log('Found businessId:', id, 'userId:', userId);
    
    fetch('http://localhost:3000/api/os/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `businessId=${id}; userId=${userId}`
      },
      body: JSON.stringify({ timeframe: 'WEEKLY' })
    })
    .then(async res => {
      console.log(`Status: ${res.status}`);
      console.log('Response:', await res.text());
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
  } else {
    console.log('No companies found');
    process.exit(0);
  }
}

testReport();
