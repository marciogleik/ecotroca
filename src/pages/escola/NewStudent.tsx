import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Input, Button } from '../../components/ui';
import { UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NewStudent: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    enrollment: '',
    school: '',
    grade: '',
    guardian_name: '',
    guardian_phone: ''
  });
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { schoolId } = useAuth();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        setSchools(data || []);

        if (schoolId && data) {
          const mySchool = data.find(s => s.id === schoolId);
          if (mySchool) {
            setFormData(prev => ({ ...prev, school: mySchool.name }));
          }
        }
      } catch (err) {
        console.error('Error fetching schools:', err);
      }
    };

    fetchSchools();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('students')
        .insert([{
          name: formData.name,
          enrollment: formData.enrollment,
          school: formData.school,
          grade: formData.grade || null,
          guardian_name: formData.guardian_name || null,
          guardian_phone: formData.guardian_phone || null,
          ecotrocas: 0
        }]);

      if (insertError) {
        if (insertError.code === '23505') throw new Error('Esta matrícula já está cadastrada.');
        throw insertError;
      }

      setSuccess(true);
      setTimeout(() => navigate('/escola/alunos'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar aluno.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="bg-green-100 p-6 rounded-full">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Aluno Cadastrado com Sucesso!</h2>
        <p className="text-gray-500">Redirecionando para a lista de alunos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/escola/alunos" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Cadastrar Novo Aluno</h1>
      </div>

      <Card>
        <CardHeader title="Dados do Aluno" icon={UserPlus} iconColor="bg-escola-light text-escola" />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Bloco 1: Identificação */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identificação</p>
              <Input
                label="Nome Completo *"
                placeholder="Ex: João Silva"
                required
                value={formData.name}
                onChange={(e) => update('name', e.target.value)}
                roleColor="escola"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Matrícula / RA *"
                  placeholder="Número único"
                  required
                  value={formData.enrollment}
                  onChange={(e) => update('enrollment', e.target.value)}
                  roleColor="escola"
                />
                <Input
                  label="Série / Turma *"
                  placeholder="Ex: 5º Ano A"
                  required
                  value={formData.grade}
                  onChange={(e) => update('grade', e.target.value)}
                  roleColor="escola"
                />
              </div>

              {/* Escola — travada para usuários da escola, dropdown para outros */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Escola *</label>
                {schoolId ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                    <svg className="h-4 w-4 text-escola flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">{formData.school}</span>
                    <span className="ml-auto text-xs text-gray-400 italic">vinculado à sua escola</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formData.school}
                      onChange={(e) => update('school', e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-escola focus:border-escola sm:text-sm bg-white font-semibold text-slate-700 transition-all pr-8"
                      required
                    >
                      <option value="">-- Selecione uma Escola --</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Responsável */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Responsável</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Responsável *"
                  placeholder="Ex: Maria Silva"
                  required
                  value={formData.guardian_name}
                  onChange={(e) => update('guardian_name', e.target.value)}
                  roleColor="escola"
                />
                <Input
                  label="Telefone do Responsável *"
                  placeholder="(66) 99999-0000"
                  required
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={(e) => update('guardian_phone', e.target.value)}
                  roleColor="escola"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="pt-4 flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1" roleColor="escola">
                {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </Button>
              <Link to="/escola/alunos" className="flex-1">
                <Button type="button" variant="ghost" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default NewStudent;
