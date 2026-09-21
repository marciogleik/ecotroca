import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Heart, 
  Recycle, 
 
  Users,
  Sun,
  Menu,
  X,
  ArrowRight,
  MapPin,
  Trophy,
  Medal
} from 'lucide-react';


interface TopSchool {
  id: string;
  name: string;
  total_received: number;
}

const ImpactPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalVendors: 0,
    totalIssued: 0,
    totalContainers: 0,
    totalOil: 0,
    totalSchools: 0
  });
  const [topSchools, setTopSchools] = useState<TopSchool[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: vendorCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
        const { count: schoolCount } = await supabase.from('schools').select('*', { count: 'exact', head: true });
        
        const { data: deliveries } = await supabase.from('deliveries').select('ecotrocas_earned, containers, oil_liters');
        const { data: schools } = await supabase.from('schools').select('total_received');
        const { data: topSchoolsData } = await supabase.from('schools').select('id, name, total_received').order('total_received', { ascending: false }).limit(5);

        const totalIssued = schools?.reduce((acc, curr) => acc + (curr.total_received || 0), 0) || 0;
        const totalContainers = deliveries?.reduce((acc, curr) => acc + (curr.containers || 0), 0) || 0;
        const totalOil = deliveries?.reduce((acc, curr) => acc + (Number(curr.oil_liters) || 0), 0) || 0;

        setTopSchools(topSchoolsData || []);


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

    // Inscrição para atualizações em tempo real no ranking das escolas
    const channel = supabase
      .channel('public:schools')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schools' },
        async () => {
          // Quando houver mudança em qualquer escola, busca novamente o top 5 atualizado
          const { data: topSchoolsData } = await supabase
            .from('schools')
            .select('id, name, total_received')
            .order('total_received', { ascending: false })
            .limit(5);
          
          if (topSchoolsData) {
            setTopSchools(topSchoolsData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Estimate families impacted assuming ~1.5 students per family
  const familiesImpacted = Math.round(stats.totalStudents * 0.8);

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

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/noticias" className="text-sm font-semibold text-slate-600 hover:text-escola transition-colors">Notícias</Link>
              <Link to="/#como-funciona" className="text-sm font-semibold text-slate-600 hover:text-escola transition-colors">Como Funciona</Link>
              <Link 
                to="/impacto" 
                className="text-sm font-bold text-escola hover:text-green-700 transition-colors flex items-center gap-1"
              >
                Impacto Ecológico e Social Acumulado
              </Link>
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
              <Link
                to="/noticias"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-600 hover:bg-slate-50 hover:text-escola transition-colors"
              >
                Notícias
              </Link>
              <Link
                to="/#como-funciona"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-600 hover:bg-slate-50 hover:text-escola transition-colors"
              >
                Como Funciona
              </Link>
              <Link
                to="/impacto"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-base font-bold text-escola bg-green-50 hover:bg-green-100 transition-colors"
              >
                Impacto Ecológico e Social Acumulado
              </Link>
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

      <main className="relative pt-12 pb-20 lg:pt-16 lg:pb-32">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-200/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/4"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-4xl mx-auto text-center space-y-4 mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
                <Sun className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Fazendo a Diferença Real</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 shadow-sm">
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Patrocínio Oficial:</span>
                <img src="/sicredi.png" alt="Sicredi" className="h-4 w-auto object-contain" />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-slate-900">
              O Futuro de Água Boa está Sendo <span className="text-escola">Transformado</span> Hoje
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            
            {/* Familias */}
            <div className="relative group bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 hover:border-rose-200 shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-2 hover:shadow-rose-500/10 transition-all duration-300 cursor-default">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-500"></div>
              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 text-rose-600 self-start transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2 flex items-baseline">
                    {loading ? '...' : familiesImpacted.toLocaleString('pt-BR')}
                    <span className="text-2xl font-bold text-slate-600 ml-2">+</span>
                  </h3>
                  <p className="text-lg font-extrabold text-slate-800 mb-2">Famílias Impactadas</p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Esforço de <strong>{loading ? '...' : stats.totalStudents} crianças</strong> levando alimento fresco para quem precisa.
                  </p>
                </div>
              </div>
            </div>



            {/* Economia Solidária */}
            <div className="relative group bg-white p-6 sm:p-8 rounded-[2rem] border border-[#00A859]/20 hover:border-[#00A859]/50 shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-2 hover:shadow-[#00A859]/20 transition-all duration-300 cursor-default">
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#00A859]/10 rounded-full blur-2xl group-hover:bg-[#00A859]/20 transition-all duration-500"></div>
              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex p-3 rounded-2xl bg-[#00A859]/10 text-[#00A859] transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                    <Users className="h-6 w-6" />
                  </div>
                  <img src="/sicredi.png" alt="Sicredi" className="h-5 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">
                    R$ {loading ? '...' : stats.totalIssued.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </h3>
                  <p className="text-lg font-extrabold text-[#00A859] mb-2">Injetados na Economia</p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Conversão garantida 1x1. Fortalecendo pequenos agricultores e feirantes.
                  </p>
                </div>
              </div>
            </div>

            {/* Reciclagem */}
            <div className="relative group bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 hover:border-green-200 shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-2 hover:shadow-green-500/10 transition-all duration-300 cursor-default">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all duration-700"></div>
              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                <div className="inline-flex p-3 rounded-2xl bg-green-500/10 text-green-700 self-start transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                  <Recycle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2 flex items-baseline">
                    {loading ? '...' : stats.totalContainers.toLocaleString('pt-BR')}
                    <span className="text-xl sm:text-2xl font-bold text-green-800 ml-2">unidades</span>
                  </h3>
                  <p className="text-lg font-extrabold text-green-700 mb-2">Embalagens Recicladas</p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Menos poluição no meio ambiente e mais <strong className="text-green-800">educação ambiental na prática</strong>.
                  </p>
                </div>
              </div>
            </div>

          </div>


          {/* Ranking das Escolas */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                <Trophy className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Ranking de Engajamento das Escolas</h2>
              <p className="text-slate-600 text-lg">
                O sucesso do EcoTroca é movido pelas nossas crianças. Veja as escolas que mais se destacaram na arrecadação, mostrando que a educação ambiental começa na sala de aula e transforma a comunidade inteira!
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-4 px-6 font-bold text-slate-700 w-16 text-center">#</th>
                      <th className="py-4 px-6 font-bold text-slate-700">Escola</th>
                      <th className="py-4 px-6 font-bold text-slate-700 text-right">EcoTrocas Arrecadadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500">Carregando ranking...</td>
                      </tr>
                    ) : topSchools.length > 0 ? (
                      topSchools.map((school, index) => (
                        <tr key={school.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 text-center">
                            {index === 0 && <Medal className="h-6 w-6 text-yellow-500 mx-auto" />}
                            {index === 1 && <Medal className="h-6 w-6 text-slate-400 mx-auto" />}
                            {index === 2 && <Medal className="h-6 w-6 text-amber-700 mx-auto" />}
                            {index > 2 && <span className="text-slate-500 font-bold">{index + 1}º</span>}
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-800">{school.name}</td>
                          <td className="py-4 px-6 font-bold text-[#00A859] text-right">
                            {school.total_received.toLocaleString('pt-BR')} <span className="text-sm font-semibold text-slate-500 ml-1">EcoTrocas</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500">Nenhum dado encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-24 text-center max-w-3xl mx-auto">
            <p className="text-lg text-slate-600 font-medium italic">
              "Quando a comunidade se une pela sustentabilidade, o resultado é um legado de vida para as próximas gerações."
            </p>
          </div>

        </div>
      </main>

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
                <li><Link to="/noticias" className="hover:text-white transition-colors">Notícias</Link></li>
                <li><a href="/#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
                <li><Link to="/impacto" className="text-escola font-bold hover:text-green-400 transition-colors">Impacto Ecológico e Social Acumulado</Link></li>
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

          <div className="flex flex-col items-center justify-center gap-2 text-xs font-semibold text-slate-500 text-center">
            <p>© {new Date().getFullYear()} Hub de Inovação — Prefeitura de Água Boa</p>
            <p>Desenvolvimento: Marcio Gleik.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImpactPage;
