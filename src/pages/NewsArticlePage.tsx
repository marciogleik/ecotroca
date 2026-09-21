import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Calendar,
  Share2
} from 'lucide-react';
import { newsData } from '../data/newsData';

const NewsArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const article = newsData.find(item => item.slug === slug);
  const recentNews = newsData.filter(item => item.slug !== slug).slice(0, 4);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Notícia não encontrada</h2>
        <button 
          onClick={() => navigate('/noticias')}
          className="inline-flex items-center text-escola font-bold hover:text-green-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Notícias
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-800 flex flex-col">
      
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

      <main className="flex-1">
        {/* ────────────────────── HERO ARTICLE ────────────────────── */}
        <div className="w-full bg-[#F8FAFC] pt-12 pb-8 sm:pb-12 border-b border-slate-200/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link 
              to="/noticias" 
              className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-escola mb-8 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Notícias
            </Link>
            
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm ${article.categoryStyle}`}>
                <span className="text-lg">{article.categoryIcon}</span>
                <span className="text-xs font-bold uppercase tracking-widest">{article.category}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
                <Calendar className="w-4 h-4" />
                {article.date}
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-8">
              {article.title}
            </h1>

            <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-100">
              <img 
                src={article.coverImage} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* ────────────────────── ARTICLE BODY ────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-12 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            
            <article className="lg:col-span-2">
              <div className="prose prose-lg prose-slate prose-a:text-escola hover:prose-a:text-green-700 max-w-none mb-16">
                {article.content.map((paragraph, index) => (
                  <p 
                    key={index} 
                    className="text-lg sm:text-xl text-slate-700 leading-relaxed mb-6"
                    dangerouslySetInnerHTML={{ __html: paragraph }} 
                  />
                ))}
              </div>

              {/* ────────────────────── GALLERY ────────────────────── */}
              {article.gallery && article.gallery.length > 0 && (
                <div className="mt-16 pt-16 border-t border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Galeria de Fotos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {article.gallery.map((imgSrc, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-slate-100 group">
                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                        <img 
                          src={imgSrc} 
                          alt={`Galeria - Imagem ${idx + 1}`} 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-20 flex justify-start">
                <button 
                  onClick={() => {
                    const shareText = `Veja essa notícia do EcoTroca: ${article.title}\n\n${article.excerpt}\n\nLeia mais em: ${window.location.href}`;
                    
                    if (navigator.share) {
                      navigator.share({
                        title: article.title,
                        text: `Veja essa notícia do EcoTroca: ${article.title}\n\n${article.excerpt}`,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(shareText);
                      alert('Texto e link copiados para a área de transferência!');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Compartilhar Notícia
                </button>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-28 space-y-8">
                <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-4">Últimas Notícias</h3>
                <div className="space-y-6">
                  {recentNews.map(news => (
                    <Link key={news.slug} to={`/noticias/${news.slug}`} className="group flex gap-4 items-start">
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 shadow-sm border border-slate-200/60">
                        <img src={news.coverImage} alt={news.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-escola uppercase tracking-wider">{news.category}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-escola transition-colors line-clamp-3">
                          {news.title}
                        </h4>
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" />
                          {news.date}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

          </div>
        </div>
      </main>

      {/* ────────────────────── FOOTER ────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800/80 mt-auto">
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

export default NewsArticlePage;
