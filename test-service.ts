require('dotenv').config();
import { db } from './src/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { ReportService } from './src/lib/services/ReportService';

async function testService() {
  try {
    const q = query(collection(db, 'companies'), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const id = snap.docs[0].id;
      const userId = snap.docs[0].data().userId;
      console.log('Generating report for business:', id);
      
      const report = await ReportService.generateReport(id, 'WEEKLY', userId);
      console.log('Report generated successfully!');
      console.log(report.id);
    }
  } catch (e) {
    console.error('Error generating report:', e);
  }
}

testService();
