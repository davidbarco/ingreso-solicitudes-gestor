import React from 'react';
import { Layout } from 'lucide-react';
import MultiStepForm from './components/MultiStepForm';

function App() {
  return (
    <div className="app-container">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '3rem',
        padding: '1rem 0',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: 'var(--primary)', 
            padding: '0.5rem', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <Layout size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.4rem' }}>Ingreso de solicitudes</h1>
        </div>

      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ 
          marginBottom: '2rem' 
        }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Solicitud de Reembolso</h2>
          <p>Sigue los pasos para gestionar tu nueva solicitud médica.</p>
        </div>

        <MultiStepForm />
      </main>

      <style jsx="true">{`
        .app-container {
          min-height: 100vh;
          padding-bottom: 4rem;
        }
      `}</style>
    </div>
  );
}

export default App;
