import { db } from './src/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function testRoute() {
  const q = query(collection(db, 'companies'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const id = snap.docs[0].id;
    const userId = snap.docs[0].data().userId;
    
    fetch('http://localhost:3000/api/os/workforce/employee', {
      method: 'GET',
      headers: {
        'Cookie': `businessId=${id}; userId=${userId}`
      }
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
}

testRoute();
