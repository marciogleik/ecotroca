import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, THead, TBody, Th, Td, Input, Button, CardHeader } from '../../components/ui';
import { Search, Plus, UserCheck, X, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCpfCnpj } from '../../utils/formatters';

interface VendorForm {
  name: string;
  cpf: string;
  phone: string;
  address: string;
  products: string;
}

const emptyForm: VendorForm = { name: '', cpf: '', phone: '', address: '', products: '' };

const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newVendor, setNewVendor] = useState<VendorForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();

    const channel = supabase
      .channel('sicredi-vendors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => fetchVendors())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: keyof VendorForm, value: string) =>
    setNewVendor(prev => ({ ...prev, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: newVendor.name,
        cpf: newVendor.cpf,
        phone: newVendor.phone || null,
        address: newVendor.address || null,
        products: newVendor.products || null,
      };

      if (editingVendor) {
        const { error: updateError } = await supabase
          .from('vendors')
          .update(payload)
          .eq('id', editingVendor.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('vendors')
          .insert([{ ...payload, total_redeemed: 0 }]);

        if (insertError) throw insertError;
      }

      setNewVendor(emptyForm);
      setEditingVendor(null);
      setShowForm(false);
      fetchVendors();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar feirante/associação.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (vendor: any) => {
    setEditingVendor(vendor);
    setNewVendor({
      name: vendor.name || '',
      cpf: vendor.cpf || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      products: vendor.products || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este feirante/associação?')) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      fetchVendors();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVendor(null);
    setNewVendor(emptyForm);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feirantes e Associações</h1>
          <p className="text-gray-500">Gerencie os participantes credenciados que aceitam Ecotrocas.</p>
        </div>
        <Button onClick={() => setShowForm(true)} roleColor="sicredi">
          <Plus className="h-5 w-5 mr-2" />
          Novo Credenciado
        </Button>
      </div>

      {showForm && (
        <Card className="border-sicredi">
          <CardHeader
            title={editingVendor ? 'Editar Credenciado' : 'Cadastrar Feirante / Associação'}
            icon={UserCheck}
            iconColor="bg-sicredi-light text-sicredi"
          />
          <CardBody>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Linha 1: Nome + CPF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome / Estabelecimento *"
                  placeholder="Ex: Barraca do Zé ou AFAB"
                  required
                  value={newVendor.name}
                  onChange={(e) => update('name', e.target.value)}
                  roleColor="sicredi"
                />
                <Input
                  label="CPF / CNPJ *"
                  placeholder="000.000.000-00"
                  required
                  value={newVendor.cpf}
                  onChange={(e) => update('cpf', formatCpfCnpj(e.target.value))}
                  roleColor="sicredi"
                />
              </div>

              {/* Linha 2: Telefone + Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Telefone *"
                  placeholder="(66) 99999-0000"
                  required
                  type="tel"
                  value={newVendor.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  roleColor="sicredi"
                />
                <Input
                  label="Endereço *"
                  placeholder="Rua, número, bairro"
                  required
                  value={newVendor.address}
                  onChange={(e) => update('address', e.target.value)}
                  roleColor="sicredi"
                />
              </div>

              {/* Linha 3: Produtos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Produtos Comercializados *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Frutas, verduras, legumes, panificados caseiros..."
                  value={newVendor.products}
                  onChange={(e) => update('products', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-sicredi focus:border-sicredi sm:text-sm bg-white transition-all resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button type="submit" disabled={saving} roleColor="sicredi">
                  {saving ? 'Salvando...' : editingVendor ? 'Salvar Alterações' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                roleColor="sicredi"
              />
            </div>
            <Button onClick={fetchVendors} roleColor="sicredi" variant="secondary">
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <Table>
            <THead>
              <Th>Nome / Estabelecimento</Th>
              <Th>CPF/CNPJ</Th>
              <Th>Telefone</Th>
              <Th>Produtos</Th>
              <Th>Total Resgatado</Th>
              <Th className="text-right">Ações</Th>
            </THead>
            <TBody>
              {loading ? (
                <tr><Td colSpan={6} className="text-center py-8">Carregando...</Td></tr>
              ) : vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <Td>
                    <div>
                      <p className="font-semibold text-gray-900">{vendor.name}</p>
                      {vendor.address && <p className="text-xs text-gray-400">{vendor.address}</p>}
                    </div>
                  </Td>
                  <Td>{formatCpfCnpj(vendor.cpf)}</Td>
                  <Td>{vendor.phone || <span className="text-gray-400 text-xs">—</span>}</Td>
                  <Td>
                    <p className="text-xs text-gray-600 max-w-[180px] truncate" title={vendor.products || ''}>
                      {vendor.products || <span className="text-gray-400">—</span>}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-bold text-sicredi">{vendor.total_redeemed} ET</span>
                      <span className="text-xs text-gray-500">(R$ {vendor.total_redeemed.toFixed(2)})</span>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {!loading && vendors.length === 0 && (
                <tr>
                  <Td colSpan={6} className="text-center py-12 text-gray-500">
                    Nenhum feirante ou associação encontrado.
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

export default Vendors;
