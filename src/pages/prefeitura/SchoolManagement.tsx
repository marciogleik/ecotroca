import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Button, Input, LiveIndicator } from '../../components/ui';
import { 
  School, Search, Edit2, X, CheckCircle, PackageCheck, History, UserCheck, 
  FileText, ArrowUpRight, ArrowDownRight, Printer, Users, Trash2, ChevronDown, 
  ChevronUp, Recycle, Wallet, Landmark, PlusCircle, AlertCircle, Receipt, Coins
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCpfCnpj, numeroPorExtenso } from '../../utils/formatters';

interface SchoolForm {
  name: string;
  responsible: string;
  address: string;
  coordinator: string;
}

const emptySchoolForm: SchoolForm = { name: '', responsible: '', address: '', coordinator: '' };

const SchoolManagement: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);

  // Cash Box (Caixa Central de Cédulas / Sicredi) state
  const [cashEntries, setCashEntries] = useState<any[]>([]);
  const [totalCashIn, setTotalCashIn] = useState(0);
  const [totalAllocatedToSchools, setTotalAllocatedToSchools] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCashHistoryModal, setShowCashHistoryModal] = useState(false);
  const [cashHistoryTab, setCashHistoryTab] = useState<'entries' | 'unified'>('entries');

  // New cash entry form state
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashSource, setCashSource] = useState<string>('Sicredi (Retirada na agência)');
  const [cashDate, setCashDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [cashReceivedBy, setCashReceivedBy] = useState<string>('Leidiane / Prefeitura');
  const [cashReceiptNumber, setCashReceiptNumber] = useState<string>('');
  const [cashNotes, setCashNotes] = useState<string>('');
  const [savingCashEntry, setSavingCashEntry] = useState(false);
  
  // Delivery form state
  const [amount, setAmount] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [receivedByCpf, setReceivedByCpf] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [operationType, setOperationType] = useState<'add' | 'withdraw'>('add');
  const [searchTerm, setSearchTerm] = useState('');

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [printableAllocation, setPrintableAllocation] = useState<any | null>(null);

  // School edit state
  const [editingSchool, setEditingSchool] = useState<any | null>(null);
  const [schoolForm, setSchoolForm] = useState<SchoolForm>(emptySchoolForm);
  const [savingSchool, setSavingSchool] = useState(false);

  // School students & deliveries inspection state
  const [viewingStudentsSchool, setViewingStudentsSchool] = useState<any | null>(null);
  const [schoolStudents, setSchoolStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [studentDeliveries, setStudentDeliveries] = useState<any[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Erro ao carregar escolas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocationsHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('school_allocations')
        .select('*, schools(name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching allocations history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCashData = async () => {
    try {
      const { data: entries, error: entriesErr } = await supabase
        .from('prefeitura_cash_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (entriesErr) throw entriesErr;
      setCashEntries(entries || []);

      const totalIn = entries?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      const { data: allocs, error: allocErr } = await supabase
        .from('school_allocations')
        .select('amount');

      if (allocErr) throw allocErr;
      const totalOut = allocs?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      setTotalCashIn(totalIn);
      setTotalAllocatedToSchools(totalOut);
      setCashBalance(totalIn - totalOut);
    } catch (err) {
      console.error('Error fetching cash data:', err);
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchAllocationsHistory();
    fetchCashData();

    const channel = supabase
      .channel('schools-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, () => {
        fetchSchools();
        fetchAllocationsHistory();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_allocations' }, () => {
        fetchSchools();
        fetchAllocationsHistory();
        fetchCashData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prefeitura_cash_entries' }, () => {
        fetchCashData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(cashAmount);
    if (isNaN(val) || val <= 0) {
      toast.error('Informe uma quantidade válida de Ecotrocas.');
      return;
    }

    setSavingCashEntry(true);
    try {
      const { error } = await supabase
        .from('prefeitura_cash_entries')
        .insert([{
          amount: val,
          source: cashSource.trim() || 'Sicredi',
          entry_date: cashDate || format(new Date(), 'yyyy-MM-dd'),
          received_by: cashReceivedBy.trim() || 'Leidiane / Prefeitura',
          receipt_number: cashReceiptNumber.trim() || null,
          notes: cashNotes.trim() || null
        }]);

      if (error) throw error;

      toast.success(`🎉 ${val} Ecotrocas adicionadas ao Caixa da Prefeitura!`);
      setCashAmount('');
      setCashReceiptNumber('');
      setCashNotes('');
      setShowCashModal(false);
      fetchCashData();
    } catch (err: any) {
      console.error('Error saving cash entry:', err);
      toast.error(err.message || 'Erro ao registrar entrada no caixa.');
    } finally {
      setSavingCashEntry(false);
    }
  };

  const handleDeleteCashEntry = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta entrada de caixa? O saldo do caixa da Prefeitura será recalculado.')) return;

    try {
      const { error } = await supabase
        .from('prefeitura_cash_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Entrada de caixa removida com sucesso!');
      fetchCashData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover entrada de caixa.');
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !amount || parseInt(amount) <= 0) {
      toast.error('Por favor, informe a escola e uma quantidade válida.');
      return;
    }

    const parsedAmount = parseInt(amount);

    if (operationType === 'withdraw' && parsedAmount > selectedSchool.current_balance) {
      toast.error(`Saldo insuficiente. A escola possui apenas ${selectedSchool.current_balance} ET disponíveis.`);
      return;
    }

    const finalAmount = operationType === 'withdraw' ? -parsedAmount : parsedAmount;

    setAllocating(true);
    try {
      const { error } = await supabase
        .from('school_allocations')
        .insert([{
          school_id: selectedSchool.id,
          amount: finalAmount,
          received_by: receivedBy.trim() || null,
          received_by_cpf: receivedByCpf.trim() || null,
          notes: notes.trim() || null,
          delivered_by: 'Leidiane / Prefeitura'
        }]);

      if (error) throw error;

      if (operationType === 'add') {
        toast.success(`🎉 ${parsedAmount} Ecotrocas (verdinhos) entregues para ${selectedSchool.name}!`);
      } else {
        toast.success(`${parsedAmount} Ecotrocas retiradas de ${selectedSchool.name}`);
      }
      setAmount('');
      setReceivedBy('');
      setReceivedByCpf('');
      setNotes('');
      setSelectedSchool(null);
      setOperationType('add');
      fetchSchools();
      fetchAllocationsHistory();
      fetchCashData();
    } catch (error: any) {
      console.error('Error allocating ecotrocas:', error);
      toast.error(error.message || 'Erro ao realizar operação');
    } finally {
      setAllocating(false);
    }
  };

  const handleEditSchool = (school: any) => {
    setEditingSchool(school);
    setSchoolForm({
      name: school.name || '',
      responsible: school.responsible || '',
      address: school.address || '',
      coordinator: school.coordinator || '',
    });
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    setSavingSchool(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: schoolForm.name,
          responsible: schoolForm.responsible || null,
          address: schoolForm.address || null,
          coordinator: schoolForm.coordinator || null,
        })
        .eq('id', editingSchool.id);

      if (error) throw error;
      toast.success('Dados da escola atualizados com sucesso!');
      setEditingSchool(null);
      setSchoolForm(emptySchoolForm);
      fetchSchools();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar escola.');
    } finally {
      setSavingSchool(false);
    }
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar/remover este registro de repasse? O saldo acumulado da escola será reajustado automaticamente.')) return;

    try {
      const { error } = await supabase
        .from('school_allocations')
        .delete()
        .eq('id', allocationId);

      if (error) throw error;
      toast.success('Registro de repasse removido com sucesso!');
      fetchSchools();
      fetchAllocationsHistory();
      fetchCashData();
    } catch (error: any) {
      console.error('Error deleting allocation:', error);
      toast.error(error.message || 'Erro ao remover registro');
    }
  };

  const handleViewSchoolStudents = async (school: any) => {
    setViewingStudentsSchool(school);
    setExpandedStudentId(null);
    setStudentDeliveries([]);
    setStudentSearch('');
    setStudentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school', school.name)
        .order('name', { ascending: true });

      if (error) throw error;
      setSchoolStudents(data || []);
    } catch (err) {
      console.error('Error fetching school students:', err);
      toast.error('Erro ao carregar alunos da escola');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleExpandStudentDeliveries = async (studentId: string) => {
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null);
      setStudentDeliveries([]);
      return;
    }
    setExpandedStudentId(studentId);
    setDeliveriesLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudentDeliveries(data || []);
    } catch (err) {
      console.error('Error fetching student deliveries:', err);
      toast.error('Erro ao carregar entregas do aluno');
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const filteredSchoolStudents = schoolStudents.filter(st =>
    st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.enrollment.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredSchools = schools.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = history.filter(h =>
    h.schools?.name?.toLowerCase().includes(historySearch.toLowerCase()) ||
    (h.received_by && h.received_by.toLowerCase().includes(historySearch.toLowerCase())) ||
    (h.notes && h.notes.toLowerCase().includes(historySearch.toLowerCase()))
  );

  const newCalculatedBalance = selectedSchool && amount && !isNaN(parseInt(amount))
    ? operationType === 'add'
      ? selectedSchool.current_balance + parseInt(amount)
      : selectedSchool.current_balance - parseInt(amount)
    : selectedSchool?.current_balance;

  return (
    <div className="space-y-6">
      {/* Todo o conteúdo da página fica oculto ao imprimir */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 items-start">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Gestão de Escolas & Entregas de Verdinhos</h1>
            <LiveIndicator />
          </div>
          <p className="text-gray-500 mt-1">Registre a entrega de cédulas de Ecotroca ("verdinhos") para cada escola e controle os estoques.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCashModal(true)}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 bg-emerald-50/50 shadow-2xs font-bold"
          >
            <Landmark className="h-4 w-4 mr-1.5 text-emerald-600" />
            + Entrada do Sicredi
          </Button>

          {schools.length > 0 && !selectedSchool && (
            <Button
              roleColor="prefeitura"
              onClick={() => setSelectedSchool(schools[0])}
              className="shrink-0 font-bold"
            >
              <PackageCheck className="h-4 w-4 mr-1.5" />
              Entregar para Escola
            </Button>
          )}
        </div>
      </div>

      {/* Card Central do Caixa da Prefeitura */}
      <div className="bg-gradient-to-br from-emerald-50/90 via-white to-blue-50/40 border border-emerald-200/80 shadow-sm rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Caixa Central de Cédulas (Prefeitura)</h2>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  Controle de Custódia • Gestão
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Controle das cédulas físicas retiradas no Sicredi prontas para distribuição às escolas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowCashHistoryModal(true)}
              className="inline-flex items-center px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-2xs transition-all"
            >
              <Receipt className="h-4 w-4 mr-1.5 text-gray-500" />
              Extrato do Caixa
            </button>
            <button
              type="button"
              onClick={() => setShowCashModal(true)}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              + Entrada do Sicredi
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-white/90 p-4 rounded-xl border border-emerald-100/80 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
              <span>SALDO ATUAL EM CAIXA</span>
              <span className="p-1 bg-emerald-50 rounded text-emerald-600"><Coins className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{cashBalance.toLocaleString('pt-BR')} ET</span>
              <span className="text-xs font-medium text-gray-500">(R$ {cashBalance.toLocaleString('pt-BR')},00)</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Disponível em mãos com a Prefeitura</p>
          </div>

          <div className="bg-white/90 p-4 rounded-xl border border-emerald-100/80 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
              <span>TOTAL RETIRADO (SICREDI)</span>
              <span className="p-1 bg-blue-50 rounded text-blue-600"><Landmark className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-800">{totalCashIn.toLocaleString('pt-BR')} ET</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{cashEntries.length} lote(s) recebido(s)</p>
          </div>

          <div className="bg-white/90 p-4 rounded-xl border border-emerald-100/80 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
              <span>REPASSADO ÀS ESCOLAS</span>
              <span className="p-1 bg-amber-50 rounded text-amber-600"><School className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-800">{totalAllocatedToSchools.toLocaleString('pt-BR')} ET</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Distribuído para {schools.length} escolas</p>
          </div>
        </div>
      </div>

      {/* Painel de edição de escola */}
      {editingSchool && (
        <Card className="border-prefeitura/20 bg-prefeitura/5">
          <CardHeader
            title={`Editar: ${editingSchool.name}`}
            subtitle="Atualize os dados cadastrais da escola"
            icon={Edit2}
            iconColor="bg-prefeitura-light text-prefeitura"
          />
          <CardBody>
            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome da Escola"
                  required
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm(p => ({ ...p, name: e.target.value }))}
                  roleColor="prefeitura"
                />
                <Input
                  label="Responsável pela Escola"
                  placeholder="Ex: Diretora Maria Aparecida"
                  value={schoolForm.responsible}
                  onChange={(e) => setSchoolForm(p => ({ ...p, responsible: e.target.value }))}
                  roleColor="prefeitura"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Endereço"
                  placeholder="Rua, número, bairro"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm(p => ({ ...p, address: e.target.value }))}
                  roleColor="prefeitura"
                />
                <Input
                  label="Coordenador EcoTroca"
                  placeholder="Nome do responsável pelo programa"
                  value={schoolForm.coordinator}
                  onChange={(e) => setSchoolForm(p => ({ ...p, coordinator: e.target.value }))}
                  roleColor="prefeitura"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => { setEditingSchool(null); setSchoolForm(emptySchoolForm); }}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button type="submit" disabled={savingSchool} roleColor="prefeitura">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {savingSchool ? 'Salvando...' : 'Salvar Dados'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal: Lista de Escolas */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Escolas Cadastradas"
              subtitle="Saldos atuais e histórico de recebimento de cédulas"
              icon={School}
              iconColor="bg-prefeitura-light text-prefeitura"
            />
            <CardBody>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar escola por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    roleColor="prefeitura"
                  />
                </div>
                <Button onClick={fetchSchools} roleColor="prefeitura" variant="secondary">
                  <Search className="h-5 w-5 mr-2" />
                  Atualizar
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400">Carregando escolas...</div>
              ) : filteredSchools.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma escola encontrada.</div>
              ) : (
                <div className="space-y-3">
                  {filteredSchools.map((school) => (
                    <div
                      key={school.id}
                      className={`border rounded-xl p-4 transition-all ${
                        selectedSchool?.id === school.id
                          ? 'border-prefeitura bg-prefeitura/5 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {/* Nome + badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="font-bold text-gray-900 text-base">{school.name}</div>
                          {school.responsible && (
                            <div className="text-xs text-gray-500 mt-0.5 font-medium">Resp: {school.responsible}</div>
                          )}
                          {school.address && (
                            <div className="text-xs text-gray-400">{school.address}</div>
                          )}
                        </div>
                        {school.current_balance < 0 ? (
                          <span className="shrink-0 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            📦 NECESSITA REPOSIÇÃO ({Math.abs(school.current_balance)} ET)
                          </span>
                        ) : school.current_balance < 50 && (
                          <span className={`shrink-0 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                            school.current_balance === 0
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {school.current_balance === 0 ? '⚠️ ESTOQUE ZERADO' : '⚡ ESTOQUE BAIXO'}
                          </span>
                        )}
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Coordenador</p>
                          {school.coordinator
                            ? <span className="font-medium text-gray-800 text-xs truncate block">{school.coordinator}</span>
                            : <span className="text-gray-400 text-xs italic">Não informado</span>
                          }
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Recebido</p>
                          <span className="font-bold text-gray-800">{school.total_received} ET</span>
                          <span className="text-[10px] text-gray-400 block">Prefeitura entregou</span>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Lançado</p>
                          <span className="font-bold text-gray-800">{school.total_distributed} ET</span>
                          <span className="text-[10px] text-gray-400 block">Escola lançou</span>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Estoque de Verdinhos</p>
                          {school.current_balance < 0 ? (
                            <>
                              <span className="font-black text-base text-amber-700">
                                -{Math.abs(school.current_balance)} ET
                              </span>
                              <p className="text-[10px] text-amber-600 font-semibold">reposição pendente</p>
                            </>
                          ) : (
                            <span className={`font-black text-base ${
                              school.current_balance === 0
                                ? 'text-red-600'
                                : school.current_balance < 50
                                ? 'text-amber-600'
                                : 'text-prefeitura'
                            }`}>
                              {school.current_balance} ET
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-wrap gap-2 pt-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          roleColor="prefeitura"
                          onClick={() => handleViewSchoolStudents(school)}
                        >
                          <Users className="h-4 w-4 mr-1 text-prefeitura" />
                          Alunos & Entregas
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          roleColor="prefeitura"
                          onClick={() => handleEditSchool(school)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar Dados
                        </Button>
                        <Button
                          size="sm"
                          roleColor="prefeitura"
                          onClick={() => {
                            setSelectedSchool(school);
                            setOperationType('add');
                          }}
                        >
                          <PackageCheck className="h-4 w-4 mr-1" />
                          Registrar Entrega de Verdinhos
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Modal / Painel de Inspeção de Alunos & Entregas da Escola */}
          {viewingStudentsSchool && (
            <Card className="border-2 border-prefeitura bg-white shadow-xl">
              <CardHeader
                title={`Alunos e Entregas: ${viewingStudentsSchool.name}`}
                subtitle="Visualização detalhada dos alunos cadastrados e do histórico individual de reciclagem"
                icon={Users}
                iconColor="bg-prefeitura-light text-prefeitura"
              />
              <CardBody className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex gap-4 items-center">
                    <div className="p-3 bg-prefeitura/10 rounded-xl text-prefeitura">
                      <School className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{viewingStudentsSchool.name}</p>
                      <p className="text-xs text-gray-500">
                        Total de Alunos: <strong>{schoolStudents.length}</strong> • Estoque de Verdinhos: <strong>{viewingStudentsSchool.current_balance} ET</strong>
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => { setViewingStudentsSchool(null); setExpandedStudentId(null); }}>
                    <X className="h-5 w-5 mr-1" /> Fechar Inspeção
                  </Button>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar aluno por nome ou matrícula nesta escola..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      roleColor="prefeitura"
                    />
                  </div>
                </div>

                {studentsLoading ? (
                  <div className="text-center py-8 text-gray-400">Carregando alunos da escola...</div>
                ) : filteredSchoolStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum aluno encontrado para esta escola.</div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {filteredSchoolStudents.map((st) => (
                      <div key={st.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-prefeitura/40 transition-all">
                        <div
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/80"
                          onClick={() => handleExpandStudentDeliveries(st.id)}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 text-base">{st.name}</p>
                              {st.grade && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{st.grade}</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Matrícula: <span className="font-semibold text-gray-800">{st.enrollment}</span>
                              {st.guardian_name && ` • Resp: ${st.guardian_name}`}
                              {st.guardian_phone && ` (${st.guardian_phone})`}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 justify-between md:justify-end">
                            <div className="text-right">
                              <span className="text-xs text-gray-500 font-semibold block uppercase">Saldo Atual</span>
                              <span className="text-lg font-black text-prefeitura">{st.ecotrocas || 0} ET</span>
                              {(st.remainder_containers > 0 || st.remainder_oil > 0) && (
                                <span className="text-[10px] text-amber-600 block font-medium">
                                  Sobra acumulada: {st.remainder_containers || 0} emb / {st.remainder_oil || 0}L
                                </span>
                              )}
                            </div>
                            <Button size="sm" variant="outline" roleColor="prefeitura">
                              {expandedStudentId === st.id ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                              {expandedStudentId === st.id ? 'Ocultar Lançamentos' : 'Ver Entregas'}
                            </Button>
                          </div>
                        </div>

                        {/* Seção expandida: Histórico de entregas do aluno */}
                        {expandedStudentId === st.id && (
                          <div className="border-t border-gray-100 bg-slate-50/80 p-4 space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Recycle className="h-4 w-4 text-prefeitura" />
                              Histórico de Entregas de Reciclagem — {st.name}
                            </h4>

                            {deliveriesLoading ? (
                              <div className="text-center py-4 text-xs text-gray-400">Carregando entregas...</div>
                            ) : studentDeliveries.length === 0 ? (
                              <div className="text-center py-4 text-xs text-gray-500">Este aluno ainda não possui lançamentos de recicláveis.</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase">
                                      <th className="py-2 px-3">Data / Hora</th>
                                      <th className="py-2 px-3">Embalagens (PET/Tetra/Alum/Plast)</th>
                                      <th className="py-2 px-3">Óleo (L)</th>
                                      <th className="py-2 px-3">ETs Geradas</th>
                                      <th className="py-2 px-3">Recebido Por</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200/60">
                                    {studentDeliveries.map((del) => (
                                      <tr key={del.id} className="hover:bg-white">
                                        <td className="py-2 px-3 text-gray-600 font-medium whitespace-nowrap">
                                          {format(new Date(del.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="font-bold text-gray-900">{del.containers || 0} uni</span>
                                          <span className="text-[10px] text-gray-500 block">
                                            PET: {del.pet_units || 0} | Tetra: {del.tetra_pak_units || 0} | Lata: {del.aluminum_units || 0} | Plast: {del.plastic_units || 0}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-gray-800">{del.oil_liters || 0} L</td>
                                        <td className="py-2 px-3 font-black text-emerald-700">+{del.ecotrocas_earned} ET</td>
                                        <td className="py-2 px-3 text-gray-600">{del.received_by || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Coluna lateral: Form de Entrega de Ecotrocas */}
        <div className="lg:col-span-1">
          {selectedSchool ? (
            <Card className="sticky top-6 border-prefeitura/30 bg-white shadow-md">
              <CardHeader
                title="Registrar Entrega de Verdinhos"
                subtitle={selectedSchool.name}
                icon={PackageCheck}
                iconColor="bg-prefeitura-light text-prefeitura"
              />
              <CardBody>
                <form onSubmit={handleAllocate} className="space-y-4">
                  
                  {/* Seletor de Escola */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Escola Selecionada
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-prefeitura focus:border-prefeitura"
                      value={selectedSchool.id}
                      onChange={(e) => {
                        const s = schools.find(item => item.id === e.target.value);
                        if (s) setSelectedSchool(s);
                      }}
                    >
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.current_balance < 0 ? `Pendência: ${Math.abs(s.current_balance)} ET` : `Saldo: ${s.current_balance} ET`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Toggle Adicionar (Entrega) / Retirar (Ajuste) */}
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden p-0.5 bg-gray-100">
                    <button
                      type="button"
                      onClick={() => { setOperationType('add'); setAmount(''); }}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                        operationType === 'add'
                          ? 'bg-prefeitura text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-200/60'
                      }`}
                    >
                      + Entrega de Cédulas
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOperationType('withdraw'); setAmount(''); }}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                        operationType === 'withdraw'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-200/60'
                      }`}
                    >
                      − Estorno / Retirada
                    </button>
                  </div>

                  {/* Card de Saldo Atual e Previsto */}
                  <div className="p-3 bg-prefeitura/5 rounded-xl border border-prefeitura/20 space-y-2 text-sm">
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Saldo em Estoque Atual da Escola:</span>
                      <span className="font-bold text-gray-900">{selectedSchool.current_balance} ET</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-800 bg-emerald-50/80 p-1.5 rounded-md border border-emerald-200/60">
                      <span>Saldo no Caixa da Prefeitura:</span>
                      <span className="font-bold">{cashBalance} ET</span>
                    </div>
                    {amount && !isNaN(parseInt(amount)) && parseInt(amount) > 0 && (
                      <div className="flex justify-between items-center pt-1 border-t border-prefeitura/10 font-semibold text-xs">
                        <span className="text-prefeitura">Novo Saldo da Escola:</span>
                        <span className="font-extrabold text-sm text-prefeitura">{newCalculatedBalance} ET</span>
                      </div>
                    )}
                  </div>

                  {/* Aviso informativo se o valor for maior que o caixa da prefeitura */}
                  {operationType === 'add' && amount && parseInt(amount) > cashBalance && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Aviso:</strong> A quantidade informada ({amount} ET) é superior ao saldo registrado em caixa ({cashBalance} ET). A entrega será registrada normalmente, mas lembre-se de cadastrar a retirada do Sicredi no caixa.
                      </span>
                    </div>
                  )}

                  <Input
                    label={operationType === 'add' ? 'Quantidade de Verdinhos Entregues' : 'Quantidade a Retirar'}
                    type="number"
                    placeholder="Ex: 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    roleColor="prefeitura"
                    required
                    min="1"
                    max={operationType === 'withdraw' ? selectedSchool.current_balance : undefined}
                  />

                  {operationType === 'add' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Representante que Retirou na Prefeitura"
                          placeholder="Ex: Fernando S. M. R. Michel"
                          value={receivedBy}
                          onChange={(e) => setReceivedBy(e.target.value)}
                          roleColor="prefeitura"
                          required
                        />

                        <Input
                          label="CPF do Representante"
                          placeholder="000.000.000-00"
                          value={receivedByCpf}
                          onChange={(e) => setReceivedByCpf(formatCpfCnpj(e.target.value))}
                          roleColor="prefeitura"
                        />
                      </div>

                      <Input
                        label="Observações / Nº Recibo (opcional)"
                        placeholder="Ex: Lote 05 / Entregue em mãos"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        roleColor="prefeitura"
                      />
                    </>
                  )}

                  {operationType === 'withdraw' && (
                    <Input
                      label="Motivo do Estorno / Retirada"
                      placeholder="Ex: Ajuste de inventário"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      roleColor="prefeitura"
                      required
                    />
                  )}

                  {operationType === 'withdraw' && amount && parseInt(amount) > selectedSchool.current_balance && (
                    <p className="text-xs text-red-600 font-medium">
                      ⚠️ Quantidade maior que o saldo disponível em estoque ({selectedSchool.current_balance} ET).
                    </p>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      type="submit"
                      className="w-full"
                      roleColor="prefeitura"
                      disabled={allocating || !amount || (operationType === 'withdraw' && parseInt(amount) > selectedSchool.current_balance)}
                    >
                      {allocating ? 'Registrando...'
                        : operationType === 'add' ? 'Confirmar Entrega de Verdinhos'
                        : 'Confirmar Retirada'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setSelectedSchool(null);
                        setAmount('');
                        setReceivedBy('');
                        setNotes('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-center space-y-3">
              <div className="p-3 bg-prefeitura/10 rounded-full text-prefeitura">
                <PackageCheck className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">Registrar Repasse para Escola</p>
                <p className="text-xs text-gray-500 mt-1">Selecione uma escola na lista ao lado para lançar a entrega de novas cédulas ("verdinhos").</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Completo de Entregas de Verdinhos para Escolas */}
      <Card>
        <CardHeader
          title="Histórico de Entregas de Ecotrocas para Escolas"
          subtitle="Registro cronológico dos verdinhos entregues pela Prefeitura às instituições de ensino"
          icon={History}
          iconColor="bg-prefeitura-light text-prefeitura"
        />
        <CardBody>
          <div className="mb-4 max-w-md">
            <Input
              placeholder="Filtrar histórico por escola, representante ou nota..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              roleColor="prefeitura"
            />
          </div>

          {historyLoading ? (
            <div className="text-center py-6 text-gray-400">Carregando histórico de entregas...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-6 text-gray-500">Nenhum registro de entrega encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Escola</th>
                    <th className="py-3 px-4">Operação</th>
                    <th className="py-3 px-4 text-right">Quantidade</th>
                    <th className="py-3 px-4">Quem Retirou (Representante)</th>
                    <th className="py-3 px-4">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHistory.map((item) => (
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
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {item.schools?.name || 'Escola'}
                      </td>
                      <td className="py-3 px-4">
                        {item.amount > 0 ? (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> Entrega de Verdinhos
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <ArrowDownRight className="h-3 w-3 mr-1" /> Retirada / Ajuste
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-black ${item.amount > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {item.amount > 0 ? `+${item.amount}` : item.amount} ET
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-gray-700">
                        {item.received_by ? (
                          <span className="inline-flex items-center text-gray-800">
                            <UserCheck className="h-3.5 w-3.5 mr-1.5 text-prefeitura" />
                            {item.received_by}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Não informado</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {item.notes ? (
                          <span className="inline-flex items-center text-gray-600">
                            <FileText className="h-3.5 w-3.5 mr-1 text-gray-400" />
                            {item.notes}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            roleColor="prefeitura"
                            onClick={() => setPrintableAllocation(item)}
                          >
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Comprovante
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteAllocation(item.id)}
                            title="Excluir / Cancelar este repasse"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      </div> {/* Fim do bloco print:hidden */}

      {/* Modal: Registrar Entrada de Cédulas no Caixa */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Registrar Entrada de Cédulas</h3>
                  <p className="text-xs text-gray-500">Adicione os verdinhos pegos no Sicredi ao Caixa da Prefeitura</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCashModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCashEntry} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Quantidade de Ecotrocas (ET) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min="1"
                  placeholder="Ex: 1850"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  roleColor="prefeitura"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Origem do Lote</label>
                  <select
                    value={cashSource}
                    onChange={(e) => setCashSource(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="Sicredi (Retirada na agência)">Sicredi (Retirada na agência)</option>
                    <option value="Saldo Inicial / Em mãos">Saldo Inicial / Em mãos</option>
                    <option value="Gráfica / Nova Impressão">Gráfica / Nova Impressão</option>
                    <option value="Devolução de Escola">Devolução de Escola</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Data do Recebimento</label>
                  <input
                    type="date"
                    required
                    value={cashDate}
                    onChange={(e) => setCashDate(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Responsável pelo Recebimento</label>
                  <Input
                    value={cashReceivedBy}
                    onChange={(e) => setCashReceivedBy(e.target.value)}
                    placeholder="Ex: Leidiane / Prefeitura"
                    roleColor="prefeitura"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nº Comprovante / Envelope (opcional)</label>
                  <Input
                    value={cashReceiptNumber}
                    onChange={(e) => setCashReceiptNumber(e.target.value)}
                    placeholder="Ex: Termo 12/2026"
                    roleColor="prefeitura"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações (opcional)</label>
                <Input
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                  placeholder="Ex: Cédulas retiradas com o gerente Sicredi para reposição escolar"
                  roleColor="prefeitura"
                />
              </div>

              {/* Pré-visualização do saldo */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Saldo atual em caixa:</span>
                  <span className="font-bold text-gray-800">{cashBalance} ET</span>
                </div>
                {parseInt(cashAmount) > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-emerald-200/60">
                    <span>Novo saldo após confirmação:</span>
                    <span className="font-extrabold text-sm">{cashBalance + parseInt(cashAmount)} ET</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCashModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingCashEntry}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  {savingCashEntry ? 'Salvando...' : 'Confirmar Entrada'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Extrato de Movimentações do Caixa */}
      {showCashHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-prefeitura/10 text-prefeitura rounded-xl">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Extrato de Movimentações do Caixa</h3>
                  <p className="text-xs text-gray-500">Histórico de lotes retirados no Sicredi e conciliação com as escolas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCashHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 flex flex-wrap gap-4 justify-between items-center bg-gray-50 p-3 rounded-xl my-3 text-xs">
              <div>
                <span className="text-gray-500 block">Total Entradas (Sicredi):</span>
                <strong className="text-sm font-bold text-emerald-700">{totalCashIn} ET</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Total Repasses (Escolas):</span>
                <strong className="text-sm font-bold text-gray-800">{totalAllocatedToSchools} ET</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Saldo Atual em Caixa:</span>
                <strong className="text-sm font-black text-prefeitura">{cashBalance} ET</strong>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCashHistoryTab('entries')}
                className={`py-2 px-4 border-b-2 transition-all ${
                  cashHistoryTab === 'entries'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Entradas de Cédulas ({cashEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setCashHistoryTab('unified')}
                className={`py-2 px-4 border-b-2 transition-all ${
                  cashHistoryTab === 'unified'
                    ? 'border-prefeitura text-prefeitura font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Linha do Tempo Unificada
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {cashHistoryTab === 'entries' ? (
                cashEntries.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Nenhuma entrada de cédulas registrada ainda.<br />
                    Clique em <strong>+ Entrada do Sicredi</strong> para lançar o primeiro lote.
                  </div>
                ) : (
                  cashEntries.map((entry) => (
                    <div key={entry.id} className="p-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 transition-all flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-emerald-700">+{entry.amount} ET</span>
                          <span className="bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                            {entry.source}
                          </span>
                          {entry.receipt_number && (
                            <span className="text-gray-500 text-[10px]">Doc: {entry.receipt_number}</span>
                          )}
                        </div>
                        <p className="text-gray-500 mt-0.5">
                          Data: <strong>{format(new Date(entry.entry_date + 'T12:00:00'), 'dd/MM/yyyy')}</strong>
                          {entry.received_by && ` • Resp: ${entry.received_by}`}
                          {entry.notes && ` • Obs: "${entry.notes}"`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCashEntry(entry.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                        title="Excluir entrada"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )
              ) : (
                /* Linha do tempo unificada */
                <div className="space-y-2">
                  {[
                    ...cashEntries.map(e => ({
                      id: e.id,
                      date: e.entry_date,
                      timestamp: new Date(e.entry_date + 'T12:00:00').getTime(),
                      type: 'in',
                      amount: e.amount,
                      title: `Entrada: ${e.source}`,
                      sub: `Resp: ${e.received_by || 'Leidiane'} ${e.receipt_number ? `• Doc: ${e.receipt_number}` : ''}`
                    })),
                    ...history.map(h => ({
                      id: h.id,
                      date: h.created_at,
                      timestamp: new Date(h.created_at).getTime(),
                      type: 'out',
                      amount: h.amount,
                      title: `Repasse: ${h.schools?.name || 'Escola'}`,
                      sub: `Entregue por: ${h.delivered_by || 'Prefeitura'} • Recebido por: ${h.received_by || 'Escola'}`
                    }))
                  ]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map(item => (
                      <div key={item.id} className="p-3 bg-white border border-gray-200 rounded-xl flex justify-between items-center text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`p-1.5 rounded-lg ${item.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.type === 'in' ? <Landmark className="h-4 w-4" /> : <School className="h-4 w-4" />}
                          </span>
                          <div>
                            <p className="font-bold text-gray-900">{item.title}</p>
                            <p className="text-gray-500 text-[11px] mt-0.5">
                              {format(new Date(item.date), 'dd/MM/yyyy')} • {item.sub}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${item.type === 'in' ? 'text-emerald-700' : 'text-gray-800'}`}>
                          {item.type === 'in' ? `+${item.amount} ET` : `-${Math.abs(item.amount)} ET`}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button variant="ghost" onClick={() => setShowCashHistoryModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impressão do Recibo */}
      {printableAllocation && (
        <div className="print:hidden fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Floating Controls Bar */}
          <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
            <Button
              roleColor="prefeitura"
              onClick={() => window.print()}
              className="shadow-xl font-bold text-base px-5 py-2.5"
            >
              <Printer className="h-5 w-5 mr-2" /> Imprimir Recibo
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPrintableAllocation(null)}
              className="shadow-xl bg-white text-slate-800 hover:bg-slate-100 font-bold px-4 py-2.5"
            >
              <X className="h-5 w-5 mr-1" /> Fechar
            </Button>
          </div>

          {/* A4 Paper Sheet Preview on screen */}
          <div className="bg-white text-black font-serif text-lg leading-relaxed w-full max-w-[210mm] min-h-[297mm] p-12 md:p-16 shadow-2xl rounded-sm border border-slate-200 my-auto">
            <div className="text-center mb-16 pt-6">
              <h1 className="text-4xl font-bold uppercase tracking-widest underline decoration-2 underline-offset-8">
                RECIBO
              </h1>
            </div>

            <div className="space-y-8 text-justify text-2xl leading-loose font-serif my-12">
              <p>
                Pelo presente, <span className="font-bold border-b border-black px-2 inline-block min-w-[220px] text-center">{printableAllocation.received_by || '____________________________'}</span>, CPF: nº <span className="font-bold border-b border-black px-2 inline-block min-w-[160px] text-center">{printableAllocation.received_by_cpf ? formatCpfCnpj(printableAllocation.received_by_cpf) : '_____________________'}</span> declara haver recebido da <strong>SEC. DESENVOLVIMENTO</strong>, <strong className="font-bold">{Math.abs(printableAllocation.amount)} ({numeroPorExtenso(Math.abs(printableAllocation.amount))})</strong> ECOTROCAS, referente ao <strong>PROGRAMA RECICLA VERDINHO</strong>.
              </p>

              <p className="pt-6">
                E por ser verdade firma o presente recibo.
              </p>

              <p className="pt-10">
                Água Boa/MT, <span className="font-bold border-b border-black px-3">{format(new Date(printableAllocation.created_at), 'dd')}</span> de <span className="font-bold border-b border-black px-4">{format(new Date(printableAllocation.created_at), 'MMMM', { locale: ptBR })}</span> do ano <span className="font-bold border-b border-black px-3">{format(new Date(printableAllocation.created_at), 'yyyy')}</span>.
              </p>
            </div>

            <div className="mt-40 flex flex-col items-center text-center">
              <div className="w-96 border-t border-black mb-3"></div>
              <p className="font-bold text-xl uppercase tracking-wide">{printableAllocation.received_by || 'NOME DO REPRESENTANTE'}</p>
              <p className="text-xs font-bold italic uppercase tracking-wider text-gray-700 mt-1">NOME COMPLETO por extenso</p>
            </div>
          </div>
        </div>
      )}

      {/* Recibo REAL para Impressão — Isolado da árvore de telas para a impressora capturar sem bugs */}
      {printableAllocation && (
        <div id="printable-receipt" className="hidden print:block font-serif text-black leading-relaxed">
          <div className="text-center mb-16 pt-8">
            <h1 className="text-4xl font-bold uppercase tracking-widest underline decoration-2 underline-offset-8">
              RECIBO
            </h1>
          </div>

          <div className="space-y-8 text-justify text-2xl leading-loose font-serif my-12">
            <p>
              Pelo presente, <span className="font-bold border-b border-black px-2 inline-block min-w-[220px] text-center">{printableAllocation.received_by || '____________________________'}</span>, CPF: nº <span className="font-bold border-b border-black px-2 inline-block min-w-[160px] text-center">{printableAllocation.received_by_cpf ? formatCpfCnpj(printableAllocation.received_by_cpf) : '_____________________'}</span> declara haver recebido da <strong>SEC. DESENVOLVIMENTO</strong>, <strong className="font-bold">{Math.abs(printableAllocation.amount)} ({numeroPorExtenso(Math.abs(printableAllocation.amount))})</strong> ECOTROCAS, referente ao <strong>PROGRAMA RECICLA VERDINHO</strong>.
            </p>

            <p className="pt-6">
              E por ser verdade firma o presente recibo.
            </p>

            <p className="pt-10">
              Água Boa/MT, <span className="font-bold border-b border-black px-3">{format(new Date(printableAllocation.created_at), 'dd')}</span> de <span className="font-bold border-b border-black px-4">{format(new Date(printableAllocation.created_at), 'MMMM', { locale: ptBR })}</span> do ano <span className="font-bold border-b border-black px-3">{format(new Date(printableAllocation.created_at), 'yyyy')}</span>.
            </p>
          </div>

          <div className="mt-40 flex flex-col items-center text-center">
            <div className="w-96 border-t border-black mb-3"></div>
            <p className="font-bold text-xl uppercase tracking-wide">{printableAllocation.received_by || 'NOME DO REPRESENTANTE'}</p>
            <p className="text-xs font-bold italic uppercase tracking-wider text-gray-700 mt-1">NOME COMPLETO por extenso</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolManagement;
