require('dotenv').config();
import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function checkUser() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    usersSnapshot.forEach(doc => {
      console.log(`User: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
    });
    console.log('---');
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    companiesSnapshot.forEach(doc => {
      console.log(`Company: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
    });
  } catch(e) {
    console.error(e);
  }
}
checkUser();
