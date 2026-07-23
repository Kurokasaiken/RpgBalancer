import React from 'react';
import { HaloCoronaLab } from './HaloCoronaLab';

export const HaloCoronaTestPage: React.FC = () => (
  <div style={{ minHeight: '100vh', padding: '40px 24px', background: 'rgba(20,15,10,0.95)' }}>
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: 'rgba(210,180,150,0.9)', textAlign: 'center', marginBottom: 40 }}>
        HaloCorona Test
      </h1>
      <HaloCoronaLab />
    </div>
  </div>
);

export default HaloCoronaTestPage;
