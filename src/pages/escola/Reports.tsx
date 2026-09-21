import React, { useEffect, useState } from 'react';
import { Card, CardBody, Button, Input, LiveIndicator, StatCard } from '../../components/ui';
import { 
  Download, History, Trophy, Recycle, Coins, PackageCheck, UserCheck, 
  ArrowUpRight, Printer, FileText, CheckSquare, Filter, RotateCcw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCurrentFortnight } from '../../utils/fortnight';

const EscolaReports: React.FC = () => {
  const { schoolId } = useAuth();
  const currentFortnight = getCurrentFortnight();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'allocations' | 'rankings' | 'association_coleta'>('deliveries');
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [associationName, setAssociationName] = useState('Associação de Recicladores / Catadores');

  // Filter state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [materialCategory, setMaterialCategory] = useState<string>('all');

  // Report datasets
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);

  const fetchData = async () => {
    if (!schoolId) return;
    setLoading(true);

    try {
      // 1. Fetch school info
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (schoolData) {
        setSchool(schoolData);
      }

      const schoolName = schoolData?.name;

      // 2. Fetch school allocations (Verdinhos da Prefeitura)
      const { data: allocationsData } = await supabase
        .from('school_allocations')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      setAllocations(allocationsData || []);

      // 3. Fetch students of this school
      if (schoolName) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, name, enrollment, ecotrocas')
          .eq('school', schoolName);

        const studentIds = studentsData?.map(s => s.id) || [];

        // 4. Fetch deliveries for these students
        let deliveriesList: any[] = [];
        if (studentIds.length > 0) {
          const { data: delData } = await supabase
            .from('deliveries')
            .select('*, students(enrollment)')
            .in('student_id', studentIds)
            .order('created_at', { ascending: false });

          deliveriesList = delData || [];
        }

        setDeliveries(deliveriesList);
      }
    } catch (error) {
      console.error('Error fetching school reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('escola-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_allocations' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId]);

  // Handle Date Presets
  const handlePresetDate = (preset: 'today' | '7days' | 'fortnight' | 'month' | 'all') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'fortnight') {
      const fortnight = getCurrentFortnight();
      setStartDate(fortnight.startIsoDateString);
      setEndDate(fortnight.endIsoDateString);
    } else if (preset === 'month') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setMaterialCategory('all');
    setSearchTerm('');
  };

  // Filter deliveries by date range + material category + search term
  const filteredDeliveries = deliveries.filter(d => {
    const deliveryDate = d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : '';
    
    if (startDate && deliveryDate < startDate) return false;
    if (endDate && deliveryDate > endDate) return false;

    if (materialCategory === 'pet' && !(d.pet_units > 0)) return false;
    if (materialCategory === 'tetra_pak' && !(d.tetra_pak_units > 0)) return false;
    if (materialCategory === 'aluminum' && !(d.aluminum_units > 0)) return false;
    if (materialCategory === 'plastic' && !(d.plastic_units > 0 || (!d.pet_units && !d.aluminum_units && d.containers > 0))) return false;
    if (materialCategory === 'oil' && !(Number(d.oil_liters) > 0)) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = d.student_name?.toLowerCase().includes(search);
      const matchesEnrollment = d.students?.enrollment?.toLowerCase().includes(search);
      const matchesReceiver = d.received_by?.toLowerCase().includes(search);
      if (!matchesName && !matchesEnrollment && !matchesReceiver) return false;
    }

    return true;
  });

  // Calculate dynamic totals for filtered deliveries
  let filteredTotalContainers = 0;
  let filteredTotalOil = 0;
  let filteredTetraPak = 0;
  let filteredPlastic = 0;
  let filteredAluminum = 0;
  let filteredPet = 0;
  let filteredDistributedET = 0;

  filteredDeliveries.forEach(curr => {
    filteredTotalContainers += curr.containers || 0;
    filteredTotalOil += Number(curr.oil_liters) || 0;
    filteredTetraPak += curr.tetra_pak_units || 0;
    filteredPlastic += curr.plastic_units || 0;
    filteredAluminum += curr.aluminum_units || 0;
    filteredPet += curr.pet_units || 0;
    filteredDistributedET += curr.ecotrocas_earned || 0;
  });

  // Filter allocations by date + search
  const filteredAllocations = allocations.filter(a => {
    const allocDate = a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : '';
    if (startDate && allocDate < startDate) return false;
    if (endDate && allocDate > endDate) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesReceiver = a.received_by && a.received_by.toLowerCase().includes(search);
      const matchesNotes = a.notes && a.notes.toLowerCase().includes(search);
      if (!matchesReceiver && !matchesNotes) return false;
    }

    return true;
  });

  // Dynamic student rankings based on filtered deliveries
  const studentMap: any = {};
  filteredDeliveries.forEach((d) => {
    const key = d.student_id;
    if (!studentMap[key]) {
      studentMap[key] = {
        id: d.student_id,
        name: d.student_name,
        enrollment: d.students?.enrollment || 'N/A',
        totalEcotrocas: 0,
        totalContainers: 0,
        totalOil: 0,
        deliveryCount: 0
      };
    }
    studentMap[key].totalEcotrocas += d.ecotrocas_earned || 0;
    studentMap[key].totalContainers += d.containers || 0;
    studentMap[key].totalOil += Number(d.oil_liters) || 0;
    studentMap[key].deliveryCount += 1;
  });

  const filteredRankings = Object.values(studentMap)
    .sort((a: any, b: any) => b.totalEcotrocas - a.totalEcotrocas);

  const handlePrintFilteredReport = () => {
    window.print();
  };

  // CSV Export handler (uses filtered datasets)
  const handleExportCSV = () => {
    let headers: string[] = [];
    let csvRows: string[] = [];

    if (activeTab === 'deliveries') {
      headers = [
        'Data/Hora',
        'Aluno',
        'Matrícula',
        'Total Embalagens',
        'Detalhamento (PET | Lata | Plástico)',
        'Qtd PET',
        'Qtd Alumínio (Lata)',
        'Qtd Plástico',
        'Qtd Tetra Pak',
        'Óleo (L)',
        'Ecotrocas (ET)',
        'Registrado por'
      ];
      csvRows = [
        headers.join(','),
        ...filteredDeliveries.map(item => {
          const pet = item.pet_units ?? 0;
          const aluminum = item.aluminum_units ?? 0;
          const plastic = item.plastic_units || (!item.pet_units && !item.aluminum_units ? (item.containers || 0) : 0);
          const tetra = item.tetra_pak_units ?? 0;
          const detailStr = `PET: ${pet} | Lata: ${aluminum} | Plástico: ${plastic}${tetra ? ` | TetraPak: ${tetra}` : ''}`;
          
          return `"${new Date(item.created_at).toLocaleString('pt-BR')}","${item.student_name}","${item.students?.enrollment || ''}","${item.containers || 0}","${detailStr}","${pet}","${aluminum}","${plastic}","${tetra}","${item.oil_liters || 0}","${item.ecotrocas_earned}","${item.received_by || 'Escola'}"`;
        })
      ];
    } else if (activeTab === 'allocations') {
      headers = ['Data/Hora', 'Tipo Operação', 'Quantidade ET', 'Retirado por (Representante)', 'Observações / Recibo'];
      csvRows = [
        headers.join(','),
        ...filteredAllocations.map(item =>
          `"${new Date(item.created_at).toLocaleString('pt-BR')}","${item.amount > 0 ? 'Recebimento de Verdinhos' : 'Ajuste/Retirada'}","${item.amount}","${item.received_by || 'Não informado'}","${item.notes || ''}"`
        )
      ];
    } else if (activeTab === 'rankings') {
      headers = ['Posição', 'Aluno', 'Matrícula', 'Total Ecotrocas', 'Total Embalagens', 'Óleo (L)', 'Entregas Feitas'];
      csvRows = [
        headers.join(','),
        ...filteredRankings.map((item: any, idx: number) =>
          `"${idx + 1}","${item.name}","${item.enrollment}","${item.totalEcotrocas}","${item.totalContainers}","${item.totalOil.toFixed(1)}","${item.deliveryCount}"`
        )
      ];
    } else if (activeTab === 'association_coleta') {
      headers = ['Categoria de Reciclável', 'Quantidade Registrada', 'Unidade de Medida'];
      csvRows = [
        headers.join(','),
        `"Embalagens Garrafas PET","${filteredPet}","unidades"`,
        `"Embalagens Tetra Pak (Leite, Suco, etc.)","${filteredTetraPak}","unidades"`,
        `"Embalagens Plásticas (Embalagens Rígidas)","${filteredPlastic}","unidades"`,
        `"Alumínio (Latinhas de Bebidas)","${filteredAluminum}","unidades"`,
        `"Óleo de Cozinha Usado","${filteredTotalOil.toFixed(1)}","Litros"`,
        `"TOTAL GERAL DE EMBALAGENS RECOLHIDAS","${filteredTotalContainers}","unidades"`
      ];
    }

    if (csvRows.length <= 1) return;

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_escola_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryLabel = () => {
    switch (materialCategory) {
      case 'pet': return 'Garrafas PET';
      case 'tetra_pak': return 'Embalagens Tetra Pak';
      case 'aluminum': return 'Alumínio / Latinhas';
      case 'plastic': return 'Plásticos em Geral';
      case 'oil': return 'Óleo de Cozinha';
      default: return 'Todas as Categorias';
    }
  };

  const getPeriodLabel = () => {
    if (startDate && endDate) {
      return `Período: ${format(new Date(startDate + 'T00:00:00'), 'dd/MM/yyyy')} a ${format(new Date(endDate + 'T00:00:00'), 'dd/MM/yyyy')}`;
    }
    if (startDate) return `A partir de: ${format(new Date(startDate + 'T00:00:00'), 'dd/MM/yyyy')}`;
    if (endDate) return `Até: ${format(new Date(endDate + 'T00:00:00'), 'dd/MM/yyyy')}`;
    return 'Todo o Período';
  };

  return (
    <div className="space-y-8">
      {/* ────────────────────── RELATÓRIO IMPRESSO A4 ────────────────────── */}
      <div id="printable-receipt" className="hidden print:block p-8 bg-white text-black font-serif leading-relaxed">
        <div className="border-b-2 border-emerald-800 pb-4 mb-6 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-emerald-950">
            PROJETO ECOTROCA — RELATÓRIO OFICIAL DE COLETA E REPASSE
          </h1>
          <p className="text-sm font-semibold text-gray-700 mt-1">
            {getPeriodLabel()} — {getCategoryLabel()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-gray-50 p-4 rounded border border-gray-300">
          <div>
            <p><strong>Escola Municipal:</strong> {school?.name || 'N/A'}</p>
            <p><strong>Direção / Responsável:</strong> {school?.responsible || 'N/A'}</p>
            <p><strong>Endereço:</strong> {school?.address || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p><strong>Associação Destino:</strong> {associationName}</p>
            <p><strong>Data de Emissão:</strong> {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <p><strong>Total de Ecotrocas Lançadas:</strong> {filteredDistributedET} ET</p>
          </div>
        </div>

        <h3 className="text-base font-bold mb-3 uppercase text-gray-800 border-b pb-1">
          Quantitativo de Materiais no Período Selecionado
        </h3>
        <table className="w-full text-left text-sm border border-gray-400 mb-8">
          <thead>
            <tr className="bg-gray-200 border-b border-gray-400">
              <th className="p-3 font-bold border-r border-gray-400">Categoria do Reciclável</th>
              <th className="p-3 font-bold border-r border-gray-400 text-center">Quantidade Coletada</th>
              <th className="p-3 font-bold text-center">Unidade de Medida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            <tr>
              <td className="p-3 font-semibold border-r border-gray-300">Garrafas PET</td>
              <td className="p-3 font-bold text-center border-r border-gray-300">{filteredPet}</td>
              <td className="p-3 text-center">Unidades</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold border-r border-gray-300">Embalagens Tetra Pak (Leite, Suco, etc.)</td>
              <td className="p-3 font-bold text-center border-r border-gray-300">{filteredTetraPak}</td>
              <td className="p-3 text-center">Unidades</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold border-r border-gray-300">Embalagens Plásticas (Embalagens Rígidas)</td>
              <td className="p-3 font-bold text-center border-r border-gray-300">{filteredPlastic}</td>
              <td className="p-3 text-center">Unidades</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold border-r border-gray-300">Alumínio (Latinhas de Bebidas)</td>
              <td className="p-3 font-bold text-center border-r border-gray-300">{filteredAluminum}</td>
              <td className="p-3 text-center">Unidades</td>
            </tr>
            <tr className="bg-emerald-50/50">
              <td className="p-3 font-semibold border-r border-gray-300">Óleo de Cozinha Usado</td>
              <td className="p-3 font-bold text-center border-r border-gray-300 text-blue-900">{filteredTotalOil.toFixed(1)}</td>
              <td className="p-3 text-center font-bold">Litros</td>
            </tr>
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
              <td className="p-3 border-r border-gray-400">TOTAL GERAL DE EMBALAGENS RECOLHIDAS NO PERÍODO</td>
              <td className="p-3 text-center border-r border-gray-400 text-emerald-900 text-base">{filteredTotalContainers}</td>
              <td className="p-3 text-center">Unidades Total</td>
            </tr>
          </tbody>
        </table>

        {/* Tabela detalhada das entregas no período */}
        {filteredDeliveries.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-bold mb-3 uppercase text-gray-800 border-b pb-1">
              Relação Detalhada de Entregas no Período ({filteredDeliveries.length} registros)
            </h3>
            <table className="w-full text-left text-xs border border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-2 font-bold border-r">Data/Hora</th>
                  <th className="p-2 font-bold border-r">Aluno</th>
                  <th className="p-2 font-bold border-r">Matrícula</th>
                  <th className="p-2 font-bold border-r text-center">Embalagens</th>
                  <th className="p-2 font-bold border-r text-center">Óleo (L)</th>
                  <th className="p-2 font-bold text-right">Ecotrocas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDeliveries.slice(0, 40).map((d) => (
                  <tr key={d.id}>
                    <td className="p-2 border-r">{format(new Date(d.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="p-2 border-r font-semibold">{d.student_name}</td>
                    <td className="p-2 border-r">{d.students?.enrollment || '-'}</td>
                    <td className="p-2 border-r text-center">{d.containers || 0} un</td>
                    <td className="p-2 border-r text-center">{Number(d.oil_liters || 0).toFixed(1)} L</td>
                    <td className="p-2 text-right font-bold text-emerald-900">+{d.ecotrocas_earned} ET</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDeliveries.length > 40 && (
              <p className="text-[10px] text-gray-500 italic mt-1 text-center">
                * Exibindo os primeiros 40 registros de {filteredDeliveries.length} do período no impresso.
              </p>
            )}
          </div>
        )}

        <div className="pt-20 grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <div className="border-t border-black pt-2 font-bold">{school?.responsible || 'Responsável da Escola'}</div>
            <p className="text-gray-600">Assinatura da Direção / Coordenação da Escola</p>
          </div>
          <div>
            <div className="border-t border-black pt-2 font-bold">{associationName}</div>
            <p className="text-gray-600">Assinatura e Carimbo da Associação / Coletor</p>
          </div>
        </div>
      </div>

      {/* ────────────────────── TELA NORMAL DO NAVEGADOR ────────────────────── */}
      <div className="print:hidden space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 items-start">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Relatórios da Escola</h1>
              <LiveIndicator />
            </div>
            <p className="text-gray-500 mt-1">
              {school ? `Acompanhamento detalhado das entregas, verdinhos e desempenho de ${school.name}` : 'Acompanhamento detalhado da sua escola'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button roleColor="escola" variant="outline" onClick={handlePrintFilteredReport}>
              <Printer className="h-5 w-5 mr-2" />
              Imprimir Relatório Filtrado
            </Button>
            <Button roleColor="escola" onClick={handleExportCSV}>
              <Download className="h-5 w-5 mr-2" />
              Exportar CSV Filtrado
            </Button>
          </div>
        </div>

        {/* ────────────────────── PAINEL DE FILTROS AVANÇADOS ────────────────────── */}
        <Card className="border-2 border-escola/20 bg-white shadow-sm">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-escola" />
                <h3 className="font-bold text-gray-900 text-base">Filtros de Período e Categoria</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={handleResetFilters} className="text-gray-500 hover:text-gray-800">
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            </div>

            {/* Inputs de Data e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-escola focus:border-escola bg-white h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-escola focus:border-escola bg-white h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Categoria de Material</label>
                <select
                  value={materialCategory}
                  onChange={(e) => setMaterialCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-escola focus:border-escola bg-white h-[42px]"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="pet">🥤 Garrafas PET</option>
                  <option value="tetra_pak">🧃 Embalagens Tetra Pak</option>
                  <option value="aluminum">🥫 Alumínio (Latinhas)</option>
                  <option value="plastic">🧴 Plásticos em Geral</option>
                  <option value="oil">🛢️ Óleo de Cozinha Usado</option>
                </select>
              </div>
            </div>

            {/* Botões de Atalho de Período Rápido */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Atalhos:</span>
              <button
                type="button"
                onClick={() => handlePresetDate('today')}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 hover:bg-escola/10 hover:text-escola hover:border-escola transition-all bg-gray-50"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate('7days')}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 hover:bg-escola/10 hover:text-escola hover:border-escola transition-all bg-gray-50"
              >
                Últimos 7 Dias
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate('fortnight')}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-escola/30 text-escola font-bold bg-escola/5 hover:bg-escola/10 transition-all"
              >
                Esta Quinzena ({currentFortnight.label})
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate('month')}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 hover:bg-escola/10 hover:text-escola hover:border-escola transition-all bg-gray-50"
              >
                Este Mês (30d)
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate('all')}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 hover:bg-escola/10 hover:text-escola hover:border-escola transition-all bg-gray-50"
              >
                Todo o Período
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Cards de Resumo Recalculados Dinamicamente */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Recicláveis Coletados"
            value={`${filteredTotalContainers} un`}
            icon={Recycle}
            roleColor="escola"
            subtitle={`+ ${filteredTotalOil.toFixed(1)}L de óleo no período`}
          />
          <StatCard
            label="Ecotrocas Distribuídas"
            value={`${filteredDistributedET} ET`}
            icon={Coins}
            roleColor="escola"
            subtitle="Entregues no período selecionado"
          />
          <StatCard
            label="Recebido da Prefeitura"
            value={`${school?.total_received || 0} ET`}
            icon={PackageCheck}
            roleColor="escola"
            subtitle="Total acumulado da escola"
          />
          <StatCard
            label="Estoque Atual de Verdinhos"
            value={`${school?.current_balance || 0} ET`}
            icon={Coins}
            roleColor="escola"
            subtitle={school?.current_balance < 50 ? '⚠️ Estoque baixo' : 'Disponível em caixa'}
          />
        </div>

        {/* Detalhamento por Categoria (Período Filtrado) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-900">
            <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider block">🥤 Garrafas PET</span>
            <p className="text-xl font-black mt-0.5">{filteredPet} <span className="text-xs font-normal text-green-700">un</span></p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">🧃 Tetra Pak</span>
            <p className="text-xl font-black mt-0.5">{filteredTetraPak} <span className="text-xs font-normal text-emerald-700">un</span></p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">🧴 Plásticos</span>
            <p className="text-xl font-black mt-0.5">{filteredPlastic} <span className="text-xs font-normal text-blue-700">un</span></p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">🥫 Alumínio</span>
            <p className="text-xl font-black mt-0.5">{filteredAluminum} <span className="text-xs font-normal text-amber-700">un</span></p>
          </div>
          <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-3 text-amber-900 col-span-2 md:col-span-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">🛢️ Óleo Usado</span>
            <p className="text-xl font-black mt-0.5">{filteredTotalOil.toFixed(1)} <span className="text-xs font-normal text-amber-800">L</span></p>
          </div>
        </div>

        {/* Abas e Tabela Filtrada */}
        <Card>
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('deliveries')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center ${
                    activeTab === 'deliveries'
                      ? 'bg-escola text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <History className="h-4 w-4 mr-2" />
                  Entregas dos Alunos ({filteredDeliveries.length})
                </button>

                <button
                  onClick={() => setActiveTab('association_coleta')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center ${
                    activeTab === 'association_coleta'
                      ? 'bg-escola text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório para Associação
                </button>

                <button
                  onClick={() => setActiveTab('allocations')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center ${
                    activeTab === 'allocations'
                      ? 'bg-escola text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <PackageCheck className="h-4 w-4 mr-2" />
                  Verdinhos da Prefeitura ({filteredAllocations.length})
                </button>

                <button
                  onClick={() => setActiveTab('rankings')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center ${
                    activeTab === 'rankings'
                      ? 'bg-escola text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Ranking ({filteredRankings.length})
                </button>
              </div>

              {/* Input de Busca na Tabela */}
              <div className="w-full md:w-72">
                <Input
                  placeholder="Buscar aluno ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  roleColor="escola"
                />
              </div>
            </div>

            {/* Conteúdo Aba Relatório para Associação */}
            {activeTab === 'association_coleta' && (
              <div className="space-y-6">
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                      Relatório da Escola para Assinatura da Associação de Reciclagem
                    </h3>
                    <p className="text-xs text-emerald-700 mt-1">
                      Emita o termo oficial com os quantitativos filtrados para recolhimento e assinatura dos coletores.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Nome da Associação"
                      value={associationName}
                      onChange={(e) => setAssociationName(e.target.value)}
                      className="bg-white text-xs w-64"
                    />
                    <Button roleColor="escola" onClick={handlePrintFilteredReport}>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Relatório Filtrado
                    </Button>
                  </div>
                </div>

                <div className="border rounded-xl p-6 bg-gray-50/50 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{school?.name || 'Escola Municipal'}</h4>
                      <p className="text-xs text-gray-500">{getPeriodLabel()} — {getCategoryLabel()}</p>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                      {format(new Date(), 'dd/MM/yyyy')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <span className="text-xs font-medium text-gray-500">PET</span>
                      <p className="text-xl font-bold text-gray-900 mt-1">{filteredPet} un</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <span className="text-xs font-medium text-gray-500">Tetra Pak</span>
                      <p className="text-xl font-bold text-gray-900 mt-1">{filteredTetraPak} un</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <span className="text-xs font-medium text-gray-500">Plásticos</span>
                      <p className="text-xl font-bold text-gray-900 mt-1">{filteredPlastic} un</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <span className="text-xs font-medium text-gray-500">Alumínio</span>
                      <p className="text-xl font-bold text-gray-900 mt-1">{filteredAluminum} un</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <span className="text-xs font-medium text-gray-500">Óleo Usado</span>
                      <p className="text-xl font-bold text-blue-700 mt-1">{filteredTotalOil.toFixed(1)} L</p>
                    </div>
                  </div>

                  <div className="text-right pt-2">
                    <Button roleColor="escola" variant="outline" onClick={handlePrintFilteredReport}>
                      <Printer className="h-4 w-4 mr-2" />
                      Gerar Impressão Oficial com Assinaturas
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 1: Entregas de Alunos */}
            {activeTab === 'deliveries' && (
              loading ? (
                <div className="text-center py-8 text-gray-400">Carregando entregas dos alunos...</div>
              ) : filteredDeliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma entrega encontrada para os filtros selecionados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Data / Hora</th>
                        <th className="py-3 px-4">Aluno</th>
                        <th className="py-3 px-4">Matrícula</th>
                        <th className="py-3 px-4 text-center">Embalagens (un)</th>
                        <th className="py-3 px-4 text-center">Óleo (L)</th>
                        <th className="py-3 px-4 text-right">Ecotrocas (ET)</th>
                        <th className="py-3 px-4">Registrado Por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDeliveries.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                            {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">{item.student_name}</td>
                          <td className="py-3 px-4 text-xs font-semibold text-gray-500">{item.students?.enrollment || '-'}</td>
                          <td className="py-3 px-4 text-center font-semibold text-gray-700">
                            <div className="font-bold text-gray-900 text-sm">{item.containers || 0}</div>
                            <div className="text-[11px] font-medium text-gray-500 whitespace-nowrap mt-0.5">
                              PET: {item.pet_units ?? 0} | Lata: {item.aluminum_units ?? 0} | Plástico: {(item.plastic_units || (!item.pet_units && !item.aluminum_units ? item.containers : 0))}
                              {item.tetra_pak_units ? ` | TetraPak: ${item.tetra_pak_units}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-blue-700">
                            {Number(item.oil_liters || 0).toFixed(1)} L
                          </td>
                          <td className="py-3 px-4 text-right font-black text-escola">
                            +{item.ecotrocas_earned} ET
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600">
                            {item.received_by ? (
                              <span className="inline-flex items-center text-gray-700">
                                <UserCheck className="h-3.5 w-3.5 mr-1 text-escola" />
                                {item.received_by}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Equipe Escolar</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Conteúdo da Aba 2: Repasses da Prefeitura */}
            {activeTab === 'allocations' && (
              loading ? (
                <div className="text-center py-8 text-gray-400">Carregando históricos da prefeitura...</div>
              ) : filteredAllocations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum repasse de verdinhos no período selecionado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Data / Hora</th>
                        <th className="py-3 px-4">Tipo de Operação</th>
                        <th className="py-3 px-4 text-right">Quantidade</th>
                        <th className="py-3 px-4">Quem Retirou na Prefeitura</th>
                        <th className="py-3 px-4">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAllocations.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                            {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="py-3 px-4">
                            {item.amount > 0 ? (
                              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <ArrowUpRight className="h-3 w-3 mr-1" /> Recebimento de Verdinhos
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                                Estorno / Retirada
                              </span>
                            )}
                          </td>
                          <td className={`py-3 px-4 text-right font-black ${item.amount > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {item.amount > 0 ? `+${item.amount}` : item.amount} ET
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-gray-800">
                            {item.received_by || <span className="text-gray-400 italic">Não informado</span>}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Conteúdo da Aba 3: Ranking de Alunos */}
            {activeTab === 'rankings' && (
              loading ? (
                <div className="text-center py-8 text-gray-400">Carregando ranking dos alunos...</div>
              ) : filteredRankings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum aluno com entregas encontradas para os filtros.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4 text-center">Posição</th>
                        <th className="py-3 px-4">Aluno</th>
                        <th className="py-3 px-4">Matrícula</th>
                        <th className="py-3 px-4 text-center">Entregas Feitas</th>
                        <th className="py-3 px-4 text-center">Embalagens</th>
                        <th className="py-3 px-4 text-center">Óleo (L)</th>
                        <th className="py-3 px-4 text-right">Ecotrocas Acumuladas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRankings.map((item: any, idx: number) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                              idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              idx === 1 ? 'bg-slate-200 text-slate-800' :
                              idx === 2 ? 'bg-amber-800/10 text-amber-900' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {idx + 1}º
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">{item.name}</td>
                          <td className="py-3 px-4 text-xs font-semibold text-gray-500">{item.enrollment}</td>
                          <td className="py-3 px-4 text-center font-medium text-gray-700">{item.deliveryCount}</td>
                          <td className="py-3 px-4 text-center font-medium text-gray-700">{item.totalContainers} un</td>
                          <td className="py-3 px-4 text-center font-medium text-blue-700">{item.totalOil.toFixed(1)} L</td>
                          <td className="py-3 px-4 text-right font-black text-escola">{item.totalEcotrocas} ET</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default EscolaReports;


