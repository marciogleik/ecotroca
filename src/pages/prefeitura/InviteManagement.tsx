import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Button, Table, THead, TBody, Th, Td } from '../../components/ui';
import { Link2, Plus, Trash2, Copy, CheckCircle, Clock, School, Building, Coins, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'escola', label: 'Escola', icon: School, color: 'text-escola bg-escola-light' },
  { value: 'prefeitura', label: 'Prefeitura', icon: Building, color: 'text-prefeitura bg-prefeitura-light' },
  { value: 'sicredi', label: 'Sicredi', icon: Coins, color: 'text-sicredi bg-sicredi-light' },
];

const BASE_URL = window.location.origin;

function generateCode(length = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const InviteManagement: React.FC = () => {
  const [invites, setInvites] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formRole, setFormRole] = useState('escola');
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formExpires, setFormExpires] = useState('');

  useEffect(() => {
    fetchInvites();
    fetchSchools();
  }, []);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*, schools(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvites(data || []);
    } catch (err) {
      toast.error('Erro ao carregar convites');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    const { data } = await supabase.from('schools').select('id, name').order('name');
    setSchools(data || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRole === 'escola' && !formSchoolId) {
      toast.error('Selecione uma escola para este convite.');
      return;
    }
    setCreating(true);
    try {
      const code = generateCode(24);
      const schoolName = formRole === 'escola'
        ? schools.find(s => s.id === formSchoolId)?.name
        : null;

      const payload: any = {
        code,
        role: formRole,
        school_id: formRole === 'escola' ? formSchoolId : null,
        label: formLabel || (schoolName ? `Convite — ${schoolName}` : `Convite — ${ROLE_OPTIONS.find(r => r.value === formRole)?.label}`),
      };
      if (formExpires) {
        payload.expires_at = new Date(formExpires).toISOString();
      }

      const { error } = await supabase.from('invites').insert([payload]);
      if (error) throw error;

      toast.success('Convite criado com sucesso!');
      setShowForm(false);
      setFormRole('escola');
      setFormSchoolId('');
      setFormLabel('');
      setFormExpires('');
      fetchInvites();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar convite');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este convite? O link deixará de funcionar imediatamente.')) return;
    try {
      const { error } = await supabase.from('invites').delete().eq('id', id);
      if (error) throw error;
      toast.success('Convite removido.');
      fetchInvites();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover convite');
    }
  };

  const handleCopy = (code: string, id: string) => {
    const url = `${BASE_URL}/cadastro?key=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      toast.success('Link copiado!');
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const isExpired = (invite: any) => {
    if (!invite.expires_at) return false;
    return new Date(invite.expires_at) < new Date();
  };

  const getStatus = (invite: any) => {
    if (invite.used_at) return { label: 'Utilizado', color: 'bg-green-100 text-green-700' };
    if (isExpired(invite)) return { label: 'Expirado', color: 'bg-red-100 text-red-600' };
    return { label: 'Aguardando', color: 'bg-amber-100 text-amber-700' };
  };

  const getRoleInfo = (role: string) => ROLE_OPTIONS.find(r => r.value === role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Convites de Acesso</h1>
          <p className="text-gray-500">Gere e gerencie links privativos para cadastro de usuários no sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInvites} variant="secondary" roleColor="prefeitura">
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button onClick={() => setShowForm(true)} roleColor="prefeitura">
            <Plus className="h-5 w-5 mr-2" /> Novo Convite
          </Button>
        </div>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <Card className="border-prefeitura/20 bg-prefeitura/5">
          <CardHeader title="Criar Novo Convite" icon={Link2} iconColor="bg-prefeitura-light text-prefeitura" />
          <CardBody>
            <form onSubmit={handleCreate} className="space-y-5">

              {/* Perfil */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Perfil do Convite *</label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLE_OPTIONS.map(role => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => { setFormRole(role.value); setFormSchoolId(''); }}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                          formRole === role.value
                            ? 'border-prefeitura bg-prefeitura text-white shadow-md'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-prefeitura/40'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Escola — só aparece quando role = escola */}
              {formRole === 'escola' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Escola *</label>
                  <select
                    value={formSchoolId}
                    onChange={(e) => setFormSchoolId(e.target.value)}
                    required
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-prefeitura focus:border-prefeitura sm:text-sm bg-white font-semibold text-slate-700 transition-all"
                  >
                    <option value="">-- Selecione a escola --</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">O convite ficará vinculado a esta escola automaticamente.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Label / descrição */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Descrição do convite</label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="Ex: Convite para diretora da Guarujá"
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-prefeitura focus:border-prefeitura sm:text-sm bg-white transition-all"
                  />
                </div>

                {/* Data de expiração */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Expira em (opcional)</label>
                  <input
                    type="datetime-local"
                    value={formExpires}
                    onChange={(e) => setFormExpires(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-prefeitura focus:border-prefeitura sm:text-sm bg-white transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">Se vazio, o link não expira.</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating} roleColor="prefeitura">
                  {creating ? 'Gerando...' : 'Gerar Link de Convite'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Tabela de convites */}
      <Card>
        <CardBody>
          {loading ? (
            <p className="text-center py-8 text-gray-400">Carregando convites...</p>
          ) : invites.length === 0 ? (
            <div className="text-center py-14 space-y-3">
              <Link2 className="h-12 w-12 text-gray-200 mx-auto" />
              <p className="text-gray-500 font-medium">Nenhum convite criado ainda.</p>
              <p className="text-sm text-gray-400">Crie o primeiro convite para liberar acesso ao sistema.</p>
            </div>
          ) : (
            <Table>
              <THead>
                <Th>Descrição</Th>
                <Th>Perfil</Th>
                <Th>Escola</Th>
                <Th>Status</Th>
                <Th>Expira em</Th>
                <Th className="text-right">Ações</Th>
              </THead>
              <TBody>
                {invites.map(invite => {
                  const status = getStatus(invite);
                  const roleInfo = getRoleInfo(invite.role);
                  const RoleIcon = roleInfo?.icon || Link2;
                  const isUsed = !!invite.used_at;
                  const expired = isExpired(invite);

                  return (
                    <tr key={invite.id} className={`hover:bg-gray-50 transition-colors ${(isUsed || expired) ? 'opacity-60' : ''}`}>
                      <Td>
                        <p className="font-semibold text-gray-800 text-sm">{invite.label || '—'}</p>
                        {invite.used_by_email && (
                          <p className="text-xs text-gray-400 mt-0.5">Usado por: {invite.used_by_email}</p>
                        )}
                        <p className="text-[10px] text-gray-300 font-mono mt-0.5 truncate max-w-[160px]">{invite.code}</p>
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${roleInfo?.color}`}>
                          <RoleIcon className="h-3 w-3" />
                          {roleInfo?.label}
                        </span>
                      </Td>
                      <Td>
                        {invite.schools?.name
                          ? <span className="text-sm font-medium text-gray-700">{invite.schools.name}</span>
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${status.color}`}>
                          {isUsed
                            ? <CheckCircle className="h-3 w-3" />
                            : <Clock className="h-3 w-3" />
                          }
                          {status.label}
                        </span>
                        {invite.used_at && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(invite.used_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </Td>
                      <Td>
                        {invite.expires_at
                          ? <span className="text-xs text-gray-600">{new Date(invite.expires_at).toLocaleDateString('pt-BR')}</span>
                          : <span className="text-xs text-gray-400">Sem expiração</span>
                        }
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          {!isUsed && !expired && (
                            <button
                              onClick={() => handleCopy(invite.code, invite.id)}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-prefeitura/10 text-prefeitura hover:bg-prefeitura/20 transition-colors"
                              title="Copiar link de convite"
                            >
                              {copiedId === invite.id
                                ? <><CheckCircle className="h-3.5 w-3.5" /> Copiado!</>
                                : <><Copy className="h-3.5 w-3.5" /> Copiar Link</>
                              }
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(invite.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover convite"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default InviteManagement;
