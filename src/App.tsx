import { Layout } from 'lucide-react';
import MultiStepForm from './components/MultiStepForm';

function App() {
  return (
    <div className="min-h-screen pb-16">
      <header className="flex justify-between items-center mb-12 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2 rounded-lg flex items-center">
            <Layout size={24} color="white" />
          </div>
          <h1 className="text-[1.4rem]">Ingreso de solicitudes</h1>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto">
        <div className="mb-8">
          <h2 className="text-[1.8rem] mb-2">Solicitud de Reembolso</h2>
          <p>Sigue los pasos para gestionar tu nueva solicitud médica.</p>
        </div>

        <MultiStepForm />
      </main>
    </div>
  );
}

export default App;
