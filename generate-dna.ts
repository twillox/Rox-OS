require('dotenv').config();
import { db } from './src/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { IntelligenceService } from './src/lib/services/IntelligenceService';

async function generateMissingDNA() {
  const snap = await getDocs(query(collection(db, 'companies')));
  for (const doc of snap.docs) {
    const businessId = doc.id;
    console.log(`Checking DNA for business: ${businessId}`);
    
    // Attempt to generate DNA (it will overwrite or create)
    const dna = await IntelligenceService.generateCompanyDNA(businessId);
    if (dna) {
      console.log(`Successfully generated DNA for ${businessId}: ${(dna as any).mission?.substring(0, 50) || 'N/A'}...`);
    } else {
      console.log(`No knowledge/insights available to generate DNA for ${businessId}.`);
    }
  }
}

generateMissingDNA().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
