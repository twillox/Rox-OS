import { db } from './src/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function getBusinessId() {
  const q = query(collection(db, 'companies'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const id = snap.docs[0].id;
    console.log('Found businessId:', id);
    return id;
  }
  console.log('No companies found');
  return null;
}

getBusinessId().then(id => {
  if (id) {
    fetch('http://localhost:3000/api/os/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `businessId=${id};`
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
    process.exit(0);
  }
});
