import { db } from './src/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function testPost() {
  const q = query(collection(db, 'companies'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return;
  const businessId = snap.docs[0].id;
  const userId = snap.docs[0].data().userId;

  try {
    const res = await fetch('http://localhost:3000/api/os/departments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `businessId=${businessId}; userId=${userId}`
      },
      body: JSON.stringify({ name: 'TestDept', description: 'Test', employeeIds: [] })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
    process.exit(0);
  } catch (e: any) {
    console.error(e.message);
    process.exit(1);
  }
}

testPost();
