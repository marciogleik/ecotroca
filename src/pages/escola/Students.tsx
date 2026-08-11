import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, THead, TBody, Th, Td, Input, Button } from '../../components/ui';
import { Search, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Students: React.FC = () => {
  const { schoolId } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
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
                    <Link to={`/escola/entrega?studentId=${student.id}`} className="text-escola hover:text-escola-dark font-medium inline-flex items-center">
                      Registrar Entrega
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </Link>
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
    </div>
  );
};

export default Students;
