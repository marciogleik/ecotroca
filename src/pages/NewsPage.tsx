import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu,
  X,
  ArrowRight,
  MapPin,
  Calendar
} from 'lucide-react';

const NewsPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <Link to="/noticias" className="text-sm font-bold text-escola hover:text-green-700 transition-colors">Notícias</Link>
              <Link to="/#como-funciona" className="text-sm font-semibold text-slate-600 hover:text-escola transition-colors">Como Funciona</Link>
              <Link 
                to="/impacto" 
                className="text-sm font-semibold text-slate-600 hover:text-escola transition-colors flex items-center gap-1"
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
                className="block px-4 py-3 rounded-xl text-base font-bold text-escola bg-green-50 hover:bg-green-100 transition-colors"
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
                className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-600 hover:bg-slate-50 hover:text-escola transition-colors"
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

      <main className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <span className="text-xs font-bold text-escola tracking-wider uppercase">Fique por Dentro</span>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Portal de Notícias
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Acompanhe todas as atualizações, entregas e resultados do projeto EcoTroca na nossa comunidade.
            </p>
          </div>

          <div className="flex flex-col gap-24">
            
            {/* Destaque Principal */}
            <article className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
              <div className="w-full lg:w-1/2 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 shadow-sm">
                    <span className="text-lg">🌱</span>
                    <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Ação na Comunidade</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold">
                    <Calendar className="w-4 h-4" />
                    20 de Setembro de 2026
                  </div>
                </div>
                
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Mais de 1.000 ecotrocas chegam aos feirantes
                </h3>
                
                <div className="text-lg text-slate-600 font-medium leading-relaxed space-y-5">
                  <p>Mais de <strong>1.000 ecotrocas</strong> foram entregues no domingo 20/09/2026 aos feirantes, dando continuidade às ações de educação ambiental e sustentabilidade desenvolvidas em nosso município.</p>
                  
                  <p>Nesta etapa, contamos com a participação especial dos <strong>alunos da Escola Pestalozzi</strong>, que estiveram presentes na entrega e ajudaram a levar adiante essa iniciativa.</p>
                  
                  <p>A ação integra um projeto que conta com a participação de <strong>diversas escolas e alunos</strong>, mostrando que, quando a comunidade se une, pequenas atitudes podem gerar grandes resultados. 🌱🤝</p>
                  
                  <p>Nosso agradecimento aos alunos da <strong>Escola Pestalozzi</strong> e a todos que fazem parte desse movimento!</p>
                </div>
              </div>
              
              <div className="w-full lg:w-1/2">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div key={num} className="relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3] bg-slate-100 group">
                      <div className="absolute inset-0 bg-slate-900/10 z-10 group-hover:bg-transparent transition-colors duration-300"></div>
                      <img 
                        src={`/news/Ecotroca${num}.jpeg`} 
                        alt={`Ação EcoTroca - Foto ${num}`} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <div className="w-full h-px bg-slate-200"></div>

            {/* Notícia Secundária */}
            <article className="flex flex-col lg:flex-row-reverse gap-10 lg:gap-16 items-center">
              <div className="w-full lg:w-1/2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 border-4 border-white bg-slate-100 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/20 to-transparent z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-500"></div>
                  <img 
                    src="/inauguracao.jpg" 
                    alt="Inauguração do projeto EcoTroca na Feira do Pequeno Produtor com crianças usando as notas" 
                    className="w-full h-[350px] sm:h-[450px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="w-full lg:w-1/2 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 shadow-sm">
                    <span className="text-lg">🎉</span>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Lançamento Oficial</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold">
                    <Calendar className="w-4 h-4" />
                    31 de Maio de 2026
                  </div>
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Inauguração do <span className="text-escola">EcoTroca</span>
                </h3>
                
                <p className="text-lg text-slate-600 font-medium leading-relaxed">
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
            </article>

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
                <li><Link to="/noticias" className="text-escola font-bold hover:text-green-400 transition-colors">Notícias</Link></li>
                <li><a href="/#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
                <li><Link to="/impacto" className="hover:text-white transition-colors">Impacto Ecológico e Social Acumulado</Link></li>
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

export default NewsPage;
