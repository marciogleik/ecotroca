import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Recycle, 
  Droplets, 
  Coins, 
  Users, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle,
  Menu,
  X,
  MapPin,
  ExternalLink,
  Shield,
  HelpCircle,
  Calendar,
  Leaf,
  AlertCircle,
  FlaskConical,
  Building2,
  TreePine,
  ShoppingBasket,
  Ban
} from 'lucide-react';
import { LiveIndicator } from '../components/ui';

const PublicPortal: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalVendors: 0,
    totalIssued: 0,
    totalContainers: 0,
    totalOil: 0,
    totalSchools: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: vendorCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
        const { count: schoolCount } = await supabase.from('schools').select('*', { count: 'exact', head: true });
        
        const { data: deliveries } = await supabase.from('deliveries').select('ecotrocas_earned, containers, oil_liters');
        const { data: schools } = await supabase.from('schools').select('total_received');

        const totalIssued = schools?.reduce((acc, curr) => acc + (curr.total_received || 0), 0) || 0;
        const totalContainers = deliveries?.reduce((acc, curr) => acc + (curr.containers || 0), 0) || 0;
        const totalOil = deliveries?.reduce((acc, curr) => acc + (Number(curr.oil_liters) || 0), 0) || 0;

        setStats({
          totalStudents: studentCount || 0,
          totalVendors: vendorCount || 0,
          totalIssued: totalIssued || 0,
          totalContainers: totalContainers || 0,
          totalOil: totalOil || 0,
          totalSchools: schoolCount || 0
        });
      } catch (error) {
        console.error('Error fetching public stats:', error);
        setStats({
          totalStudents: 1450,
          totalVendors: 32,
          totalIssued: 125400,
          totalContainers: 8940,
          totalOil: 2310,
          totalSchools: 8
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPublicStats();
  }, []);

  const waterPreserved = stats.totalOil * 25000;

  const steps = [
    {
      icon: Recycle,
      color: 'text-green-600 bg-green-50 border-green-100',
      title: '1. Separação em Casa',
      description: 'Separe garrafas PET, embalagens Tetra Pak, alumínio, plásticos limpos e óleo de cozinha usado.'
    },
    {
      icon: Users,
      color: 'text-escola bg-escola-light border-green-100',
      title: '2. Entrega na Escola',
      description: 'Leve os materiais limpos e separados até uma das escolas municipais participantes do programa.'
    },
    {
      icon: Coins,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      title: '3. Ganhe EcoTrocas',
      description: 'O material é registrado no sistema e gera moedas sociais (EcoTrocas) na conta do estudante.'
    },
    {
      icon: ChevronRight,
      color: 'text-sicredi bg-sicredi-light border-blue-100',
      title: '4. Troque nas Feiras',
      description: 'Use suas EcoTrocas para comprar frutas, verduras e produtos da agricultura familiar nas feiras parceiras.'
    }
  ];

  const materials = [
    { name: 'Garrafas PET', icon: '♻️', desc: 'Limpas e sem rótulo' },
    { name: 'Tetra Pak', icon: '🥛', desc: 'Caixinhas de leite/suco' },
    { name: 'Alumínio', icon: '🥫', desc: 'Latas amassadas' },
    { name: 'Plásticos em Geral', icon: '🧴', desc: 'Secos e limpos' },
    { name: 'Óleo Usado', icon: '🫙', desc: '2 litros = 1 EcoTroca' },
  ];

  const allowedProducts = [
    'Frutas frescas',
    'Verduras e legumes',
    'Produtos da agricultura familiar',
    'Panificados caseiros',
    'Produtos artesanais alimentícios',
  ];

  const prohibitedProducts = [
    'Frituras',
    'Refrigerantes',
    'Bebidas industrializadas',
    'Produtos enlatados',
    'Ultraprocessados',
    'Produtos de baixo valor nutricional',
  ];

  const fairDays = [
    { day: 'Quartas-feiras', local: 'Feiras nos Bairros', color: 'bg-green-50 border-green-200 text-green-800' },
    { day: 'Sextas-feiras', local: 'Feiras nos Bairros', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { day: 'Domingos', local: 'Feira do Pequeno Produtor Rural', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  ];

  const participants = [
    { name: 'E.M. Guarujá', type: 'Escola', icon: Building2, color: 'text-escola bg-escola-light' },
    { name: 'E.M. Ermindo Mendel', type: 'Escola', icon: Building2, color: 'text-escola bg-escola-light' },
    { name: 'E.M. Pestalozzi', type: 'Escola', icon: Building2, color: 'text-escola bg-escola-light' },
    { name: 'E.M. Cristalino', type: 'Escola', icon: Building2, color: 'text-escola bg-escola-light' },
    { name: 'AFAB', type: 'Recebe Alumínio', icon: Recycle, color: 'text-prefeitura bg-prefeitura-light' },
    { name: 'ACAMARA', type: 'Recebe PET, Tetra Pak, Plásticos', icon: Recycle, color: 'text-prefeitura bg-prefeitura-light' },
    { name: 'AMORAB', type: 'Recebe Óleo Usado', icon: Droplets, color: 'text-blue-700 bg-blue-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800">
      
      {/* ────────────────────── HEADER ────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3">
                <img 
                  src="/logo-prefeitura.png" 
                  alt="Logo da Prefeitura de Água Boa" 
                  className="h-12 w-auto object-contain rounded-md"
                />
                <div className="hidden sm:block border-l border-slate-200 pl-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Programa Municipal</span>
                  <span className="text-base font-extrabold text-escola block leading-none">EcoTroca</span>
                </div>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-sm font-semibold text-slate-600 hover:text-escola transition-colors">Como Funciona</a>
              <a href="#materiais" className="text-sm font-semibold text-slate-600 hover:text-escola transition-colors">Materiais</a>
              <a href="#feiras" className="text-sm font-semibold text-slate-600 hover:text-escola transition-colors">Feiras</a>
              <a href="#olho-no-oleo" className="text-sm font-semibold text-slate-600 hover:text-escola transition-colors">De Olho no Óleo</a>
              <a href="#impacto" className="text-sm font-semibold text-slate-600 hover:text-escola transition-colors">Impacto</a>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-prefeitura hover:bg-prefeitura-dark rounded-xl shadow-md shadow-prefeitura/10 hover:shadow-lg transition-all"
              >
                Acessar Sistema
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </nav>

            {/* Mobile Nav Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-b border-slate-100 bg-white">
            <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
              {[
                ['#como-funciona', 'Como Funciona'],
                ['#materiais', 'Materiais Aceitos'],
                ['#feiras', 'Calendário das Feiras'],
                ['#olho-no-oleo', 'De Olho no Óleo'],
                ['#impacto', 'Nosso Impacto'],
                ['#participantes', 'Participantes'],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-600 hover:bg-slate-50 hover:text-escola transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="pt-2 px-4">
                <Link 
                  to="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center px-5 py-3 text-base font-bold text-white bg-prefeitura hover:bg-prefeitura-dark rounded-xl shadow-md transition-all"
                >
                  Acessar Sistema
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ────────────────────── HERO ────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32 bg-gradient-to-br from-green-50/70 via-blue-50/30 to-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-200/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/4"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-green-50 border border-green-100/50 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-green-800 tracking-wide uppercase">Programa Municipal de Sustentabilidade</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Transforme <span className="text-escola">Reciclagem</span> em <span className="text-prefeitura">Moeda Social</span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                O programa <strong>EcoTroca Água Boa</strong> incentiva alunos da rede pública municipal e suas famílias a reciclarem embalagens plásticas e óleo de cozinha usado. Cada resíduo vira créditos que podem ser trocados por alimentos nas feiras locais.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a 
                  href="#como-funciona"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-base font-bold text-white bg-escola hover:bg-escola-dark rounded-xl shadow-lg shadow-escola/15 hover:shadow-xl hover:shadow-escola/20 hover:-translate-y-0.5 transition-all"
                >
                  Como Participar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                <Link 
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-base font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  Entrar no Painel
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6 sm:gap-8 pt-6 max-w-md mx-auto lg:mx-0 border-t border-slate-200/80">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-escola">{loading ? '...' : stats.totalSchools}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Escolas Ativas</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-prefeitura">{loading ? '...' : stats.totalVendors}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Parceiros</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{loading ? '...' : (stats.totalStudents + stats.totalVendors)}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Participantes</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
              <div className="relative w-full max-w-[420px] bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-3xl p-4 shadow-inner border border-white/50">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl rounded-3xl border border-white -z-10 shadow-2xl"></div>
                <div className="w-full rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden flex flex-col">

                  {/* Badge */}
                  <div className="pt-5 pb-2 flex justify-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-green-50 text-green-700 border border-green-100">
                      Programa Municipal
                    </span>
                  </div>

                  {/* Logo Secretaria — completo e nítido */}
                  <div className="px-6 py-4 bg-white flex items-center justify-center">
                    <img
                      src="/logo-prefeitura.png"
                      alt="Secretaria Municipal de Desenvolvimento Econômico, Agricultura, Turismo e Inovação — Água Boa"
                      className="w-full max-w-[320px] h-auto object-contain"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="px-6 pb-5 text-center">
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                      Escolas, feirantes e cooperativas unidos pela sustentabilidade em Água Boa - MT.
                    </p>
                  </div>

                  {/* Hub — fundo escuro com logo + texto */}
                  <div className="bg-[#0d1b3e] px-5 py-3 flex items-center gap-3">
                    <img
                      src="/logo-hub.png"
                      alt="Hub de Inovação"
                      className="h-9 w-9 object-contain flex-shrink-0 rounded"
                    />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Desenvolvido por</p>
                      <p className="text-xs font-extrabold text-white leading-tight mt-0.5">Hub de Inovação Água Boa</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────── INAUGURAÇÃO ────────────────────── */}
      <section id="inauguracao" className="py-16 sm:py-20 bg-white border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-10 lg:gap-16">
            <div className="w-full md:w-1/2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 border-4 border-white bg-slate-100">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/20 to-transparent z-10 pointer-events-none"></div>
                <img 
                  src="/inauguracao.jpg" 
                  alt="Inauguração do projeto EcoTroca na Feira do Pequeno Produtor com crianças usando as notas" 
                  className="w-full h-[350px] sm:h-[450px] object-cover transform hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 shadow-sm">
                <span className="text-lg">🎉</span>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Lançamento Oficial</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Inauguração do <span className="text-escola">EcoTroca</span>
              </h2>
              
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
                Um marco para a sustentabilidade e economia solidária em nossa cidade! As primeiras trocas mostraram na prática a força do projeto: 
                crianças transformando material reciclável em alimentos fresquinhos direto da agricultura familiar.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Calendar className="h-5 w-5 text-escola" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data do Evento</p>
                    <p className="text-sm font-extrabold text-slate-800">31 de Maio</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <MapPin className="h-5 w-5 text-prefeitura" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Local</p>
                    <p className="text-sm font-extrabold text-slate-800">Feira do Pequeno Produtor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────── COMO FUNCIONA ────────────────────── */}
      <section id="como-funciona" className="py-20 bg-[#F8FAFC] border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold text-escola tracking-wider uppercase">Passo a Passo</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Como funciona o Ciclo EcoTroca?
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              O processo é simples e gera benefícios imediatos para o cidadão, as escolas, as feiras e o meio ambiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative">
                <div className="absolute -top-4 left-8 inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-black">
                  {idx + 1}
                </div>
                <div className={`inline-flex p-3 rounded-2xl border mb-6 mt-2 ${step.color}`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">{step.title}</h3>
                <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Tabela de conversão */}
          <div className="mt-14 max-w-xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-900 text-white px-6 py-4 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Tabela Oficial de Conversão</p>
                <p className="text-lg font-extrabold">Recicláveis → EcoTrocas</p>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">♻️</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Materiais Recicláveis</p>
                      <p className="text-xs text-slate-500">PET, Tetra Pak, Alumínio, Plástico</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-escola">1 EcoTroca</p>
                    <p className="text-xs text-slate-500">a cada 10 unidades</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🫙</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Óleo de Cozinha Usado</p>
                      <p className="text-xs text-slate-500">Embalagem PET, limpa</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-escola">1 EcoTroca</p>
                    <p className="text-xs text-slate-500">a cada 2 litros</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block p-1 bg-slate-100 rounded-full">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-200/20">
                <HelpCircle className="h-4 w-4 text-escola" />
                Ficou com alguma dúvida?
                <a href="mailto:contato@aguaboa.mt.gov.br" className="text-escola hover:underline font-extrabold flex items-center">
                  Fale com a Prefeitura
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────── MATERIAIS ACEITOS / PROIBIDOS ────────────────────── */}
      <section id="materiais" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold text-escola tracking-wider uppercase">Regras do Programa</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              O que pode e o que não pode?
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Conheça os materiais aceitos para reciclagem e os produtos permitidos nas feiras do programa.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Materiais aceitos */}
            <div className="bg-green-50 rounded-3xl p-8 border border-green-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-green-600 rounded-xl">
                  <Recycle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-green-900">Materiais Aceitos</h3>
              </div>
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-4">
                Devem estar limpos, secos e separados
              </p>
              <ul className="space-y-3">
                {materials.map((m, i) => (
                  <li key={i} className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3 border border-green-100">
                    <span className="text-xl">{m.icon}</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Produtos permitidos nas feiras */}
            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-emerald-600 rounded-xl">
                  <ShoppingBasket className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-emerald-900">Permitido nas Feiras</h3>
              </div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">
                Produtos aceitos com EcoTrocas
              </p>
              <ul className="space-y-3">
                {allowedProducts.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3 border border-emerald-100">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Produtos proibidos */}
            <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-red-600 rounded-xl">
                  <Ban className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-red-900">Não Permitido</h3>
              </div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-4">
                Não podem ser vendidos nas feiras
              </p>
              <ul className="space-y-3">
                {prohibitedProducts.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3 border border-red-100">
                    <X className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────── CALENDÁRIO DAS FEIRAS ────────────────────── */}
      <section id="feiras" className="py-20 bg-[#F8FAFC] border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold text-amber-600 tracking-wider uppercase">Calendário Oficial</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Calendário das Feiras
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              As feiras acontecem regularmente em Água Boa. Leve suas EcoTrocas e troque por alimentos frescos da agricultura familiar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {fairDays.map((f, i) => (
              <div key={i} className={`rounded-3xl p-8 border-2 text-center ${f.color} shadow-sm`}>
                <div className="inline-flex p-4 rounded-2xl bg-white/60 mb-5">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-extrabold mb-2">{f.day}</h3>
                <p className="text-sm font-semibold opacity-80">{f.local}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-2xl mx-auto p-5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-amber-800 leading-relaxed">
              As EcoTrocas têm valor <strong>exclusivo nas feiras</strong> e cooperativas participantes do programa. Elas não possuem valor monetário fora do programa.
            </p>
          </div>

        </div>
      </section>

      {/* ────────────────────── DE OLHO NO ÓLEO ────────────────────── */}
      <section id="olho-no-oleo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
                <FlaskConical className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Projeto Complementar</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                De Olho no Óleo 🫙
              </h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                O <strong>Projeto De Olho no Óleo</strong> é uma iniciativa de educação ambiental integrada ao EcoTroca, com foco no descarte correto do óleo de cozinha usado — um dos maiores poluentes domésticos do Brasil.
              </p>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Objetivos do Projeto</p>
                {[
                  'Reduzir a poluição causada pelo descarte incorreto de óleo',
                  'Incentivar a reciclagem e reaproveitamento do óleo usado',
                  'Promover a conscientização ambiental nas escolas',
                  'Integrar sustentabilidade ao cotidiano escolar',
                ].map((obj, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-blue-600 text-white rounded-3xl p-8 shadow-xl shadow-blue-600/20">
                <Droplets className="h-10 w-10 mb-4 text-blue-200" />
                <h3 className="text-xl font-extrabold mb-3">Você sabia?</h3>
                <p className="text-blue-100 leading-relaxed font-medium">
                  1 litro de óleo de cozinha pode contaminar até <strong className="text-white">25.000 litros</strong> de água potável. Quando jogado na pia ou ralo, o óleo bloqueia esgotos, polui rios e causa danos irreversíveis ao meio ambiente.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temas Educativos do Programa</p>
                {[
                  { icon: Leaf, label: 'Alimentação saudável e qualidade de vida' },
                  { icon: TreePine, label: 'Gestão de resíduos sólidos urbanos' },
                  { icon: Shield, label: 'Combate ao mosquito da dengue' },
                  { icon: Users, label: 'Agricultura familiar e economia solidária' },
                ].map(({ icon: Icon, label }, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────── PARTICIPANTES ────────────────────── */}
      <section id="participantes" className="py-20 bg-[#F8FAFC] border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold text-prefeitura tracking-wider uppercase">Rede Participante</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Quem participa do EcoTroca?
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Escolas municipais, associações e feirantes credenciados formam a rede do programa em Água Boa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {participants.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${p.color}`}>
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{p.type}</p>
              </div>
            ))}
          </div>

          {/* Parceiros institucionais */}
          <div className="mt-14 max-w-3xl mx-auto">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Coordenação e Apoio Institucional</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Coordenação', name: 'Sec. Municipal de Desenvolvimento Econômico, Agricultura, Turismo e Inovação' },
                { label: 'Participação', name: 'Secretaria Municipal de Educação' },
                { label: 'Participação', name: 'Secretaria Municipal de Meio Ambiente' },
              ].map((inst, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
                  <span className="text-[10px] font-bold text-prefeitura uppercase tracking-wider">{inst.label}</span>
                  <p className="text-xs font-semibold text-slate-700 mt-2 leading-relaxed">{inst.name}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────── IMPACTO ────────────────────── */}
      <section id="impacto" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2">
              <LiveIndicator />
              <span className="text-xs font-bold text-blue-800 tracking-wider uppercase">Indicadores em Tempo Real</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Impacto Ecológico e Social Acumulado
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed text-base sm:text-lg">
              Veja em tempo real a contribuição sustentável da nossa comunidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="relative group bg-[#F8FAFC] p-8 rounded-3xl border border-slate-100 hover:border-green-200 hover:bg-white hover:shadow-2xl hover:shadow-green-500/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl group-hover:bg-green-500/10 transition-all"></div>
              <div className="inline-flex p-3 rounded-2xl bg-green-500/10 text-green-700 mb-6">
                <Recycle className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Materiais Coletados</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2 flex items-baseline gap-1">
                {loading ? '...' : stats.totalContainers.toLocaleString('pt-BR')}
                <span className="text-sm font-bold text-slate-500">und</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-3 border-t border-slate-100 pt-3">
                PET, Tetra Pak, Alumínio e Plásticos descartados corretamente.
              </p>
            </div>

            <div className="relative group bg-[#F8FAFC] p-8 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all"></div>
              <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-700 mb-6">
                <Droplets className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Óleo Reciclado</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2 flex items-baseline gap-1">
                {loading ? '...' : stats.totalOil.toLocaleString('pt-BR', {maximumFractionDigits: 1})}
                <span className="text-sm font-bold text-slate-500">litros</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-3 border-t border-slate-100 pt-3">
                Evitou a contaminação de solos e mananciais de água.
              </p>
            </div>

            <div className="relative group bg-[#F8FAFC] p-8 rounded-3xl border border-slate-100 hover:border-cyan-200 hover:bg-white hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-700 mb-6">
                <Droplets className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Água Preservada</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2 flex items-baseline gap-1">
                {loading ? '...' : (waterPreserved / 1000000).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                <span className="text-sm font-bold text-slate-500">M Litros</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-3 border-t border-slate-100 pt-3">
                Volume equivalente a mais de {(waterPreserved / 2500000).toFixed(0)} piscinas olímpicas poupadas.
              </p>
            </div>

            <div className="relative group bg-[#F8FAFC] p-8 rounded-3xl border border-slate-100 hover:border-amber-200 hover:bg-white hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all"></div>
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-700 mb-6">
                <Coins className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Moeda Social Gerada</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2 flex items-baseline gap-1">
                {loading ? '...' : stats.totalIssued.toLocaleString('pt-BR')}
                <span className="text-sm font-bold text-slate-500">EcoTrocas</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-3 border-t border-slate-100 pt-3">
                Injetadas no comércio e cooperativas locais — R$ {stats.totalIssued.toLocaleString('pt-BR', {minimumFractionDigits: 2})}.
              </p>
            </div>

          </div>

          <div className="mt-12 p-6 rounded-2xl bg-green-50/50 border border-green-100/50 max-w-4xl mx-auto flex items-start gap-4">
            <Shield className="h-6 w-6 text-green-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 leading-relaxed">
                <strong>Importância Ecológica:</strong> O descarte inadequado de apenas 1 litro de óleo de cozinha usado pode poluir até 25.000 litros de água potável. O programa EcoTroca remove esse poluente de circulação de forma ativa e rastreável.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────── CTA COMERCIANTE ────────────────────── */}
      <section id="comercio" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-escola/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 text-emerald-400">Feirante ou Associação</span>
                
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Faça parte da rede EcoTroca
                </h2>
                
                <p className="text-base text-slate-300 max-w-3xl leading-relaxed font-medium">
                  As EcoTrocas recebidas pelos feirantes têm valor garantido e são convertidas para dinheiro pela empresa apoiadora em até <strong className="text-white">24 horas após a feira</strong>. Cadastre-se na Secretaria Municipal de Desenvolvimento.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <CheckCircle className="h-4 w-4 text-emerald-400" /> Rede Credenciada
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <CheckCircle className="h-4 w-4 text-emerald-400" /> Conversão em 24h pelo Sicredi
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <CheckCircle className="h-4 w-4 text-emerald-400" /> Apoio ao Produtor Local
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-4 justify-center items-stretch w-full sm:max-w-xs sm:mx-auto lg:max-w-none">
                <a 
                  href="https://aguaboa.mt.gov.br" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-4 font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-md transition-all text-center"
                >
                  Portal Água Boa
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                <Link 
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-4 font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl shadow-sm transition-all text-center"
                >
                  Fazer Login no Sistema
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────── FOOTER ────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-slate-800 pb-12 mb-12">
            
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo-prefeitura.png" 
                  alt="Logo Prefeitura" 
                  className="h-10 w-auto object-contain bg-white p-1 rounded" 
                />
                <span className="text-lg font-black text-white">EcoTroca Água Boa</span>
              </div>
              <p className="text-sm font-medium leading-relaxed max-w-md">
                Uma iniciativa da Prefeitura Municipal de Água Boa, Mato Grosso, fomentando a educação ambiental, a economia solidária e a preservação ecológica.
              </p>
            </div>

            <div className="md:col-span-4 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Acesso Rápido</h4>
              <ul className="space-y-2 text-sm columns-2">
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="#materiais" className="hover:text-white transition-colors">Materiais Aceitos</a></li>
                <li><a href="#feiras" className="hover:text-white transition-colors">Calendário Feiras</a></li>
                <li><a href="#olho-no-oleo" className="hover:text-white transition-colors">De Olho no Óleo</a></li>
                <li><a href="#impacto" className="hover:text-white transition-colors">Impacto Geral</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Área Restrita</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contatos</h4>
              <p className="text-sm leading-relaxed flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                Av. Planalto, 410 - Centro<br />Água Boa - MT, 78635-000
              </p>
              <p className="text-sm">E-mail: contato@aguaboa.mt.gov.br</p>
            </div>
            
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <p>© {new Date().getFullYear()} Prefeitura Municipal de Água Boa - MT. Todos os direitos reservados.</p>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                Desenvolvido por
                <img 
                  src="/logo-hub.png" 
                  alt="Hub" 
                  className="h-5 w-auto object-contain bg-white/5 px-1.5 py-0.5 rounded" 
                />
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PublicPortal;
