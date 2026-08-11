import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      if (data.user) {
        console.log('Login successful, fetching profile...');
        // Fetch role to redirect with a timeout
        const profilePromise = supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        // Race between profile fetch and a 3s timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        );

        try {
          const result = await Promise.race([profilePromise, timeoutPromise]) as any;
          const profileData = result.data;
          
          if (profileData && profileData.role) {
            const role = profileData.role;
            console.log('Profile found, role:', role);
            window.location.href = `/${role}`;
            return;
          } else {
            throw new Error('Perfil não encontrado para esta conta. Entre em contato com a Prefeitura.');
          }
        } catch (err: any) {
          console.warn('Profile fetch timed out or failed:', err);
          setError(err.message === 'timeout' 
            ? 'Tempo limite de conexão excedido. Por favor, tente novamente.'
            : (err.message || 'Erro ao identificar perfil do usuário.'));
          return;
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-max-w-md">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo-prefeitura.png" 
            alt="Logo da Prefeitura de Água Boa" 
            className="w-[280px] max-w-full object-contain rounded-lg"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          EcoTroca Água Boa
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Programa Municipal de Reciclagem e Moeda Social
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-prefeitura focus:border-prefeitura sm:text-sm transition-all"
                  placeholder="exemplo@ecotroca.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-prefeitura focus:border-prefeitura sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-prefeitura hover:bg-prefeitura-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prefeitura disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Autenticando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <LogIn className="h-5 w-5 mr-2" />
                    Entrar no Sistema
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">Acesso Restrito</span>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
              <p>Escola: acesso para registro de materiais</p>
              <p>Sicredi: acesso para resgate de tokens</p>
              <p>Prefeitura: acesso para monitoramento</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 flex flex-col items-center justify-center">
        <p className="text-xs text-gray-500 mb-2 font-medium">Desenvolvido por</p>
        <img 
          src="/logo-hub.png" 
          alt="Logo do Hub de Inovação Água Boa - MT" 
          className="w-[90px] object-contain rounded"
        />
      </div>
    </div>
  );
};

export default Login;
