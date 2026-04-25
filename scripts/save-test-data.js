/**
 * Script per salvare i dati dei residenti dall'app e usarli nei test
 */

// 1. Salva i dati dall'applicazione
const saveTestData = () => {
  // Esegui questo nella console del browser sull'app principale
  const residents = window.__CHARACTER_MANAGER_RESIDENTS__ || 
                    JSON.parse(localStorage.getItem('character_manager_residents') || '[]');
  
  console.log('📋 Found residents:', residents.length);
  residents.forEach(r => console.log(`   - ${r.name || r.label}`));
  
  // Copia questo output e salvalo in un file
  const testData = {
    residents: residents,
    timestamp: new Date().toISOString()
  };
  
  console.log('📄 Copy this data:');
  console.log(JSON.stringify(testData, null, 2));
};

// 2. Carica i dati nel test
const loadTestData = (testData) => {
  // Questo verrà usato nel test Playwright
  return testData.residents;
};
