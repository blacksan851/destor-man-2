import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        throw authError;
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao efetuar login. Verifique as suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-white font-black text-3xl">D</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-white tracking-tight">
          Acesse a sua conta
        </h2>
        <p className="text-center text-xs text-gray-400 mt-2 font-medium">
          Sistema de Gestão Comercial Dr Gestor MZ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0B1120] py-8 px-6 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-800">
          {error && (
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm font-bold border border-red-500/20 mb-4">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Endereço de Email
              </label>
              <div>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="seuemail@exemplo.com"
                  className="appearance-none block w-full px-4 py-3.5 border border-gray-800 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-[#0F172A] text-white disabled:opacity-50 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Senha de Acesso
              </label>
              <div>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-4 py-3.5 border border-gray-800 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-[#0F172A] text-white disabled:opacity-50 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  disabled={loading}
                  className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-gray-700 bg-[#0F172A] rounded disabled:opacity-50 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-gray-300 cursor-pointer">
                  Lembrar-me
                </label>
              </div>

              <div className="text-xs">
                <a href="#" className="font-bold text-emerald-400 hover:text-emerald-300">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/25 text-sm font-black text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wide"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar no Sistema'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-gray-800">
            <Link to="/register" className="text-xs font-bold text-gray-400 hover:text-emerald-400 transition-colors">
              Não tem uma conta? <span className="text-emerald-400 font-extrabold">Registe a sua empresa</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

