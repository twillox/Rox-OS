require('dotenv').config();
import { db } from './src/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

async function clearPredefinedDepartments() {
  try {
    const snap = await getDocs(collection(db, 'companies'));
    if (snap.empty) {
      console.log('No companies found.');
      return;
    }
    
    for (const companyDoc of snap.docs) {
      const businessId = companyDoc.id;
      
      // Get all employees and remove departmentId
      const empSnap = await getDocs(collection(db, 'employees'));
      for (const empDoc of empSnap.docs) {
        const empData = empDoc.data();
        if (empData.businessId === businessId && empData.departmentId) {
          await updateDoc(doc(db, 'employees', empDoc.id), { departmentId: null });
        }
      }
      
      // Delete all departments
      const deptSnap = await getDocs(collection(db, 'departments'));
      for (const deptDoc of deptSnap.docs) {
        if (deptDoc.data().businessId === businessId) {
          await deleteDoc(doc(db, 'departments', deptDoc.id));
        }
      }
      
      console.log(`Cleared predefined departments for business ${businessId}`);
    }
  } catch (e) {
    console.error('Error clearing departments:', e);
  }
}

clearPredefinedDepartments();
