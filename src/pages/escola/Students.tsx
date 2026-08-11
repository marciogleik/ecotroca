import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, THead, TBody, Th, Td, Input, Button } from '../../components/ui';
import { Search, Plus, ExternalLink, Trash2, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Students: React.FC = () => {
  const { schoolId } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  // Modal de exclusão
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Busca o nome da escola do usuário logado
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
    if (schoolName === null) return; // aguarda o nome da escola carregar
    fetchStudents();

    const channel = supabase
      .channel('escola-students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchStudents())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolName]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select('*')
        .eq('school', schoolName ?? '')   // filtra apenas alunos desta escola
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,enrollment.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      // 1. Exclui entregas vinculadas ao aluno (se houver)
      await supabase
        .from('deliveries')
        .delete()
        .eq('student_id', studentToDelete.id);

      // 2. Exclui o cadastro do aluno
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete.id);

      if (error) throw error;

      setDeleteSuccess(`Aluno(a) "${studentToDelete.name}" foi excluído(a) com sucesso.`);
      setStudentToDelete(null);
      fetchStudents();

      setTimeout(() => {
        setDeleteSuccess(null);
      }, 4000);
    } catch (err: any) {
      console.error('Error deleting student:', err);
      alert(`Erro ao excluir aluno: ${err.message || 'Tente novamente.'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Sucesso */}
      {deleteSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <span>✅ {deleteSuccess}</span>
          <button onClick={() => setDeleteSuccess(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos Cadastrados</h1>
          <p className="text-gray-500">Gerencie os alunos e acompanhe seus saldos de Ecotrocas.</p>
        </div>
        <Link to="/escola/novo-aluno">
          <Button roleColor="escola">
            <Plus className="h-5 w-5 mr-2" />
            Cadastrar Novo Aluno
          </Button>
        </Link>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                roleColor="escola"
                className="w-full"
              />
            </div>
            <Button type="submit" roleColor="escola" variant="secondary">
              <Search className="h-5 w-5 mr-2" />
              Buscar
            </Button>
          </form>

          <Table>
            <THead>
              <Th>Nome</Th>
              <Th>Matrícula</Th>
              <Th>Escola</Th>
              <Th>Saldo Atual</Th>
              <Th className="text-right">Ações</Th>
            </THead>
            <TBody>
              {loading ? (
                <tr><Td colSpan={6} className="text-center py-8">Carregando...</Td></tr>
              ) : students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <Td className="font-semibold text-gray-900">{student.name}</Td>
                  <Td>{student.enrollment}</Td>
                  <Td>{student.school}</Td>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-bold text-escola">{student.ecotrocas} Ecotrocas</span>
                      <span className="text-xs text-gray-500">(R$ {student.ecotrocas.toFixed(2)})</span>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link 
                        to={`/escola/entrega?studentId=${student.id}`} 
                        className="text-escola hover:text-escola-dark font-medium inline-flex items-center text-sm"
                      >
                        Registrar Entrega
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setStudentToDelete(student)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir aluno"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {!loading && students.length === 0 && (
                <tr>
                  <Td colSpan={6} className="text-center py-12 text-gray-500">
                    Nenhum aluno encontrado.
                  </Td>
                </tr>
              )}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      {/* ────────────────────── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ────────────────────── */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Excluir Cadastro do Aluno</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-1">
              <p><strong>Aluno:</strong> {studentToDelete.name}</p>
              <p><strong>Matrícula:</strong> {studentToDelete.enrollment || 'Não informada'}</p>
              <p><strong>Escola:</strong> {studentToDelete.school}</p>
              <p className="text-xs text-amber-700 font-semibold mt-2">
                ⚠️ O cadastro do aluno e seu histórico de lançamentos serão removidos do sistema.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStudentToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                roleColor="prefeitura"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir Aluno'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;

