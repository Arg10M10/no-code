import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';

const SupabaseTest = () => {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCallFunction = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    // 'invoke' se encarga automáticamente de añadir el token de autenticación
    // del usuario que ha iniciado sesión.
    const { data, error } = await supabase.functions.invoke('hello-user');

    if (error) {
      setError(`Error: ${error.message}`);
    } else {
      setResult(`Success: ${data.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-20 flex justify-center">
        <div className="w-full max-w-2xl text-center space-y-6">
          <h1 className="text-3xl font-bold">Prueba de Función Edge Segura</h1>
          <p className="text-muted-foreground">
            Haz clic en el botón para llamar a una Función Edge de Supabase que requiere autenticación.
            Primero, asegúrate de haber iniciado sesión a través de la página de "Publish".
          </p>
          <Button onClick={handleCallFunction} disabled={loading}>
            {loading ? 'Llamando...' : 'Llamar a la Función "hello-user"'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 rounded-md bg-green-500/10 border border-green-500/30 text-green-300">
              <p className="font-mono">{result}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-md bg-red-500/10 border border-red-500/30 text-red-300">
              <p className="font-mono">{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SupabaseTest;