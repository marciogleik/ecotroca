import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Input, Button } from '../../components/ui';
import { PlusCircle, Search, ArrowLeft, CheckCircle, Calculator, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { getCurrentFortnight } from '../../utils/fortnight';

const RegisterDelivery: React.FC = () => {
  const { schoolId } = useAuth();
  const [searchParams] = useSearchParams();
  const studentIdFromUrl = searchParams.get('studentId');

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolBalance, setSchoolBalance] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Material quantities (each type separately)
  const [petUnits, setPetUnits] = useState(0);
  const [tetraPakUnits, setTetraPakUnits] = useState(0);
  const [aluminumUnits, setAluminumUnits] = useState(0);
  const [plasticUnits, setPlasticUnits] = useState(0);
  const [oilLiters, setOilLiters] = useState(0);
  const [receivedBy, setReceivedBy] = useState('');

  const [calculatedET, setCalculatedET] = useState(0);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [schoolPeriodContainers, setSchoolPeriodContainers] = useState<number>(0);
  const [schoolPeriodOil, setSchoolPeriodOil] = useState<number>(0);
  const navigate = useNavigate();

  // Decree rules
  const CONTAINER_RATIO = 10;  // 10 units = 1 ET
  const OIL_RATIO = 2;          // 2L = 1 ET
  const MAX_OIL_FORTNIGHT = 4;

  const totalContainers = petUnits + tetraPakUnits + aluminumUnits + plasticUnits;

  // Acúmulo de sobras: soma o que sobrou de entregas anteriores
  const prevRemainderContainers = student?.remainder_containers || 0;
  const prevRemainderOil = Number(student?.remainder_oil) || 0;
  const effectiveContainers = totalContainers + prevRemainderContainers;
  const effectiveOil = oilLiters + prevRemainderOil;
  const newRemainderContainers = effectiveContainers % CONTAINER_RATIO;
  const newRemainderOil = effectiveOil % OIL_RATIO;

  const currentFortnight = getCurrentFortnight();

  // Pool coletivo da escola por quinzena civil (N alunos × 80 emb. / N alunos × 4L)
  const SCHOOL_CONTAINER_LIMIT = studentCount * 80;
  const SCHOOL_OIL_LIMIT = studentCount * MAX_OIL_FORTNIGHT;

  const isContainersOverLimit = SCHOOL_CONTAINER_LIMIT > 0 && schoolPeriodContainers + totalContainers > SCHOOL_CONTAINER_LIMIT;
  const isOilOverLimit = SCHOOL_OIL_LIMIT > 0 && schoolPeriodOil + oilLiters > SCHOOL_OIL_LIMIT;
  const isOverLimit = isContainersOverLimit || isOilOverLimit;

  useEffect(() => {
    if (schoolId) fetchSchoolBalance();
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;
    supabase
      .from('schools')
      .select('name')
      .eq('id', schoolId)
      .single()
      .then(({ data }) => setSchoolName(data?.name ?? null));
  }, [schoolId]);

  useEffect(() => {
    if (studentIdFromUrl) fetchStudentById(studentIdFromUrl);
  }, [studentIdFromUrl]);

  useEffect(() => {
    const etFromContainers = Math.floor(effectiveContainers / CONTAINER_RATIO);
    const etFromOil = Math.floor(effectiveOil / OIL_RATIO);
    setCalculatedET(etFromContainers + etFromOil);
  }, [effectiveContainers, effectiveOil]);

  useEffect(() => {
    if (schoolName) fetchSchoolPeriodStats();
  }, [schoolName]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 1 && schoolName) performSearch();
      else setSearchResults([]);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, schoolName]);

  const fetchSchoolBalance = async () => {
    const { data } = await supabase
      .from('schools')
      .select('current_balance')
      .eq('id', schoolId)
      .single();
    if (data) setSchoolBalance(data.current_balance);
  };

  const fetchSchoolPeriodStats = async () => {
    if (!schoolName) return;
    const { startDateIso, endDateIso } = getCurrentFortnight();

    const { data: schoolStudents } = await supabase
      .from('students')
      .select('id')
      .eq('school', schoolName);

    const count = schoolStudents?.length ?? 0;
    setStudentCount(count);

    if (count === 0) return;

    const ids = schoolStudents!.map(s => s.id);
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('containers, oil_liters')
      .in('student_id', ids)
      .gte('created_at', startDateIso)
      .lte('created_at', endDateIso);

    setSchoolPeriodContainers(
      deliveries?.reduce((acc, curr) => acc + (curr.containers || 0), 0) ?? 0
    );
    setSchoolPeriodOil(
      deliveries?.reduce((acc, curr) => acc + (Number(curr.oil_liters) || 0), 0) ?? 0
    );
  };

  const fetchStudentById = async (id: string) => {
    setSearching(true);
    try {
      const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
      if (error) throw error;
      setStudent(data);
    } catch (err) {
      console.error('Error fetching student:', err);
    } finally {
      setSearching(false);
    }
  };

  const performSearch = async () => {
    if (!schoolName) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school', schoolName)
        .or(`name.ilike.%${searchTerm}%,enrollment.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStudent = (selected: any) => {
    setStudent(selected);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    if (totalContainers === 0 && oilLiters === 0) {
      setError('Por favor, informe a quantidade de pelo menos um tipo de material.');
      return;
    }


    setLoading(true);
    setError(null);

    try {

      // Register delivery with all material types
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert([{
          student_id: student.id,
          student_name: student.name,
          containers: totalContainers,    // total for backward compatibility
          pet_units: petUnits,
          tetra_pak_units: tetraPakUnits,
          aluminum_units: aluminumUnits,
          plastic_units: plasticUnits,
          oil_liters: oilLiters,
          ecotrocas_earned: calculatedET,
          received_by: receivedBy || null,
        }]);

      if (deliveryError) throw deliveryError;

      // Update student balance + remainders
      const { error: updateError } = await supabase
        .from('students')
        .update({
          ecotrocas: (student.ecotrocas || 0) + calculatedET,
          remainder_containers: newRemainderContainers,
          remainder_oil: newRemainderOil,
        })
        .eq('id', student.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => navigate('/escola'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar entrega.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="bg-green-100 p-6 rounded-full">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Entrega Registrada!</h2>
        <p className="text-gray-500 font-medium">O aluno recebeu <span className="text-escola font-bold">{calculatedET} Ecotrocas</span>.</p>
        <p className="text-sm text-gray-400">Redirecionando para o início...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/escola" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Entrega de Materiais</h1>
      </div>

      {!student ? (
        <Card>
          <CardHeader title="Buscar Aluno" subtitle="Pesquise por nome ou matrícula para iniciar" icon={Search} />
          <CardBody>
            <form onSubmit={(e) => { e.preventDefault(); performSearch(); }} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ex: João Silva ou 2024001"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  roleColor="escola"
                />
              </div>
              <Button type="submit" disabled={searching} roleColor="escola">
                {searching ? 'Buscando...' : 'Pesquisar'}
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-4 border rounded-lg divide-y overflow-hidden">
                {searchResults.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStudent(s)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">
                        Matrícula: {s.enrollment}
                        {s.grade ? ` • ${s.grade}` : ''}
                        {s.school ? ` • ${s.school}` : ''}
                      </p>
                    </div>
                    <div className="bg-escola-light text-escola text-xs font-bold px-2 py-1 rounded">
                      Selecionar
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader title="Materiais Entregues" icon={PlusCircle} iconColor="bg-escola-light text-escola" />
              <CardBody>
                {/* Aluno selecionado */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Aluno Selecionado</p>
                    <p className="text-lg font-bold text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">
                      {student.grade ? `${student.grade} • ` : ''}{student.school}
                    </p>
                  </div>
                  <button onClick={() => setStudent(null)} className="text-xs text-red-600 hover:underline font-medium">
                    Alterar Aluno
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Materiais Recicláveis */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Materiais Recicláveis — 10 unidades = 1 EcoTroca
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Garrafas PET"
                        type="number" min="0"
                        value={petUnits}
                        onChange={(e) => setPetUnits(parseInt(e.target.value) || 0)}
                        roleColor="escola"
                        placeholder="0"
                      />
                      <Input
                        label="Embalagens Tetra Pak"
                        type="number" min="0"
                        value={tetraPakUnits}
                        onChange={(e) => setTetraPakUnits(parseInt(e.target.value) || 0)}
                        roleColor="escola"
                        placeholder="0"
                      />
                      <Input
                        label="Alumínio (latas)"
                        type="number" min="0"
                        value={aluminumUnits}
                        onChange={(e) => setAluminumUnits(parseInt(e.target.value) || 0)}
                        roleColor="escola"
                        placeholder="0"
                      />
                      <Input
                        label="Plásticos em Geral"
                        type="number" min="0"
                        value={plasticUnits}
                        onChange={(e) => setPlasticUnits(parseInt(e.target.value) || 0)}
                        roleColor="escola"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      Total nesta entrega: <strong>{totalContainers}</strong>
                      {SCHOOL_CONTAINER_LIMIT > 0 && (
                        <span className={`ml-1 font-semibold ${
                          schoolPeriodContainers + totalContainers > SCHOOL_CONTAINER_LIMIT
                            ? 'text-emerald-700'
                            : 'text-escola'
                        }`}>
                          (coletado na {currentFortnight.label}: {schoolPeriodContainers + totalContainers}/{SCHOOL_CONTAINER_LIMIT})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Óleo */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Óleo de Cozinha Usado — 2 litros = 1 EcoTroca
                    </p>
                    <Input
                      label="Litros de Óleo Usado"
                      type="number" step="0.5" min="0"
                      value={oilLiters}
                      onChange={(e) => setOilLiters(parseFloat(e.target.value) || 0)}
                      roleColor="escola"
                      placeholder="0.0"
                    />
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      {SCHOOL_OIL_LIMIT > 0
                        ? `Coletado na ${currentFortnight.label}: ${schoolPeriodOil + oilLiters}/${SCHOOL_OIL_LIMIT}L (${studentCount} alunos × ${MAX_OIL_FORTNIGHT}L)`
                        : 'Referência de 4L por aluno por quinzena'}
                    </p>
                  </div>

                  {/* Responsável */}
                  <div className="pt-2 border-t border-gray-100">
                    <Input
                      label="Responsável pelo Recebimento"
                      placeholder="Nome de quem está registrando a entrega"
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      roleColor="escola"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {isOverLimit && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg text-sm text-emerald-900 shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-950">
                            {isContainersOverLimit
                              ? `Estimativa quinzenal alcançada com sucesso (${schoolPeriodContainers + totalContainers} de ${SCHOOL_CONTAINER_LIMIT} embalagens)!`
                              : `Estimativa quinzenal de óleo alcançada com sucesso (${schoolPeriodOil + oilLiters}L de ${SCHOOL_OIL_LIMIT}L)!`
                            }
                          </p>
                          <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                            Parabéns pelo engajamento da comunidade escolar! <strong>O lançamento está 100% liberado e será registrado normalmente</strong>, sem nenhuma trava ou bloqueio.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {schoolBalance !== null && schoolBalance < 10 && (
                    <div className={`border-l-4 p-4 rounded-lg text-sm flex items-start gap-2.5 ${
                      schoolBalance <= 0
                        ? 'bg-amber-50 border-amber-400 text-amber-900'
                        : 'bg-yellow-50 border-yellow-400 text-yellow-800'
                    }`}>
                      <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        {schoolBalance <= 0 ? (
                          <>
                            <p className="font-bold text-amber-950">Cédulas físicas pendentes de reposição ({Math.abs(schoolBalance)} ET)</p>
                            <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                              A escola já distribuiu {Math.abs(schoolBalance)} ET além do lote físico recebido. <strong>O lançamento é liberado e será registrado normalmente</strong> — solicite uma nova remessa de cédulas à Prefeitura.
                            </p>
                          </>
                        ) : (
                          <p className="text-xs font-medium">Saldo baixo de cédulas ({schoolBalance} ET). Solicite nova remessa à Prefeitura em breve.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Button
                      type="submit"
                      disabled={loading || (totalContainers === 0 && oilLiters === 0)}  /* saldo negativo é permitido */
                      className="w-full h-12 text-lg font-bold shadow-md hover:shadow-lg transition-all"
                      roleColor="escola"
                    >
                      {loading ? 'Processando...' : `Confirmar e Gerar ${calculatedET} Ecotrocas`}
                    </Button>
                    <p className="text-center text-xs text-gray-500 font-medium flex items-center justify-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      Lançamentos sempre liberados continuamente • Sem travas de cota ou saldo
                    </p>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar: calculadora + regras */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-escola bg-escola-light bg-opacity-30">
              <CardHeader title="Calculadora" icon={Calculator} iconColor="bg-escola text-white" />
              <CardBody className="space-y-4">
                <div className="space-y-1.5 text-sm">
                  {petUnits > 0 && <div className="flex justify-between"><span className="text-gray-600">{petUnits} PET</span><span className="text-escola font-bold">+{petUnits} uni</span></div>}
                  {tetraPakUnits > 0 && <div className="flex justify-between"><span className="text-gray-600">{tetraPakUnits} Tetra Pak</span><span className="text-escola font-bold">+{tetraPakUnits} uni</span></div>}
                  {aluminumUnits > 0 && <div className="flex justify-between"><span className="text-gray-600">{aluminumUnits} Alumínio</span><span className="text-escola font-bold">+{aluminumUnits} uni</span></div>}
                  {plasticUnits > 0 && <div className="flex justify-between"><span className="text-gray-600">{plasticUnits} Plástico</span><span className="text-escola font-bold">+{plasticUnits} uni</span></div>}
                  {prevRemainderContainers > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span className="font-medium">⟳ Acumulado anterior</span>
                      <span className="font-bold">+{prevRemainderContainers} uni</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1.5 mt-1.5">
                    <span className="text-gray-600 font-medium">Total ({effectiveContainers} uni)</span>
                    <span className="text-escola font-bold">= {Math.floor(effectiveContainers / 10)} ET</span>
                  </div>
                  {newRemainderContainers > 0 && (
                    <div className="flex justify-between text-xs text-amber-600">
                      <span>Sobra p/ próxima entrega</span>
                      <span className="font-semibold">{newRemainderContainers} uni</span>
                    </div>
                  )}
                  {(oilLiters > 0 || prevRemainderOil > 0) && (
                    <>
                      {prevRemainderOil > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span className="font-medium">⟳ Óleo acumulado</span>
                          <span className="font-bold">+{prevRemainderOil}L</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">{effectiveOil}L Óleo</span>
                        <span className="text-escola font-bold">= {Math.floor(effectiveOil / 2)} ET</span>
                      </div>
                      {newRemainderOil > 0 && (
                        <div className="flex justify-between text-xs text-amber-600">
                          <span>Sobra óleo p/ próxima</span>
                          <span className="font-semibold">{newRemainderOil}L</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="pt-3 border-t border-escola border-opacity-20 flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Total a Receber:</span>
                  <span className="text-2xl font-black text-escola">{calculatedET} ET</span>
                </div>
                <p className="text-right text-xs text-gray-500 font-medium">Equivalente a R$ {calculatedET.toFixed(2)}</p>

                <div className="p-3 bg-white rounded-lg border border-escola border-opacity-20">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-escola mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Saldo atual: <strong>{student.ecotrocas} ET</strong>. Após esta operação: <strong>{student.ecotrocas + calculatedET} ET</strong>.
                    </p>
                  </div>
                </div>

                {studentCount > 0 && (
                  <div className="p-3.5 bg-white rounded-xl border border-escola/20 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-800">🏫 Volume Coletivo da Escola</p>
                      <span className="text-[10px] font-semibold bg-escola/10 text-escola px-2 py-0.5 rounded-full border border-escola/20">
                        {currentFortnight.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Embalagens coletadas</span>
                      <span className={`font-bold ${
                        schoolPeriodContainers >= SCHOOL_CONTAINER_LIMIT ? 'text-emerald-700' : 'text-escola'
                      }`}>
                        {schoolPeriodContainers} / {SCHOOL_CONTAINER_LIMIT}
                        {schoolPeriodContainers >= SCHOOL_CONTAINER_LIMIT && ' ★'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          schoolPeriodContainers >= SCHOOL_CONTAINER_LIMIT
                            ? 'bg-emerald-500'
                            : schoolPeriodContainers >= SCHOOL_CONTAINER_LIMIT * 0.8
                            ? 'bg-amber-500'
                            : 'bg-escola'
                        }`}
                        style={{
                          width: `${Math.min(100, SCHOOL_CONTAINER_LIMIT > 0 ? (schoolPeriodContainers / SCHOOL_CONTAINER_LIMIT) * 100 : 0)}%`
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Cota de referência: {studentCount} alunos × 80 = {SCHOOL_CONTAINER_LIMIT} emb. / quinzena
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            <div className="p-4 rounded-xl border border-dashed border-gray-300 text-gray-500 text-xs leading-relaxed space-y-3">
              <div>
                <p className="font-bold mb-1 text-gray-700">Materiais Aceitos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Garrafas PET (limpas)</li>
                  <li>Embalagens Tetra Pak</li>
                  <li>Alumínio (latas)</li>
                  <li>Plásticos em geral</li>
                  <li>Óleo de cozinha usado (embalagem PET)</li>
                </ul>
                <p className="mt-2 text-escola font-bold">ATENÇÃO: Todos os materiais devem estar limpos e secos.</p>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="font-bold mb-1 text-gray-700">Cota Coletiva da Escola ({currentFortnight.label}):</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    {studentCount > 0
                      ? `Cota base de ${SCHOOL_CONTAINER_LIMIT} embalagens (${studentCount} alunos × 80)`
                      : 'Cota base: N alunos × 80 embalagens'}
                  </li>
                  <li>
                    {studentCount > 0
                      ? `Cota base de ${SCHOOL_OIL_LIMIT}L de óleo (${studentCount} alunos × 4L)`
                      : 'Cota base: N alunos × 4L de óleo'}
                  </li>
                  <li>Alunos que trazem mais utilizam a cota dos que não participaram</li>
                  <li className="text-escola font-semibold">Lançamentos 100% liberados: o sistema nunca trava novas entregas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterDelivery;
