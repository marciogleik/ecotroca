import React, { useEffect, useState } from 'react';
import { StatCard, Card, CardHeader, CardBody, Table, THead, TBody, Th, Td } from '../../components/ui';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { Users, Coins, TrendingUp, History, UserPlus, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, School as SchoolIcon } from 'lucide-react';
import { getCurrentFortnight } from '../../utils/fortnight';

const EscolaDashboard: React.FC = () => {
  const { schoolId } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalEcotrocas: 0,
    activeStudents: 0,
    fortnightEcotrocas: 0,
    fortnightContainers: 0,
  });
  const [school, setSchool] = useState<any>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. Busca os dados da escola primeiro para obter o nome
      let schoolData: any = null;
      let schoolName: string | null = null;

      if (schoolId) {
        const { data } = await supabase
          .from('schools')
          .select('*')
          .eq('id', schoolId)
          .single();
        schoolData = data;
        schoolName = data?.name ?? null;
        setSchool(schoolData);
      }

      // 2. Busca os IDs dos alunos desta escola (para filtrar deliveries)
      const { data: schoolStudents } = await supabase
        .from('students')
        .select('id')
        .eq('school', schoolName ?? '');

      const studentIds = schoolStudents?.map(s => s.id) ?? [];

      // 3. Contagem de alunos apenas desta escola
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school', schoolName ?? '');

      // 4. EcoTrocas geradas apenas pelos alunos desta escola
      const { data: deliveriesData } = studentIds.length > 0
        ? await supabase
          .from('deliveries')
          .select('ecotrocas_earned, student_id')
          .in('student_id', studentIds)
        : { data: [] };

      const totalEcotrocas = deliveriesData?.reduce((acc, curr) => acc + curr.ecotrocas_earned, 0) || 0;
      const activeStudents = new Set(deliveriesData?.map(d => d.student_id)).size;

      // 4b. Embalagens e EcoTrocas geradas nesta quinzena civil (pool coletivo)
      const { startDateIso, endDateIso } = getCurrentFortnight();
      const { data: fortnightData } = studentIds.length > 0
        ? await supabase
          .from('deliveries')
          .select('ecotrocas_earned, containers')
          .in('student_id', studentIds)
          .gte('created_at', startDateIso)
          .lte('created_at', endDateIso)
        : { data: [] };

      const fortnightEcotrocas = fortnightData?.reduce((acc, curr) => acc + curr.ecotrocas_earned, 0) || 0;
      const fortnightContainers = fortnightData?.reduce((acc, curr) => acc + (curr.containers || 0), 0) || 0;

      setStats({
        totalStudents: studentCount || 0,
        totalEcotrocas,
        activeStudents,
        fortnightEcotrocas,
        fortnightContainers,
      });

      // 5. Entregas recentes apenas desta escola
      const { data: recent } = studentIds.length > 0
        ? await supabase
          .from('deliveries')
          .select('*')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(5)
        : { data: [] };

      setRecentDeliveries(recent || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('escola-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId]);

  if (loading) return <div className="animate-pulse space-y-4">...</div>;

  const currentFortnight = getCurrentFortnight();
  const maxFortnightPool = stats.totalStudents * 80; // pool em embalagens (N alunos × 80)
  const poolPct = Math.min(100, maxFortnightPool > 0 ? (stats.fortnightContainers / maxFortnightPool) * 100 : 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, Gestor Escolar</h1>
          <p className="text-gray-500">Acompanhe o engajamento dos seus alunos com a sustentabilidade.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/escola/novo-aluno">
            <button className="inline-flex items-center px-4 py-2 bg-escola text-white font-semibold rounded-lg hover:bg-escola-dark transition-all shadow-sm">
              <UserPlus className="h-5 w-5 mr-2" />
              Novo Aluno
            </button>
          </Link>
          <Link to="/escola/entrega">
            <button className="inline-flex items-center px-4 py-2 border-2 border-escola text-escola font-semibold rounded-lg hover:bg-escola hover:text-white transition-all shadow-sm">
              <PlusCircle className="h-5 w-5 mr-2" />
              Registrar Entrega
            </button>
          </Link>
        </div>
      </div>

      {school && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className={cn(
            "border-2",
            school.current_balance < 0 ? "border-amber-300 bg-amber-50" :
              school.current_balance === 0 ? "border-red-200 bg-red-50" :
                school.current_balance < 50 ? "border-amber-200 bg-amber-50" : "border-escola/20 bg-escola/5"
          )}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  school.current_balance < 0 ? "bg-amber-100 text-amber-700" :
                    school.current_balance === 0 ? "bg-red-100 text-red-600" :
                      school.current_balance < 50 ? "bg-amber-100 text-amber-700" : "bg-escola-light text-escola"
                )}>
                  <SchoolIcon className="h-6 w-6" />
                </div>
                {school.current_balance < 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center bg-amber-600 text-white">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    REPOSIÇÃO PENDENTE
                  </span>
                ) : school.current_balance < 50 && (
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center",
                    school.current_balance === 0 ? "bg-red-600 text-white" : "bg-amber-600 text-white"
                  )}>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {school.current_balance === 0 ? "ESTOQUE ZERADO" : "ESTOQUE BAIXO"}
                  </span>
                )}
              </div>
              {school.current_balance < 0 ? (
                <>
                  <p className="text-sm font-medium text-gray-500">Cédulas Pendentes de Reposição</p>
                  <p className="text-3xl font-black mt-1 text-amber-700">
                    {Math.abs(school.current_balance)} <span className="text-sm font-normal">ET a receber</span>
                  </p>
                  <p className="text-xs mt-2 font-medium text-amber-800">
                    A escola já distribuiu {Math.abs(school.current_balance)} ET além do estoque físico. Solicite reposição à Prefeitura.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-500">Estoque de Verdinhos (Disponíveis)</p>
                  <p className={cn(
                    "text-3xl font-black mt-1",
                    school.current_balance === 0 ? "text-red-700" :
                      school.current_balance < 50 ? "text-amber-700" : "text-escola"
                  )}>
                    {school.current_balance} <span className="text-sm font-normal">ET</span>
                  </p>
                  {school.current_balance < 50 && (
                    <p className="text-xs mt-2 font-medium text-gray-600">
                      {school.current_balance === 0
                        ? "Estoque esgotado. Solicite a entrega de novas cédulas (verdinhos) à Prefeitura."
                        : "Estoque de verdinhos baixo. Solicite novas cédulas à Prefeitura em breve."}
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>

          <StatCard
            label="Total Lançado"
            value={`${school.total_distributed} ET`}
            icon={Coins}
            roleColor="escola"
            subtitle="Lançado aos alunos da escola"
          />

          <StatCard
            label="Total Recebido"
            value={`${school.total_received} ET`}
            icon={TrendingUp}
            roleColor="escola"
            subtitle="Entregue pela Prefeitura"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total de Alunos"
          value={stats.totalStudents}
          icon={Users}
          roleColor="escola"
        />
        <StatCard
          label="Alunos Ativos"
          value={stats.activeStudents}
          icon={TrendingUp}
          roleColor="escola"
        />
        {stats.totalStudents > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500">Volume da Quinzena</p>
              <span className="text-[10px] font-semibold bg-escola/10 text-escola px-2 py-0.5 rounded-full border border-escola/20">
                {currentFortnight.label}
              </span>
            </div>
            <p className="text-2xl font-black text-escola">
              {stats.fortnightContainers}{' '}
              <span className="text-sm font-normal text-gray-400">/ {maxFortnightPool} emb.</span>
            </p>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${poolPct >= 100 ? 'bg-emerald-500' : poolPct >= 80 ? 'bg-amber-500' : 'bg-escola'
                  }`}
                style={{ width: `${poolPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {poolPct >= 100
                ? '★ Cota base da quinzena alcançada! Lançamentos liberados'
                : `Cota base: ${stats.totalStudents} alunos × 80 = ${maxFortnightPool} emb./quinzena`}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Entregas Recentes"
              subtitle="Últimas 5 movimentações de materiais"
              icon={History}
              iconColor="bg-escola-light text-escola"
            />
            <CardBody className="p-0">
              <Table>
                <THead>
                  <Th>Aluno</Th>
                  <Th>Recicláveis</Th>
                  <Th>Óleo (L)</Th>
                  <Th>Ecotrocas</Th>
                  <Th>Data</Th>
                </THead>
                <TBody>
                  {recentDeliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <Td className="font-medium text-gray-900">{delivery.student_name}</Td>
                      <Td>
                        <div className="font-bold text-gray-900 text-sm">{delivery.containers || 0}</div>
                        <div className="text-[11px] font-medium text-gray-500 whitespace-nowrap mt-0.5">
                          PET: {delivery.pet_units ?? 0} | Lata: {delivery.aluminum_units ?? 0} | Plástico: {(delivery.plastic_units || (!delivery.pet_units && !delivery.aluminum_units ? delivery.containers : 0))}
                          {delivery.tetra_pak_units ? ` | TetraPak: ${delivery.tetra_pak_units}` : ''}
                        </div>
                      </Td>
                      <Td>{delivery.oil_liters} L</Td>
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-bold text-escola">+ {delivery.ecotrocas_earned} ET</span>
                          <span className="text-[10px] text-gray-500">(R$ {delivery.ecotrocas_earned.toFixed(2)})</span>
                        </div>
                      </Td>
                      <Td>{format(new Date(delivery.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</Td>
                    </tr>
                  ))}
                  {recentDeliveries.length === 0 && (
                    <tr>
                      <Td colSpan={5} className="text-center py-8 text-gray-500">Nenhuma entrega registrada ainda.</Td>
                    </tr>
                  )}
                </TBody>
              </Table>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader title="Ações Rápidas" />
            <CardBody className="space-y-4">
              <p className="text-sm text-gray-500">
                Lembre-se que cada 10 recipientes equivalem a 1 Ecotroca e cada 2L de óleo equivalem a 1 Ecotroca.
              </p>
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Recicláveis:</span>
                  <span className="text-escola font-bold">10 unid = 1 ET</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Óleo de Cozinha:</span>
                  <span className="text-escola font-bold">2 L = 1 ET</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">
                * Cota coletiva da escola ({currentFortnight.label}): {stats.totalStudents} alunos × 80 = <strong>{stats.totalStudents * 80}</strong> embalagens / {stats.totalStudents} alunos × 4L = <strong>{stats.totalStudents * 4}L</strong> de óleo. Alunos que trazem mais utilizam a cota dos que não participaram. Lançamentos são contínuos e nunca bloqueados.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EscolaDashboard;
