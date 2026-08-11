import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, THead, TBody, Th, Td, Button, Input, LiveIndicator } from '../../components/ui';
import { Download, Search, ChevronDown, ChevronUp, Recycle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StudentsList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Student deliveries expansion state
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [studentDeliveries, setStudentDeliveries] = useState<any[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  const fetchSchools = async () => {
    const { data: result } = await supabase.from('schools').select('id, name').order('name');
    setSchools(result || []);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('students').select('*');

      if (selectedSchool) {
        query = query.eq('school', selectedSchool);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,enrollment.ilike.%${searchTerm}%`);
      }

      const { data: result, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchData();
    const channel = supabase
      .channel('prefeitura-students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSchool]);

  const handleExpandStudentDeliveries = async (studentId: string) => {
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null);
      setStudentDeliveries([]);
      return;
    }
    setExpandedStudentId(studentId);
    setDeliveriesLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudentDeliveries(result || []);
    } catch (err) {
      console.error('Error fetching student deliveries:', err);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ['Nome', 'Matricula', 'Escola', 'Ecotrocas'];
    const csvRows = [
      headers.join(','),
      ...data.map(item => `"${item.name}","${item.enrollment}","${item.school}",${item.ecotrocas}`)
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ecotroca_alunos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 items-start">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Alunos Participantes</h1>
            <LiveIndicator />
          </div>
          <p className="text-gray-500 mt-1">Consulte saldos e dados detalhados de todos os alunos da rede municipal.</p>
        </div>
        <Button onClick={handleExportCSV} roleColor="prefeitura" disabled={data.length === 0}>
          <Download className="h-5 w-5 mr-2" />
          Exportar Lista
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar aluno por nome ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                roleColor="prefeitura"
              />
            </div>
            <div className="w-full md:w-64">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-prefeitura focus:border-prefeitura bg-white h-[42px]"
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
              >
                <option value="">Todas as Escolas</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={fetchData} roleColor="prefeitura" variant="secondary">
              <Search className="h-5 w-5 mr-2" />
              Buscar
            </Button>
          </div>

          <Table>
            <THead>
              <Th>Nome</Th>
              <Th>Matrícula</Th>
              <Th>Escola</Th>
              <Th>Saldo Atual</Th>
              <Th className="text-right">Entregas</Th>
            </THead>
            <TBody>
              {loading ? (
                <tr><Td colSpan={5} className="text-center py-8">Carregando...</Td></tr>
              ) : data.length === 0 ? (
                <tr><Td colSpan={5} className="text-center py-12 text-gray-500">Nenhum aluno encontrado.</Td></tr>
              ) : data.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <Td className="font-semibold text-gray-900">{item.name}</Td>
                    <Td>{item.enrollment}</Td>
                    <Td>{item.school}</Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-bold text-prefeitura">{(item.ecotrocas || 0)} ET</span>
                        <span className="text-xs text-gray-500 font-medium">(R$ {(item.ecotrocas || 0).toFixed(2)})</span>
                      </div>
                    </Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        roleColor="prefeitura"
                        onClick={() => handleExpandStudentDeliveries(item.id)}
                      >
                        {expandedStudentId === item.id ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                        {expandedStudentId === item.id ? 'Fechar' : 'Ver Lançamentos'}
                      </Button>
                    </Td>
                  </tr>

                  {/* Linha expandida com entregas do aluno */}
                  {expandedStudentId === item.id && (
                    <tr>
                      <Td colSpan={5} className="bg-slate-50 p-4">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Recycle className="h-4 w-4 text-prefeitura" />
                            Histórico de Lançamentos de Reciclagem — {item.name} ({item.school})
                          </h4>

                          {deliveriesLoading ? (
                            <div className="text-center py-4 text-xs text-gray-400">Carregando entregas...</div>
                          ) : studentDeliveries.length === 0 ? (
                            <div className="text-center py-4 text-xs text-gray-500">Nenhuma entrega de material registrada para este aluno.</div>
                          ) : (
                            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 font-semibold uppercase">
                                    <th className="py-2.5 px-4">Data / Hora</th>
                                    <th className="py-2.5 px-4">Recicláveis (PET/Tetra/Alum/Plast)</th>
                                    <th className="py-2.5 px-4">Óleo (L)</th>
                                    <th className="py-2.5 px-4">ETs Geradas</th>
                                    <th className="py-2.5 px-4">Recebido Por</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {studentDeliveries.map((del) => (
                                    <tr key={del.id} className="hover:bg-gray-50/80">
                                      <td className="py-2.5 px-4 text-gray-600 font-medium whitespace-nowrap">
                                        {format(new Date(del.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                      </td>
                                      <td className="py-2.5 px-4">
                                        <span className="font-bold text-gray-900">{del.containers || 0} uni</span>
                                        <span className="text-[10px] text-gray-500 block">
                                          PET: {del.pet_units || 0} | Tetra: {del.tetra_pak_units || 0} | Lata: {del.aluminum_units || 0} | Plast: {del.plastic_units || 0}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-4 font-semibold text-gray-800">{del.oil_liters || 0} L</td>
                                      <td className="py-2.5 px-4 font-black text-emerald-700">+{del.ecotrocas_earned} ET</td>
                                      <td className="py-2.5 px-4 text-gray-600">{del.received_by || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </Td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
};

export default StudentsList;

