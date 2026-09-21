export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  categoryStyle: string; // Tailwind classes for the category badge
  categoryIcon: string;
  excerpt: string;
  coverImage: string;
  content: string[]; // HTML strings for paragraphs
  gallery?: string[]; // Array of image URLs for the gallery
}

export const newsData: NewsItem[] = [
  {
    id: '1',
    slug: '1000-ecotrocas-chegam-aos-feirantes',
    title: 'Mais de 1.000 ecotrocas chegam aos feirantes',
    date: '20 de Setembro de 2026',
    category: 'Ação na Comunidade',
    categoryStyle: 'bg-green-50 text-green-700 border-green-100',
    categoryIcon: '🌱',
    excerpt: 'Mais de 1.000 ecotrocas foram entregues no domingo aos feirantes, dando continuidade às ações de educação ambiental e sustentabilidade desenvolvidas em nosso município. Contamos com a participação especial dos alunos da Escola Pestalozzi.',
    coverImage: '/news/Ecotroca1.jpeg',
    content: [
      'Mais de <strong>1.000 ecotrocas</strong> foram entregues no domingo, 20/09/2026, aos feirantes, dando continuidade às ações de educação ambiental e sustentabilidade desenvolvidas em nosso município.',
      'Nesta etapa, contamos com a participação especial dos <strong>alunos da Escola Pestalozzi</strong>, que estiveram presentes na entrega e ajudaram a levar adiante essa iniciativa.',
      'A ação integra um projeto que conta com a participação de <strong>diversas escolas e alunos</strong>, mostrando que, quando a comunidade se une, pequenas atitudes podem gerar grandes resultados. 🌱🤝',
      'Nosso agradecimento especial aos alunos da <strong>Escola Pestalozzi</strong> e a todos que fazem parte desse movimento em prol da natureza e da nossa economia solidária!'
    ],
    gallery: [
      '/news/Ecotroca1.jpeg',
      '/news/Ecotroca2.jpeg',
      '/news/Ecotroca3.jpeg',
      '/news/Ecotroca4.jpeg',
      '/news/Ecotroca5.jpeg',
      '/news/Ecotroca6.jpeg'
    ]
  },
  {
    id: '2',
    slug: 'inauguracao-projeto-ecotroca',
    title: 'Inauguração do EcoTroca',
    date: '31 de Maio de 2026',
    category: 'Lançamento Oficial',
    categoryStyle: 'bg-amber-50 text-amber-700 border-amber-100',
    categoryIcon: '🎉',
    excerpt: 'Um marco para a sustentabilidade e economia solidária em nossa cidade! As primeiras trocas mostraram na prática a força do projeto: crianças transformando material reciclável em alimentos fresquinhos direto da agricultura familiar.',
    coverImage: '/inauguracao.jpg',
    content: [
      'Um marco para a sustentabilidade e economia solidária em nossa cidade! Hoje celebramos oficialmente o lançamento do programa <strong>EcoTroca</strong>.',
      'As primeiras trocas realizadas mostraram na prática a força do projeto e o seu impacto imediato: crianças e famílias puderam transformar material reciclável (que de outra forma iria para o lixo) em alimentos fresquinhos, colhidos direto da nossa agricultura familiar.',
      'O evento de lançamento ocorreu na tradicional <strong>Feira do Pequeno Produtor</strong>, que estava repleta de alegria, música e conscientização ambiental.',
      'Essa é mais uma ação da Prefeitura Municipal, que demonstra o compromisso com a educação das nossas crianças, com o meio ambiente e com a geração de renda local.'
    ]
  }
];
