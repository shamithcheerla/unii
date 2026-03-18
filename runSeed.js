
import { seedDatabase } from './src/services/seedData.js';

seedDatabase().then(() => {
  console.log('Seeding complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
