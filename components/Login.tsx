import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, Leaf, AlertCircle, User, Phone } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [msg, setMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);
  
  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      // Imagem: Agrônomo com Tablet (Tecnologia/Gestão)
      image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=1920&auto=format&fit=crop",
      title: "Gestão Inteligente",
      desc: "Transforme dados da sua lavoura em decisões lucrativas com inteligência artificial."
    },
    {
      // Imagem: Campo ao pôr do sol (Colheita/Previsibilidade)
      image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1920&auto=format&fit=crop",
      title: "Previsibilidade Total",
      desc: "Saiba exatamente quanto vai gastar e quando vai colher com nossos algoritmos preditivos."
    },
    {
      // Imagem: Mão segurando planta (Cuidado/Assistência)
      image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=1920&auto=format&fit=crop",
      title: "Assistente 24h",
      desc: "Tire dúvidas técnicas sobre pragas, solo e manejo a qualquer momento."
    }
  ];

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Phone Mask Helper
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setWhatsapp(value);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!supabase) {
        setMsg({type: 'error', text: 'Erro de conexão com o servidor.'});
        return;
    }

    setLoading(true);
    setMsg(null);

    try {
      if (mode === 'signup') {
        // Validação extra
        if (!fullName || !whatsapp) {
          throw new Error('Preencha todos os campos para se cadastrar.');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              whatsapp: whatsapp,
              avatar_url: ''
            }
          }
        });
        if (error) throw error;
        setMsg({ type: 'success', text: 'Conta criada! Verifique seu email para confirmar.' });
        
        // Limpar campos
        setTimeout(() => {
            setEmail('');
            setPassword('');
            setFullName('');
            setWhatsapp('');
            setMode('signin');
            setMsg(null);
        }, 3000);

      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      
      let displayMsg = error.message;

      if (error.message.includes('Invalid login')) displayMsg = 'Email ou senha incorretos.';
      else if (error.message.includes('already registered')) displayMsg = 'Este email já está cadastrado.';
      else if (error.message.includes('Password should be')) displayMsg = 'A senha deve ter pelo menos 6 caracteres.';
      else if (error.message.includes('Database error')) displayMsg = 'Erro no banco de dados (Verifique se a tabela profiles possui a coluna whatsapp).';
      
      setMsg({ type: 'error', text: displayMsg });
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

  // Check connection
  const isSupabaseConnected = !!supabase;

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900 overflow-hidden font-sans">
      
      {/* LEFT SIDE - VISUAL SLIDER (Hidden on mobile, visible lg) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 text-white overflow-hidden">
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
             {/* Actual Image Tag for reliability */}
             <img 
               src={slide.image} 
               alt={slide.title}
               className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ${index === currentSlide ? 'scale-110' : 'scale-100'}`}
             />
             {/* Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          </div>
        ))}

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between w-full p-16">
           <div className="flex items-center gap-3 animate-fade-in">
              <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/10">
                <Leaf className="text-agro-green" size={24} fill="currentColor" />
              </div>
              <span className="font-bold text-xl tracking-wide">MÃOS DO CAMPO</span>
           </div>

           <div className="space-y-6 max-w-lg">
              <div className="flex gap-2">
                 {slides.map((_, idx) => (
                   <div 
                     key={idx} 
                     className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-agro-green' : 'w-2 bg-white/30'}`}
                   />
                 ))}
              </div>
              
              <div className="overflow-hidden min-h-[160px]">
                <h1 key={`t-${currentSlide}`} className="text-5xl font-extrabold leading-tight mb-4 animate-slide-up">
                  {slides[currentSlide].title}
                </h1>
                <p key={`d-${currentSlide}`} className="text-lg text-gray-300 font-light leading-relaxed animate-fade-in">
                  {slides[currentSlide].desc}
                </p>
              </div>

              {/* Trust Badges */}
              <div className="flex gap-8 pt-8 border-t border-white/10">
                 <div>
                    <p className="text-3xl font-bold text-white">10k+</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Produtores</p>
                 </div>
                 <div>
                    <p className="text-3xl font-bold text-white">500k</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Hectares</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        
        {/* Mobile Background (IMG tag for better loading) */}
        <div className="lg:hidden absolute inset-0 z-0">
           <img 
             src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1080&auto=format&fit=crop" 
             className="w-full h-full object-cover"
             alt="Background"
           />
           <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-slate-800 lg:bg-transparent lg:dark:bg-transparent rounded-3xl lg:rounded-none shadow-2xl lg:shadow-none p-8 lg:p-0 relative z-10 animate-fade-in">
          
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              {mode === 'signin' ? 'Bem-vindo de volta' : 'Comece gratuitamente'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {mode === 'signin' 
                ? 'Acesse seu painel e gerencie sua produção.' 
                : 'Preencha os dados abaixo para criar sua conta.'}
            </p>
          </div>

          {!isSupabaseConnected && (
             <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex gap-3 items-start">
               <AlertCircle className="text-red-500 shrink-0" size={20} />
               <div className="text-sm text-red-600 dark:text-red-300">
                 <p className="font-bold">Falha na Conexão</p>
                 <p className="mt-1 opacity-90">Verifique as variáveis <code>VITE_SUPABASE_URL</code> no painel da Vercel.</p>
               </div>
             </div>
          )}

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-semibold shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button 
              onClick={() => handleSocialLogin('apple')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors font-semibold shadow-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.38-1.09-.54-2.08-.53-3.2 0-1.39.64-2.1.29-3.05-.66-.99-1.03-2.1-3.66-1.06-6.27.76-1.89 2.53-2.65 4.36-2.48 1.13.11 2.04.64 2.82.64.78 0 1.96-.65 3.03-.59 1.15.06 2.37.54 3.1 1.6-2.88 1.48-2.31 5.39.29 6.64-.26.7-.62 1.41-1.21 2.04h-.01zM13 3.5c.53-.18 1.18-.08 1.76.65.65.81.65 1.83.36 2.5-.59.26-1.39.13-2.01-.63-.67-.84-.54-1.92-.11-2.52z"/></svg>
              Apple
            </button>
          </div>

          <div className="relative flex items-center mb-8">
             <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
             <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">Ou com email</span>
             <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
          </div>

          {msg && (
            <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 text-sm font-medium border ${msg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30' : 'bg-green-50 text-green-600 border-green-100'}`}>
               {msg.type === 'error' ? <Lock size={18}/> : <CheckCircle2 size={18}/>}
               {msg.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-1 animate-slide-up">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Nome Completo</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agro-green transition-colors" size={20} />
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-agro-green focus:ring-4 focus:ring-green-500/10 outline-none transition-all dark:text-white font-medium"
                      placeholder="João da Silva"
                    />
                  </div>
                </div>

                <div className="space-y-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">WhatsApp</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agro-green transition-colors" size={20} />
                    <input 
                      type="text" 
                      required
                      value={whatsapp}
                      onChange={handlePhoneChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-agro-green focus:ring-4 focus:ring-green-500/10 outline-none transition-all dark:text-white font-medium"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agro-green transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-agro-green focus:ring-4 focus:ring-green-500/10 outline-none transition-all dark:text-white font-medium"
                  placeholder="nome@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-1">
               <div className="flex justify-between ml-1">
                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Senha</label>
                 {mode === 'signin' && (
                   <a href="#" className="text-xs font-semibold text-agro-green hover:underline">Esqueceu a senha?</a>
                 )}
               </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agro-green transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-agro-green focus:ring-4 focus:ring-green-500/10 outline-none transition-all dark:text-white font-medium"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-agro-green hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 hover:shadow-green-600/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" /> 
              ) : (
                <>
                   {mode === 'signin' ? 'Acessar Plataforma' : 'Criar Conta Grátis'}
                   <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
             <p className="text-gray-500 dark:text-gray-400 text-sm">
                {mode === 'signin' ? 'Não tem uma conta?' : 'Já tem cadastro?'}
                <button 
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setMsg(null);
                  }}
                  className="ml-2 font-bold text-agro-green hover:underline focus:outline-none"
                >
                   {mode === 'signin' ? 'Criar agora' : 'Fazer login'}
                </button>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};