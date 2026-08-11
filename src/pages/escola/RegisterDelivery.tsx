import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Input, Button } from '../../components/ui';
import { PlusCircle, Search, ArrowLeft, CheckCircle, Calculator, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { subDays } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

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

  // Pool coletivo da escola por quinzena (N alunos × 80 emb. / N alunos × 4L)
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
      if (searchTerm.length >= 1) performSearch();
      else setSearchResults([]);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

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
    const start = subDays(new Date(), 15).toISOString();

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
      .gte('created_at', start);

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
    setSearching(true);
    try {
      let query = supabase
        .from('students')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,enrollment.ilike.%${searchTerm}%`)
        .limit(5);

      // Filtra apenas alunos desta escola
      if (schoolName) {
        query = query.eq('school', schoolName);
      }

      const { data, error } = await query;
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
                            ? 'text-red-500'
                            : 'text-escola'
                        }`}>
                          (pool da escola: {schoolPeriodContainers + totalContainers}/{SCHOOL_CONTAINER_LIMIT})
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
                        ? `Pool óleo da escola: ${schoolPeriodOil + oilLiters}/${SCHOOL_OIL_LIMIT}L (${studentCount} alunos × ${MAX_OIL_FORTNIGHT}L)`
                        : 'Máximo 4L por aluno por quinzena'}
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
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-sm text-yellow-700">
                      {isContainersOverLimit
                        ? `Aviso: A quantidade excede o pool quinzenal da escola (${schoolPeriodContainers + totalContainers} de ${SCHOOL_CONTAINER_LIMIT} embalagens). O lançamento será registrado normalmente.`
                        : `Aviso: A quantidade de óleo excede o pool quinzenal da escola (${schoolPeriodOil + oilLiters}L de ${SCHOOL_OIL_LIMIT}L). O lançamento será registrado normalmente.`
                      }
                    </div>
                  )}

                  {schoolBalance !== null && schoolBalance < 10 && (
                    <div className={`border-l-4 p-4 rounded text-sm flex items-start gap-2 ${
                      schoolBalance <= 0
                        ? 'bg-amber-50 border-amber-400 text-amber-800'
                        : 'bg-yellow-50 border-yellow-400 text-yellow-700'
                    }`}>
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        {schoolBalance <= 0 ? (
                          <>
                            <p className="font-semibold">Cédulas pendentes de reposição</p>
                            <p className="mt-0.5">A escola já distribuiu {Math.abs(schoolBalance)} ET além do estoque físico. O lançamento será registrado normalmente — solicite a reposição à Prefeitura.</p>
                          </>
                        ) : (
                          <p>Saldo baixo ({schoolBalance} ET). Solicite reposição à Prefeitura em breve.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || (totalContainers === 0 && oilLiters === 0)}  /* saldo negativo é permitido */
                    className="w-full h-12 text-lg"
                    roleColor="escola"
                  >
                    {loading ? 'Processando...' : `Confirmar e Gerar ${calculatedET} Ecotrocas`}
                  </Button>
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
                  <div className="p-3 bg-white rounded-lg border border-escola border-opacity-20 space-y-2">
                    <p className="text-xs font-bold text-gray-700">🏫 Pool Quinzenal da Escola</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Embalagens usadas</span>
                      <span className={`font-bold ${
                        schoolPeriodContainers >= SCHOOL_CONTAINER_LIMIT ? 'text-red-600' : 'text-escola'
                      }`}>
                        {schoolPeriodContainers} / {SCHOOL_CONTAINER_LIMIT}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          schoolPeriodContainers >= SCHOOL_CONTAINER_LIMIT
                            ? 'bg-red-500'
                            : schoolPeriodContainers >= SCHOOL_CONTAINER_LIMIT * 0.8
                            ? 'bg-yellow-500'
                            : 'bg-escola'
                        }`}
                        style={{
                          width: `${Math.min(100, SCHOOL_CONTAINER_LIMIT > 0 ? (schoolPeriodContainers / SCHOOL_CONTAINER_LIMIT) * 100 : 0)}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{studentCount} alunos × 80 = {SCHOOL_CONTAINER_LIMIT} emb./quinzena</p>
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
                <p className="font-bold mb-1 text-gray-700">Limites Quinzenais (pool da escola):</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    {studentCount > 0
                      ? `Máx. ${SCHOOL_CONTAINER_LIMIT} embalagens (${studentCount} alunos × 80)`
                      : 'Máx. N alunos × 80 embalagens'}
                  </li>
                  <li>
                    {studentCount > 0
                      ? `Máx. ${SCHOOL_OIL_LIMIT}L de óleo (${studentCount} alunos × 4L)`
                      : 'Máx. N alunos × 4L de óleo'}
                  </li>
                  <li>Apenas números inteiros de ET são gerados</li>
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
