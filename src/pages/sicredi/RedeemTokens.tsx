import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Input, Button } from '../../components/ui';
import { CreditCard, Search, ArrowLeft, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { formatCpfCnpj } from '../../utils/formatters';

const RedeemTokens: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [vendor, setVendor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [quantity, setQuantity] = useState<number>(0);

  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 1) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
        .limit(5);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const searchVendors = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleSelectVendor = (selected: any) => {
    setVendor(selected);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    if (quantity <= 0) {
      setError('Por favor, informe uma quantidade válida de tokens.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Register redemption
      const { error: redemptionError } = await supabase
        .from('redemptions')
        .insert([{
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          quantity: quantity
        }]);

      if (redemptionError) throw redemptionError;

      // 2. Update vendor total
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ total_redeemed: (vendor.total_redeemed || 0) + quantity })
        .eq('id', vendor.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => navigate('/sicredi'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar resgate.');
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
        <h2 className="text-2xl font-bold text-gray-900">Resgate Confirmado!</h2>
        <p className="text-gray-500 font-medium">O comerciante recebeu o pagamento de <span className="text-sicredi font-bold">R$ {quantity.toFixed(2)}</span>.</p>
        <p className="text-sm text-gray-400">Redirecionando para o início...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/sicredi" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo Resgate de Tokens</h1>
      </div>

      {!vendor ? (
        <Card>
          <CardHeader title="Buscar Comerciante" subtitle="Pesquise por nome ou CPF/CNPJ" icon={Search} />
          <CardBody>
            <form onSubmit={searchVendors} className="flex gap-2">
              <div className="flex-1">
                <Input 
                  placeholder="Ex: Mercado Central ou 000.000.000-00" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  roleColor="sicredi"
                />
              </div>
              <Button type="submit" disabled={searching} roleColor="sicredi">
                {searching ? 'Buscando...' : 'Pesquisar'}
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-4 border rounded-lg divide-y overflow-hidden">
                {searchResults.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVendor(v)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{v.name}</p>
                      <p className="text-xs text-gray-500">CPF/CNPJ: {formatCpfCnpj(v.cpf)}</p>
                    </div>
                    <div className="bg-sicredi-light text-sicredi text-xs font-bold px-2 py-1 rounded">
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
              <CardHeader title="Detalhes da Operação" icon={CreditCard} iconColor="bg-sicredi-light text-sicredi" />
              <CardBody>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Comerciante Selecionado</p>
                    <p className="text-lg font-bold text-gray-900">{vendor.name}</p>
                    <p className="text-sm text-gray-500">CPF/CNPJ: {formatCpfCnpj(vendor.cpf)}</p>
                  </div>
                  <button 
                    onClick={() => setVendor(null)}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Alterar
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input 
                    label="Quantidade de Tokens Físicos" 
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    roleColor="sicredi"
                    placeholder="0"
                  />

                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={loading || quantity <= 0} 
                    className="w-full h-12 text-lg"
                    roleColor="sicredi"
                  >
                    {loading ? 'Confirmando...' : `Confirmar Pagamento de R$ ${quantity.toFixed(2)}`}
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-sicredi bg-sicredi-light bg-opacity-30">
              <CardHeader title="Resumo do Pagamento" />
              <CardBody className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Quantidade:</span>
                    <span className="text-gray-900 font-bold">{quantity} Ecotrocas</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Conversão:</span>
                    <span className="text-gray-900 font-bold">1:1</span>
                  </div>
                  <div className="pt-4 border-t border-sicredi border-opacity-20 flex justify-between items-center">
                    <span className="text-gray-900 font-bold">Total a Pagar:</span>
                    <span className="text-2xl font-black text-sicredi">R$ {quantity.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-sicredi border-opacity-20 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-sicredi mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Recolha os tokens físicos do comerciante antes de confirmar a operação no sistema.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedeemTokens;
