
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Mail, Lock, ArrowRight, User } from 'lucide-react';

// Ícones SVG Inline para Social Login
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.11 3.67-1.11 1.4.11 2.37.5 3.35 1.19-.66 1.1-1.48 2.31-1.39 3.67.22 3.1 3.23 3.82 3.25 3.84-.04.42-.4 2.21-1.31 3.55-.65.98-1.55 2.09-2.65 2.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Added for signup visual completeness
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
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        setMsg({ type: 'success', text: 'Cadastro realizado! Verifique seu email para confirmar.' });
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
    if (!supabase) return;
    setLoading(true);
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
        });
        if (error) throw error;
    } catch (e: any) {
        setMsg({type: 'error', text: 'Erro no login social: ' + e.message});
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop')` 
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 backdrop-blur-[2px]"></div>

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 mb-4 shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M7 20h10" />
                <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">MÃOS DO CAMPO</h1>
          <p className="text-green-100 font-medium text-lg opacity-90">Sua lavoura, seu controle.</p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          
          {/* Toggle Switch */}
          <div className="flex p-1 bg-black/20 rounded-xl mb-6 relative">
            <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-md transition-all duration-300 ease-out ${mode === 'signin' ? 'left-1' : 'left-[calc(50%+4px)]'}`}
            ></div>
            <button 
                onClick={() => setMode('signin')}
                className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${mode === 'signin' ? 'text-gray-900' : 'text-white/70 hover:text-white'}`}
            >
                Entrar
            </button>
            <button 
                onClick={() => setMode('signup')}
                className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${mode === 'signup' ? 'text-gray-900' : 'text-white/70 hover:text-white'}`}
            >
                Criar Conta
            </button>
          </div>

          {msg && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 border ${msg.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-100' : 'bg-green-500/20 border-green-500/50 text-green-100'}`}>
              <div className={`w-2 h-2 rounded-full ${msg.type === 'error' ? 'bg-red-400' : 'bg-green-400'}`}></div>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
                <div className="space-y-1">
                    <label className="text-xs font-bold text-green-100 ml-1 uppercase tracking-wider">Nome Completo</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                        <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:bg-black/40 focus:border-white/40 outline-none transition-all text-white placeholder-white/30 font-medium"
                        placeholder="João da Silva"
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
               <label className="text-xs font-bold text-green-100 ml-1 uppercase tracking-wider">Email</label>
               <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:bg-black/40 focus:border-white/40 outline-none transition-all text-white placeholder-white/30 font-medium"
                  placeholder="produtor@email.com"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-green-100 ml-1 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:bg-black/40 focus:border-white/40 outline-none transition-all text-white placeholder-white/30 font-medium"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-2 bg-agro-green hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/50 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {mode === 'signin' ? 'Acessar Fazenda' : 'Iniciar Cadastro'} 
                  {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>}
                </>
              )}
            </button>
          </form>

          {/* Social Login Section */}
          <div className="mt-8">
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-transparent px-4 text-xs text-white/50 uppercase font-bold tracking-widest backdrop-blur-xl rounded">Ou continue com</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                >
                    <GoogleIcon />
                    <span className="text-white font-medium group-hover:text-white/90">Google</span>
                </button>
                <button 
                    onClick={() => handleSocialLogin('apple')}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                >
                    <AppleIcon />
                    <span className="text-white font-medium group-hover:text-white/90">Apple</span>
                </button>
            </div>
          </div>

        </div>
        
        <p className="mt-8 text-xs text-white/40 text-center font-medium">
          Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
};
