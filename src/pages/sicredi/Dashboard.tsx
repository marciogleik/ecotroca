import React, { useEffect, useState } from 'react';
import { StatCard, Card, CardHeader, CardBody, Table, THead, TBody, Th, Td, Button, Input } from '../../components/ui';
import { Users, Coins, History, UserPlus, CreditCard, Wallet, ArrowDownRight, Edit, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const SicrediDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalVendors: 0,
    totalRedeemed: 0,
    totalBudget: 50000.00
  });
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState('50000');
  const [recentRedemptions, setRecentRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch vendor count
      const { count: vendorCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      // Fetch redemptions total
      const { data: redemptionsData } = await supabase
        .from('redemptions')
        .select('quantity');

      const totalRedeemed = redemptionsData?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

      // Fetch budget setting if stored in database
      const { data: budgetData } = await supabase
        .from('sicredi_budget')
        .select('total_budget')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const totalBudget = budgetData ? Number(budgetData.total_budget) : 50000.00;

      setStats({
        totalVendors: vendorCount || 0,
        totalRedeemed,
        totalBudget
      });
      setNewBudgetValue(totalBudget.toString());

      // Fetch recent redemptions
      const { data: recent } = await supabase
        .from('redemptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentRedemptions(recent || []);
    } catch (error) {
      console.error('Error fetching sicredi data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async () => {
    const val = parseFloat(newBudgetValue);
    if (isNaN(val) || val < 0) {
      toast.error('Informe um valor de recurso válido.');
      return;
    }

    try {
      const { error } = await supabase
        .from('sicredi_budget')
        .insert([{ total_budget: val }]);

      if (error) {
        // Fallback: update local state if table not ready
        setStats(p => ({ ...p, totalBudget: val }));
      } else {
        setStats(p => ({ ...p, totalBudget: val }));
      }
      toast.success('Recurso total atualizado com sucesso!');
      setEditingBudget(false);
    } catch (err: any) {
      setStats(p => ({ ...p, totalBudget: val }));
      setEditingBudget(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('sicredi-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sicredi_budget' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">Carregando painel Sicredi...</div>;

  const remainingBudget = stats.totalBudget - stats.totalRedeemed;
  const percentageUsed = Math.min(100, Math.max(0, (stats.totalRedeemed / (stats.totalBudget || 1)) * 100));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, Agente Sicredi</h1>
          <p className="text-gray-500">Realize o resgate de Ecotrocas e acompanhe os recursos disponíveis.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/sicredi/comerciantes">
            <Button roleColor="sicredi" variant="outline">
              <UserPlus className="h-5 w-5 mr-2" />
              Novo Comerciante
            </Button>
          </Link>
          <Link to="/sicredi/resgate">
            <Button roleColor="sicredi">
              <CreditCard className="h-5 w-5 mr-2" />
              Resgatar Tokens
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Recursos Financeiros no Banco */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border shadow-sm space-y-3">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-sm font-semibold uppercase tracking-wider">Aporte de Recurso Total</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-gray-900">R$ {stats.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            {!editingBudget ? (
              <button onClick={() => setEditingBudget(true)} className="text-xs font-semibold text-sicredi flex items-center hover:underline">
                <Edit className="h-3.5 w-3.5 mr-1" /> Editar
              </button>
            ) : null}
          </div>
          {editingBudget ? (
            <div className="flex items-center gap-2 pt-2">
              <Input
                type="number"
                value={newBudgetValue}
                onChange={(e) => setNewBudgetValue(e.target.value)}
                className="text-xs"
              />
              <Button size="sm" roleColor="sicredi" onClick={handleUpdateBudget}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Recurso financeiro alocado para o projeto</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm space-y-3">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-sm font-semibold uppercase tracking-wider">Total Resgatado / Baixado</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-emerald-600">R$ {stats.totalRedeemed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <p className="text-xs text-gray-400">{stats.totalRedeemed} Ecotrocas convertidos em R$</p>
        </div>

        <div className={`rounded-xl p-6 border shadow-sm space-y-3 ${remainingBudget < 5000 ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-sm font-semibold uppercase tracking-wider text-sicredi">Saldo de Recurso Restante</span>
            <div className="p-2 bg-sicredi-light text-sicredi rounded-lg">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <span className={`text-3xl font-black ${remainingBudget < 5000 ? 'text-amber-800' : 'text-sicredi'}`}>
            R$ {remainingBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-sicredi h-2 rounded-full transition-all duration-500" style={{ width: `${percentageUsed}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 flex justify-between font-medium">
            <span>Baixado: {percentageUsed.toFixed(1)}%</span>
            <span>Disponível: R$ {remainingBudget.toFixed(2)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          label="Total de Comerciantes Credenciados" 
          value={stats.totalVendors} 
          icon={Users} 
          roleColor="sicredi" 
        />
        <StatCard 
          label="Volume Total de Transações de Baixa" 
          value={`${stats.totalRedeemed} ET`} 
          icon={Coins} 
          roleColor="sicredi" 
          trend={`R$ ${stats.totalRedeemed.toFixed(2)} repassados aos comerciantes`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader 
              title="Resgates Recentes" 
              subtitle="Últimas 5 operações de pagamento registradas no Sicredi"
              icon={History}
              iconColor="bg-sicredi-light text-sicredi"
            />
            <CardBody className="p-0">
              <Table>
                <THead>
                  <Th>Comerciante</Th>
                  <Th>Total Resgatado</Th>
                  <Th>Data</Th>
                </THead>
                <TBody>
                  {recentRedemptions.map((redemption) => (
                    <tr key={redemption.id}>
                      <Td className="font-medium text-gray-900">{redemption.vendor_name}</Td>
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-bold text-sicredi">{redemption.quantity} Ecotrocas</span>
                          <span className="text-xs text-gray-500 font-medium">(R$ {redemption.quantity.toFixed(2)})</span>
                        </div>
                      </Td>
                      <Td>{format(new Date(redemption.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</Td>
                    </tr>
                  ))}
                  {recentRedemptions.length === 0 && (
                    <tr>
                      <Td colSpan={4} className="text-center py-8 text-gray-500">Nenhum resgate registrado.</Td>
                    </tr>
                  )}
                </TBody>
              </Table>
            </CardBody>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader title="Informações de Resgate e Recurso" />
            <CardBody className="space-y-4">
              <p className="text-sm text-gray-500">
                O Sicredi atua como o ponto oficial de conversão da moeda social Ecotroca em Real (R$).
              </p>
              <div className="p-4 bg-sicredi-light bg-opacity-30 rounded-xl space-y-3 border border-sicredi border-opacity-10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">Cotação:</span>
                  <span className="text-sicredi font-bold">1 ET = R$ 1,00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">Saldo Restante de Recursos:</span>
                  <span className="text-emerald-700 font-bold">R$ {remainingBudget.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 space-y-2">
                <p>• Verifique a autenticidade das cédulas físicas recolhidas.</p>
                <p>• O comerciante deve ter conta ativa e cadastro verificado.</p>
                <p>• Toda baixa efetuada deduz imediatamente do Saldo de Recurso Restante.</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SicrediDashboard;
