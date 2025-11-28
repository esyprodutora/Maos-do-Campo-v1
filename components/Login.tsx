import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Mail, Lock, AlertCircle, WifiOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [msg, setMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!supabase) {
        setMsg({type: 'error', text: 'Supabase não configurado.'});
        return;
    }

    setLoading(true);
    setMsg(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMsg({ type: 'success', text: 'Cadastro realizado! Verifique seu email ou faça login.' });
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMsg({ type: 'error', text: error.message || 'Ocorreu um erro.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    if(!supabase) return;
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
              redirectTo: window.location.origin
            }
        })
        if(error) throw error;
    } catch (e: any) {
        setMsg({ type: 'error', text: e.message });
    }
  }

  // Detect connection issue visually
  const isSupabaseConfigured = !!supabase;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-900">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-60" 
        style={{backgroundImage: 'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2500&q=80")'}}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80"></div>

      <div className="w-full max-w-md bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 animate-slide-up border border-white/20 relative z-10">
        
        <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-agro-green rounded-2xl shadow-lg shadow-green-900/40 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M7 20h10" />
                <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
            </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">MÃOS DO CAMPO</h1>
            <p className="text-green-100 font-medium text-sm">Gestão Rural Inteligente</p>
        </div>

        {/* Warning if Env Vars Missing */}
        {!isSupabaseConfigured && (
            <div className="mb-4 bg-red-500/20 border border-red-500/50 p-3 rounded-xl flex items-start gap-3 text-red-100 text-xs">
                 <AlertCircle size={16} className="mt-0.5 shrink-0" />
                 <p>Conexão com Banco de Dados falhou. Verifique se as variáveis <code>VITE_SUPABASE_URL</code> estão configuradas no Vercel.</p>
            </div>
        )}

        <div className="flex gap-2 mb-6 bg-black/20 p-1.5 rounded-2xl">
          <button 
            onClick={() => setMode('signin')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'signin' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'signup' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
          >
            Criar Conta
          </button>
        </div>

        {msg && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium border ${msg.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-100' : 'bg-green-500/20 border-green-500/30 text-green-100'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agro-green transition-colors" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:border-agro-green/50 focus:ring-2 focus:ring-agro-green/50 outline-none transition-all text-white placeholder-gray-500"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          
          <div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agro-green transition-colors" size={20} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:border-agro-green/50 focus:ring-2 focus:ring-agro-green/50 outline-none transition-all text-white placeholder-gray-500"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-agro-green hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : (mode === 'signin' ? 'Acessar App' : 'Confirmar Cadastro')}
          </button>
        </form>

        <div className="mt-8">
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-widest font-bold">Ou entre com</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center gap-2 bg-white text-gray-800 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                </button>
                <button onClick={() => handleSocialLogin('apple')} className="flex items-center justify-center gap-2 bg-black text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-900 transition-colors shadow-sm border border-white/20">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.38-1.09-.54-2.08-.53-3.2 0-1.39.64-2.1.29-3.05-.66-.99-1.03-2.1-3.66-1.06-6.27.76-1.89 2.53-2.65 4.36-2.48 1.13.11 2.04.64 2.82.64.78 0 1.96-.65 3.03-.59 1.15.06 2.37.54 3.1 1.6-2.88 1.48-2.31 5.39.29 6.64-.26.7-.62 1.41-1.21 2.04h-.01zM13 3.5c.53-.18 1.18-.08 1.76.65.65.81.65 1.83.36 2.5-.59.26-1.39.13-2.01-.63-.67-.84-.54-1.92-.11-2.52z"/></svg>
                    Apple
                </button>
            </div>
        </div>
      </div>
      
      <p className="absolute bottom-4 text-[10px] text-white/30 text-center">
        &copy; {new Date().getFullYear()} Mãos do Campo Agrotech
      </p>
    </div>
  );
};