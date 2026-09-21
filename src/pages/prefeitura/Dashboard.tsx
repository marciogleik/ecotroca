import React, { useEffect, useState } from 'react';
import { StatCard, Card, CardHeader, CardBody, LiveIndicator } from '../../components/ui';
import { BarChart3, Users, Coins, Recycle, Droplets, Download, Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PrefeituraDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalVendors: 0,
    totalIssued: 0,
    totalRedeemed: 0,
    totalContainers: 0,
    totalOil: 0,
    totalCashIn: 0,
    cashBalance: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: vendorCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
      
      const { data: deliveries } = await supabase.from('deliveries').select('ecotrocas_earned, containers, oil_liters');
      const { data: redemptions } = await supabase.from('redemptions').select('quantity');
      const { data: schools } = await supabase.from('schools').select('total_received');
      const { data: cashEntries } = await supabase.from('prefeitura_cash_entries').select('amount');

      const totalIssued = schools?.reduce((acc, curr) => acc + (curr.total_received || 0), 0) || 0;
      const totalCashIn = cashEntries?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
      const cashBalance = totalCashIn - totalIssued;
      const totalContainers = deliveries?.reduce((acc, curr) => acc + (curr.containers || 0), 0) || 0;
      const totalOil = deliveries?.reduce((acc, curr) => acc + (Number(curr.oil_liters) || 0), 0) || 0;
      const totalRedeemed = redemptions?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

      setStats({
        totalStudents: studentCount || 0,
        totalVendors: vendorCount || 0,
        totalIssued,
        totalRedeemed,
        totalContainers,
        totalOil,
        totalCashIn,
        cashBalance
      });
    } catch (error) {
      console.error('Error fetching prefeitura data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('prefeitura-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_allocations' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prefeitura_cash_entries' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const inCirculation = stats.totalIssued - stats.totalRedeemed;
  
  const chartData = [
    { name: 'Em Circulação', value: inCirculation, color: '#2c4a8f' },
    { name: 'Resgatadas', value: stats.totalRedeemed, color: '#185FA5' }
  ];

  if (loading) return <div className="animate-pulse space-y-4">...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 items-start">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Painel de Monitoramento</h1>
            <LiveIndicator />
          </div>
          <p className="text-gray-500 mt-1">Visão consolidada do programa EcoTroca Água Boa.</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-prefeitura text-white font-semibold rounded-lg hover:bg-prefeitura-dark transition-all">
          <Download className="h-5 w-5 mr-2" />
          Exportar Relatório Geral
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Em Caixa (Prefeitura)"
          value={`${stats.cashBalance} ET`}
          icon={Wallet}
          roleColor="prefeitura"
          subtitle={`Retirado: ${stats.totalCashIn} | Repassado: ${stats.totalIssued}`}
        />
        <StatCard
          label="Entregue às Escolas"
          value={`${stats.totalIssued} ET`}
          icon={Coins}
          roleColor="prefeitura"
          subtitle="Total de verdinhos repassados"
        />
        <StatCard
          label="Tokens Resgatados"
          value={`${stats.totalRedeemed} ET`}
          icon={BarChart3}
          roleColor="prefeitura"
          subtitle="Resgatados no comércio"
        />
        <StatCard
          label="Em Circulação"
          value={`${inCirculation} ET`}
          icon={Coins}
          roleColor="prefeitura"
          subtitle={`Escolas (${stats.totalIssued}) − Resgatados (${stats.totalRedeemed})`}
        />
        <StatCard
          label="Participantes"
          value={stats.totalStudents + stats.totalVendors}
          icon={Users}
          roleColor="prefeitura"
          subtitle={`${stats.totalStudents} alunos + ${stats.totalVendors} comércios`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader title="Distribuição de Tokens" subtitle="Tokens emitidos vs resgatados" />
          <CardBody className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Impacto Ambiental Acumulado" />
          <CardBody className="space-y-6">
            <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <Recycle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Resíduos Sólidos Coletados</p>
                <p className="text-2xl font-black text-green-900">{stats.totalContainers} <span className="text-sm font-normal">unidades</span></p>
                <p className="text-xs text-green-700 font-medium">Aprox. {((stats.totalContainers * 20) / 1000).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} kg de material reciclável</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Droplets className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Óleo de Cozinha Coletado</p>
                <p className="text-2xl font-black text-blue-900">{stats.totalOil.toFixed(1)} <span className="text-sm font-normal">litros</span></p>
                <p className="text-xs text-blue-700 font-medium">Preservou {((stats.totalOil * 25000) / 1000000).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} milhões de litros de água</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default PrefeituraDashboard;
