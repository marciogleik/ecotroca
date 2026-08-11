import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, THead, TBody, Th, Td, Button, Input, LiveIndicator, CardHeader } from '../../components/ui';
import { Download, Search, History, BarChart3, Trophy, School as SchoolIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'rankings' | 'analytics' | 'categories'>('audit');
  const [auditData, setAuditData] = useState<any[]>([]);
  const [rankings, setRankings] = useState<{ schools: any[], students: any[] }>({ schools: [], students: [] });
  const [analytics, setAnalytics] = useState<any>(null);
  const [categoryTotals, setCategoryTotals] = useState({
    tetraPak: 0,
    plastic: 0,
    aluminum: 0,
    oilLiters: 0,
    totalContainers: 0,
    totalEcotrocas: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('prefeitura-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_allocations' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Calculate municipal category totals from deliveries
      const { data: allDeliveries } = await supabase.from('deliveries').select('containers, tetra_pak_units, plastic_units, pet_units, aluminum_units, oil_liters, ecotrocas_earned');
      if (allDeliveries) {
        let tetra = 0;
        let plastic = 0;
        let aluminum = 0;
        let oil = 0;
        let containers = 0;
        let ecotrocas = 0;

        allDeliveries.forEach(d => {
          containers += d.containers || 0;
          ecotrocas += d.ecotrocas_earned || 0;
          tetra += d.tetra_pak_units || 0;
          plastic += (d.plastic_units || 0) + (d.pet_units || 0);
          aluminum += d.aluminum_units || 0;
          oil += Number(d.oil_liters) || 0;
        });

        // Se antigos não possuem separação por coluna, atribui plásticos como fallback
        const sumCat = tetra + plastic + aluminum;
        if (containers > sumCat && sumCat === 0) {
          plastic = containers;
        }

        setCategoryTotals({
          tetraPak: tetra,
          plastic,
          aluminum,
          oilLiters: oil,
          totalContainers: containers,
          totalEcotrocas: ecotrocas
        });
      }

      if (activeTab === 'audit') {
        const [deliveriesRes, redemptionsRes, allocationsRes] = await Promise.all([
          supabase.from('deliveries').select('*, students(school)'),
          supabase.from('redemptions').select('*'),
          supabase.from('school_allocations').select('*, schools(name)')
        ]);

        let deliveries = deliveriesRes.data || [];
        let redemptions = redemptionsRes.data || [];
        let allocations = allocationsRes.data || [];

        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          deliveries = deliveries.filter(d =>
            d.student_name.toLowerCase().includes(lowerTerm) ||
            (d.students?.school && d.students.school.toLowerCase().includes(lowerTerm))
          );
          redemptions = redemptions.filter(r =>
            r.vendor_name.toLowerCase().includes(lowerTerm)
          );
          allocations = allocations.filter(a =>
            (a.schools?.name && a.schools.name.toLowerCase().includes(lowerTerm)) ||
            (a.received_by && a.received_by.toLowerCase().includes(lowerTerm))
          );
        }

        const combined = [
          ...allocations.map(a => ({
            id: `alloc-${a.id}`,
            date: a.created_at,
            type: a.amount > 0 ? 'Emissão (Prefeitura -> Escola)' : 'Ajuste/Estorno Prefeitura',
            responsible: a.delivered_by || 'Prefeitura',
            beneficiary: `${a.schools?.name || 'Escola'}${a.received_by ? ` (Retirado por: ${a.received_by})` : ''}`,
            amount: `${a.amount > 0 ? '+' : ''} ${a.amount} ET (R$ ${Math.abs(a.amount).toFixed(2)})`,
            color: 'text-prefeitura',
            bgColor: 'bg-prefeitura-light text-prefeitura'
          })),
          ...deliveries.map(d => ({
            id: `del-${d.id}`,
            date: d.created_at,
            type: 'Entrada (Reciclagem)',
            responsible: d.students?.school || 'Escola (N/I)',
            beneficiary: d.student_name,
            amount: `+ ${d.ecotrocas_earned} ET (R$ ${d.ecotrocas_earned.toFixed(2)})`,
            color: 'text-escola',
            bgColor: 'bg-escola-light text-escola'
          })),
          ...redemptions.map(r => ({
            id: `red-${r.id}`,
            date: r.created_at,
            type: 'Saída (Resgate)',
            responsible: 'Sicredi',
            beneficiary: r.vendor_name,
            amount: `- ${r.quantity} ET (R$ ${r.quantity.toFixed(2)})`,
            color: 'text-sicredi',
            bgColor: 'bg-sicredi-light text-sicredi'
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setAuditData(combined);
      } else if (activeTab === 'rankings') {
        const { data: deliveries } = await supabase.from('deliveries').select('student_name, ecotrocas_earned, students(school)');
        
        const schoolMap: any = {};
        const studentMap: any = {};

        deliveries?.forEach((d: any) => {
          const schoolName = d.students?.school || 'Outros';
          schoolMap[schoolName] = (schoolMap[schoolName] || 0) + d.ecotrocas_earned;
          
          const studentKey = `${d.student_name}-${schoolName}`;
          if (!studentMap[studentKey]) {
            studentMap[studentKey] = { name: d.student_name, school: schoolName, total: 0 };
          }
          studentMap[studentKey].total += d.ecotrocas_earned;
        });

        const schools = Object.entries(schoolMap)
          .map(([name, total]) => ({ name, total }))
          .sort((a: any, b: any) => b.total - a.total);

        const students = Object.values(studentMap)
          .sort((a: any, b: any) => b.total - a.total)
          .slice(0, 10);

        setRankings({ schools, students });
      } else if (activeTab === 'analytics') {
        const [allocationsRes, deliveriesRes, redemptionsRes, schoolsRes] = await Promise.all([
          supabase.from('school_allocations').select('amount, created_at'),
          supabase.from('deliveries').select('ecotrocas_earned, created_at'),
          supabase.from('redemptions').select('quantity, created_at'),
          supabase.from('schools').select('name, total_received')
        ]);

        const totalAllocated = allocationsRes.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
        const totalEarned = deliveriesRes.data?.reduce((acc, curr) => acc + curr.ecotrocas_earned, 0) || 0;
        const totalRedeemed = redemptionsRes.data?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

        setAnalytics({
          summary: [
            { name: 'Prefeitura (Emitido)', value: totalAllocated, color: '#2c4a8f' },
            { name: 'Escolas (Distribuído)', value: totalEarned, color: '#10b981' },
            { name: 'Sicredi (Resgatado)', value: totalRedeemed, color: '#185FA5' }
          ],
          schools: schoolsRes.data || []
        });
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (activeTab !== 'audit' || auditData.length === 0) return;

    const headers = ['Data/Hora', 'Tipo', 'Responsável', 'Beneficiário', 'Valor'];
    const csvRows = [
      headers.join(','),
      ...auditData.map(item =>
        `"${new Date(item.date).toLocaleString('pt-BR')}","${item.type}","${item.responsible}","${item.beneficiary}","${item.amount}"`
      )
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ecotroca_auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 items-start">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Relatórios Operacionais da Prefeitura</h1>
            <LiveIndicator />
          </div>
          <p className="text-gray-500 mt-1">Auditoria municipal, balanço por categoria e indicadores de desempenho.</p>
        </div>
        {activeTab === 'audit' && (
          <Button 
            onClick={handleExportCSV} 
            roleColor="prefeitura" 
            disabled={auditData.length === 0}
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar Auditoria CSV
          </Button>
        )}
      </div>

      {/* Cards Globais de Categorias Recicláveis da Prefeitura */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">🧃 Total Tetra Pak</span>
          <p className="text-2xl font-black mt-1">{categoryTotals.tetraPak} <span className="text-xs font-normal text-emerald-700">unidades</span></p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">🧴 Total Plásticos / PET</span>
          <p className="text-2xl font-black mt-1">{categoryTotals.plastic} <span className="text-xs font-normal text-blue-700">unidades</span></p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">🥫 Total Alumínio</span>
          <p className="text-2xl font-black mt-1">{categoryTotals.aluminum} <span className="text-xs font-normal text-amber-700">unidades</span></p>
        </div>
        <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-4 text-amber-900">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">🛢️ Total Óleo de Cozinha</span>
          <p className="text-2xl font-black mt-1">{categoryTotals.oilLiters.toFixed(1)} <span className="text-xs font-normal text-amber-800">Litros</span></p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit overflow-x-auto">
        {[
          { id: 'audit', label: 'Auditoria de Fluxo', icon: History },
          { id: 'categories', label: 'Embalagens por Categoria', icon: BarChart3 },
          { id: 'rankings', label: 'Rankings', icon: Trophy },
          { id: 'analytics', label: 'Análise Gráfica', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }}
            className={`flex items-center whitespace-nowrap px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === tab.id ? 'bg-white text-prefeitura shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'categories' ? (
        <Card>
          <CardHeader title="Balanço Geral de Embalagens Recicláveis por Categoria" subtitle="Totais consolidados recolhidos em todas as escolas da rede municipal" />
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-sm font-bold text-emerald-800 uppercase tracking-wider">🧃 Tetra Pak</span>
                <p className="text-3xl font-black text-emerald-950 mt-2">{categoryTotals.tetraPak} un</p>
                <p className="text-xs text-emerald-700 mt-1">Embalagens cartonadas de leite e sucos</p>
              </div>
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-sm font-bold text-blue-800 uppercase tracking-wider">🧴 Plásticos / PET</span>
                <p className="text-3xl font-black text-blue-950 mt-2">{categoryTotals.plastic} un</p>
                <p className="text-xs text-blue-700 mt-1">Garrafas PET e recipientes plásticos</p>
              </div>
              <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-sm font-bold text-amber-800 uppercase tracking-wider">🥫 Alumínio</span>
                <p className="text-3xl font-black text-amber-950 mt-2">{categoryTotals.aluminum} un</p>
                <p className="text-xs text-amber-700 mt-1">Latinhas de bebidas e refrigerantes</p>
              </div>
              <div className="p-6 bg-amber-500/10 rounded-xl border border-amber-300">
                <span className="text-sm font-bold text-amber-900 uppercase tracking-wider">🛢️ Óleo de Cozinha</span>
                <p className="text-3xl font-black text-amber-950 mt-2">{categoryTotals.oilLiters.toFixed(1)} L</p>
                <p className="text-xs text-amber-800 mt-1">Litros de óleo vegetal descartado</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Total Geral de Embalagens</span>
                <p className="text-2xl font-black text-gray-900">{categoryTotals.totalContainers} unidades recolhidas</p>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Total de Ecotrocas Lançados aos Alunos</span>
                <p className="text-2xl font-black text-prefeitura">{categoryTotals.totalEcotrocas} ET (R$ {categoryTotals.totalEcotrocas.toFixed(2)})</p>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : activeTab === 'analytics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Fluxo de EcoTrocas (Total)" subtitle="Prefeitura -> Escolas -> Alunos -> Sicredi" />
            <CardBody className="h-[400px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.summary}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {analytics?.summary.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Repasse da Prefeitura por Escola" subtitle="Total enviado pela prefeitura para cada instituição" />
            <CardBody className="h-[400px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.schools}
                      dataKey="total_received"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {analytics?.schools.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        </div>
      ) : activeTab === 'rankings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Ranking de Escolas" subtitle="Escolas que mais geraram reciclagens" icon={SchoolIcon} />
            <CardBody>
              <Table>
                <THead>
                  <Th>Posição</Th>
                  <Th>Escola</Th>
                  <Th className="text-right">Total Gerado</Th>
                </THead>
                <TBody>
                  {loading ? (
                    <tr><Td colSpan={3} className="text-center py-8">Carregando...</Td></tr>
                  ) : rankings.schools.map((school, index) => (
                    <tr key={school.name}>
                      <Td className="font-bold text-gray-400">#{index + 1}</Td>
                      <Td className="font-semibold text-gray-900">{school.name}</Td>
                      <Td className="text-right font-bold text-prefeitura">{school.total} ET</Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Top 10 Alunos" subtitle="Os maiores recicladores do programa" icon={Trophy} />
            <CardBody>
              <Table>
                <THead>
                  <Th>Posição</Th>
                  <Th>Aluno</Th>
                  <Th>Escola</Th>
                  <Th className="text-right">Total</Th>
                </THead>
                <TBody>
                  {loading ? (
                    <tr><Td colSpan={4} className="text-center py-8">Carregando...</Td></tr>
                  ) : rankings.students.map((student, index) => (
                    <tr key={`${student.name}-${student.school}`}>
                      <Td className="font-bold text-yellow-600">#{index + 1}</Td>
                      <Td className="font-semibold text-gray-900">{student.name}</Td>
                      <Td className="text-xs text-gray-500">{student.school}</Td>
                      <Td className="text-right font-bold text-prefeitura">{student.total} ET</Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card>
          <CardBody>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Buscar operação por aluno, escola ou loja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  roleColor="prefeitura"
                />
              </div>
              <Button onClick={fetchData} roleColor="prefeitura" variant="secondary">
                <Search className="h-5 w-5 mr-2" />
                Filtrar
              </Button>
            </div>

            <Table>
              <THead>
                <Th>Data e Hora</Th>
                <Th>Tipo de Operação</Th>
                <Th>Responsável (Quem registrou)</Th>
                <Th>Beneficiário (Aluno/Loja)</Th>
                <Th>Movimentação</Th>
              </THead>
              <TBody>
                {loading ? (
                  <tr><Td colSpan={5} className="text-center py-8">Carregando...</Td></tr>
                ) : auditData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <Td>
                      <div className="text-sm font-medium text-gray-900">{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-gray-500">{new Date(item.date).toLocaleTimeString('pt-BR')}</div>
                    </Td>
                    <Td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.bgColor}`}>
                        {item.type}
                      </span>
                    </Td>
                    <Td className="font-semibold text-gray-900">{item.responsible}</Td>
                    <Td>{item.beneficiary}</Td>
                    <Td className={`font-bold ${item.color}`}>{item.amount}</Td>
                  </tr>
                ))}
                {!loading && auditData.length === 0 && (
                  <tr>
                    <Td colSpan={5} className="text-center py-12 text-gray-500">Nenhum registro encontrado.</Td>
                  </tr>
                )}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default Reports;
