import React, { useEffect, useState } from 'react';
import { Card, CardBody, Button, Input, LiveIndicator, StatCard } from '../../components/ui';
import { Download, History, Trophy, Recycle, Coins, PackageCheck, UserCheck, ArrowUpRight, Printer, FileText, CheckSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const EscolaReports: React.FC = () => {
  const { schoolId } = useAuth();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'allocations' | 'rankings' | 'association_coleta'>('deliveries');
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [associationName, setAssociationName] = useState('Associação de Recicladores / Catadores');

  // Report datasets
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [studentRankings, setStudentRankings] = useState<any[]>([]);

  // Category totals
  const [categoryTotals, setCategoryTotals] = useState({
    tetraPak: 0,
    plastic: 0,
    aluminum: 0,
    oilLiters: 0,
    petUnits: 0
  });

  // Summary stats
  const [summary, setSummary] = useState({
    totalContainers: 0,
    totalOil: 0,
    totalDistributed: 0,
    totalReceived: 0,
    currentBalance: 0
  });

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

        // 5. Calculate summary metrics & category totals
        let totalContainers = 0;
        let totalOil = 0;
        let tetraPakSum = 0;
        let plasticSum = 0;
        let aluminumSum = 0;
        let petSum = 0;

        deliveriesList.forEach((curr) => {
          totalContainers += curr.containers || 0;
          totalOil += Number(curr.oil_liters) || 0;
          tetraPakSum += curr.tetra_pak_units || 0;
          plasticSum += curr.plastic_units || 0;
          aluminumSum += curr.aluminum_units || 0;
          petSum += curr.pet_units || 0;
        });

        // Se pet_units/plastic_units não estiverem separados em registros antigos, atribui a plástico a diferença
        const totalCategorized = tetraPakSum + plasticSum + aluminumSum + petSum;
        if (totalContainers > totalCategorized && totalCategorized === 0) {
          plasticSum = totalContainers;
        }

        const totalDistributed = deliveriesList.reduce((acc, curr) => acc + (curr.ecotrocas_earned || 0), 0);
        const totalReceived = schoolData?.total_received || 0;
        const currentBalance = schoolData?.current_balance || 0;

        setCategoryTotals({
          tetraPak: tetraPakSum,
          plastic: plasticSum + petSum,
          aluminum: aluminumSum,
          oilLiters: totalOil,
          petUnits: petSum
        });

        setSummary({
          totalContainers,
          totalOil,
          totalDistributed,
          totalReceived,
          currentBalance
        });

        // 6. Build rankings for students in this school
        const studentMap: any = {};
        deliveriesList.forEach((d) => {
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

        const sortedRankings = Object.values(studentMap)
          .sort((a: any, b: any) => b.totalEcotrocas - a.totalEcotrocas);

        setStudentRankings(sortedRankings);
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

  // Filtered lists
  const filteredDeliveries = deliveries.filter(d =>
    d.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.students?.enrollment && d.students.enrollment.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.received_by && d.received_by.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAllocations = allocations.filter(a =>
    (a.received_by && a.received_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.notes && a.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredRankings = studentRankings.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.enrollment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintAssociationReport = () => {
    window.print();
  };

  // CSV Export handler
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
        ...filteredRankings.map((item, idx) =>
          `"${idx + 1}","${item.name}","${item.enrollment}","${item.totalEcotrocas}","${item.totalContainers}","${item.totalOil.toFixed(1)}","${item.deliveryCount}"`
        )
      ];
    } else if (activeTab === 'association_coleta') {
      headers = ['Categoria de Reciclável', 'Quantidade Registrada', 'Unidade de Medida'];
      csvRows = [
        headers.join(','),
        `"Embalagens Tetra Pak (Leite, Suco, etc.)","${categoryTotals.tetraPak}","unidades"`,
        `"Embalagens Plásticas (Garrafas PET, Embalagens Rígidas)","${categoryTotals.plastic}","unidades"`,
        `"Alumínio (Latinhas de Bebidas)","${categoryTotals.aluminum}","unidades"`,
        `"Óleo de Cozinha Usado","${categoryTotals.oilLiters.toFixed(1)}","Litros"`,
        `"TOTAL GERAL DE EMBALAGENS RECOLHIDAS","${summary.totalContainers}","unidades"`
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

  return (
    <div className="space-y-8">
      {/* Printable Report Section for Association - Hidden on screen, visible on print */}
      <div className="hidden print:block p-8 bg-white text-black font-sans leading-relaxed">
        <div className="border-b-2 border-emerald-700 pb-4 mb-6 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-emerald-900">PROJETO ECOTROCA - COMPROVANTE DE COLETA DE RECICLÁVEIS</h1>
          <p className="text-sm font-semibold text-gray-700 mt-1">Relatório Oficial para Entrega de Materiais às Associações de Reciclagem</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-gray-50 p-4 rounded border border-gray-300">
          <div>
            <p><strong>Escola Municipal:</strong> {school?.name || 'N/A'}</p>
            <p><strong>Direção / Responsável:</strong> {school?.responsible || 'N/A'}</p>
            <p><strong>Endereço:</strong> {school?.address || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p><strong>Associação Destino:</strong> {associationName}</p>
            <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total Ecotrocas Lançados:</strong> {summary.totalDistributed} ET</p>
          </div>
        </div>

        <h3 className="text-base font-bold mb-3 uppercase text-gray-800 border-b pb-1">Quantitativo por Categoria de Material</h3>
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
              <td className="p-3 font-semibold border-r border-gray-300">Embalagens Tetra Pak (Leite, Suco, etc.)</td>
              <td className="p-3 font-bold text-center border-r border-gray-300">{categoryTotals.tetraPak}</td>
              <td className="p-3 text-center">Unidades</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold border-r border-gray-300">Embalagens Plásticas (Garrafas PET, Embalagens Rígidas)</td>
              <td className="p-3 font-bold text-center border-r border-gray-300">{categoryTotals.plastic}</td>
              <td className="p-3 text-center">Unidades</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold border-r border-gray-300">Alumínio (Latinhas de Bebidas)</td>
              <td className="p-3 font-bold text-center border-r border-gray-300">{categoryTotals.aluminum}</td>
              <td className="p-3 text-center">Unidades</td>
            </tr>
            <tr className="bg-emerald-50/50">
              <td className="p-3 font-semibold border-r border-gray-300">Óleo de Cozinha Usado</td>
              <td className="p-3 font-bold text-center border-r border-gray-300 text-blue-900">{categoryTotals.oilLiters.toFixed(1)}</td>
              <td className="p-3 text-center font-bold">Litros</td>
            </tr>
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
              <td className="p-3 border-r border-gray-400">TOTAL GERAL DE EMBALAGENS RECOLHIDAS</td>
              <td className="p-3 text-center border-r border-gray-400 text-emerald-900 text-base">{summary.totalContainers}</td>
              <td className="p-3 text-center">Unidades Total</td>
            </tr>
          </tbody>
        </table>

        <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <div className="border-t border-black pt-2 font-bold">{school?.responsible || 'Responsável da Escola'}</div>
            <p className="text-gray-600">Assinatura da Direção / Coordenação da Escola</p>
          </div>
          <div>
            <div className="border-t border-black pt-2 font-bold">Representante da Associação de Reciclagem</div>
            <p className="text-gray-600">Assinatura e Carimbo da Associação / Coletor</p>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          {activeTab === 'association_coleta' && (
            <Button roleColor="escola" variant="outline" onClick={handlePrintAssociationReport}>
              <Printer className="h-5 w-5 mr-2" />
              Imprimir Relatório Coleta
            </Button>
          )}
          <Button roleColor="escola" onClick={handleExportCSV}>
            <Download className="h-5 w-5 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de Resumo da Escola */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Recicláveis Coletados"
          value={`${summary.totalContainers} un`}
          icon={Recycle}
          roleColor="escola"
          subtitle={`+ ${summary.totalOil.toFixed(1)}L de óleo`}
        />
        <StatCard
          label="Ecotrocas Distribuídas"
          value={`${summary.totalDistributed} ET`}
          icon={Coins}
          roleColor="escola"
          subtitle="Entregues aos alunos"
        />
        <StatCard
          label="Recebido da Prefeitura"
          value={`${summary.totalReceived} ET`}
          icon={PackageCheck}
          roleColor="escola"
          subtitle="Total de verdinhos em histórico"
        />
        <StatCard
          label="Estoque Atual de Verdinhos"
          value={`${summary.currentBalance} ET`}
          icon={Coins}
          roleColor="escola"
          subtitle={summary.currentBalance < 50 ? '⚠️ Estoque baixo na escola' : 'Disponível para distribuição'}
        />
      </div>

      {/* Detalhamento por Categoria de Materiais */}
      <div className="print:hidden grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">🧃 Tetra Pak</span>
          <p className="text-2xl font-black mt-1">{categoryTotals.tetraPak} <span className="text-sm font-normal text-emerald-700">un</span></p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">🧴 Plásticos / PET</span>
          <p className="text-2xl font-black mt-1">{categoryTotals.plastic} <span className="text-sm font-normal text-blue-700">un</span></p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">🥫 Alumínio / Lata</span>
          <p className="text-2xl font-black mt-1">{categoryTotals.aluminum} <span className="text-sm font-normal text-amber-700">un</span></p>
        </div>
        <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-4 text-amber-900">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">🛢️ Óleo de Cozinha</span>
          <p className="text-2xl font-black mt-1">{categoryTotals.oilLiters.toFixed(1)} <span className="text-sm font-normal text-amber-800">Litros</span></p>
        </div>
      </div>

      {/* Abas e Filtros */}
      <Card className="print:hidden">
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
                Entregas de Alunos ({deliveries.length})
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
                Verdinhos da Prefeitura ({allocations.length})
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
                Ranking de Alunos ({studentRankings.length})
              </button>
            </div>

            {/* Input de Busca */}
            <div className="w-full md:w-72">
              <Input
                placeholder="Buscar por aluno, matrícula ou nota..."
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
                    Emita o termo com os quantitativos discriminados por categoria para pegar assinatura dos coletores.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Nome da Associação (Ex: Recicla Cidade)"
                    value={associationName}
                    onChange={(e) => setAssociationName(e.target.value)}
                    className="bg-white text-xs w-64"
                  />
                  <Button roleColor="escola" onClick={handlePrintAssociationReport}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir / PDF
                  </Button>
                </div>
              </div>

              <div className="border rounded-xl p-6 bg-gray-50/50 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{school?.name || 'Escola Municipal'}</h4>
                    <p className="text-xs text-gray-500">Resumo de materiais armazenados na escola para recolhimento</p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 bg-white rounded-lg border text-center">
                    <span className="text-xs font-medium text-gray-500">Tetra Pak</span>
                    <p className="text-xl font-bold text-gray-900 mt-1">{categoryTotals.tetraPak} un</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border text-center">
                    <span className="text-xs font-medium text-gray-500">Plásticos / PET</span>
                    <p className="text-xl font-bold text-gray-900 mt-1">{categoryTotals.plastic} un</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border text-center">
                    <span className="text-xs font-medium text-gray-500">Alumínio (Latinhas)</span>
                    <p className="text-xl font-bold text-gray-900 mt-1">{categoryTotals.aluminum} un</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border text-center">
                    <span className="text-xs font-medium text-gray-500">Óleo de Cozinha</span>
                    <p className="text-xl font-bold text-blue-700 mt-1">{categoryTotals.oilLiters.toFixed(1)} L</p>
                  </div>
                </div>

                <div className="text-right pt-2">
                  <Button roleColor="escola" variant="outline" onClick={handlePrintAssociationReport}>
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
              <div className="text-center py-8 text-gray-500">Nenhuma entrega registrada.</div>
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
                          {new Date(item.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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

          {/* Conteúdo da Aba 2: Repasses de Cédulas da Prefeitura */}
          {activeTab === 'allocations' && (
            loading ? (
              <div className="text-center py-8 text-gray-400">Carregando históricos da prefeitura...</div>
            ) : filteredAllocations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum repasse de verdinhos registrado pela Prefeitura.</div>
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
                          {new Date(item.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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
              <div className="text-center py-8 text-gray-500">Nenhum aluno com entregas encontradas.</div>
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
                    {filteredRankings.map((item, idx) => (
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
  );
};

export default EscolaReports;

