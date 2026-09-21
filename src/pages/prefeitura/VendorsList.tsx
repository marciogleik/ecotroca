import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, THead, TBody, Th, Td, Button, Input, LiveIndicator, StatCard } from '../../components/ui';
import { 
  Download, 
  Search, 
  Calendar, 
  Coins, 
  Store, 
  History, 
  Receipt, 
  X, 
  RotateCcw,
  Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCpfCnpj } from '../../utils/formatters';

interface Vendor {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  address?: string;
  total_redeemed: number;
  created_at?: string;
  last_redemption_at?: string | null;
  last_redemption_amount?: number | null;
  redemptions_count?: number;
}

interface Redemption {
  id: string;
  vendor_id: string;
  vendor_name: string;
  quantity: number;
  created_at: string;
  vendors?: {
    id?: string;
    cpf?: string;
    phone?: string;
    address?: string;
  } | null;
}

const VendorsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'redemptions' | 'vendors'>('redemptions');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal de Extrato Individual
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vendorsRes, redemptionsRes] = await Promise.all([
        supabase.from('vendors').select('*').order('name', { ascending: true }),
        supabase
          .from('redemptions')
          .select(`
            id,
            vendor_id,
            vendor_name,
            quantity,
            created_at,
            vendors (
              id,
              cpf,
              phone,
              address
            )
          `)
          .order('created_at', { ascending: false })
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (redemptionsRes.error) throw redemptionsRes.error;

      const rawRedemptions = (redemptionsRes.data || []) as unknown as Redemption[];
      const rawVendors = (vendorsRes.data || []) as Vendor[];

      // Mapear para cada feirante a última data de retirada e quantidade de trocas
      const enrichedVendors = rawVendors.map(vendor => {
        const vendorRedemptions = rawRedemptions.filter(r => r.vendor_id === vendor.id);
        const lastRedemption = vendorRedemptions[0]; // Já ordenado por created_at desc

        return {
          ...vendor,
          last_redemption_at: lastRedemption ? lastRedemption.created_at : null,
          last_redemption_amount: lastRedemption ? lastRedemption.quantity : null,
          redemptions_count: vendorRedemptions.length
        };
      });

      setVendors(enrichedVendors);
      setRedemptions(rawRedemptions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Inscrever para atualizações em tempo real das duas tabelas
    const channel = supabase
      .channel('prefeitura-vendors-redemptions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Nunca trocou';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Filtros aplicados na lista de resgates
  const filteredRedemptions = redemptions.filter(item => {
    const matchesSearch = !searchTerm || 
      item.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.vendors?.cpf && item.vendors.cpf.includes(searchTerm));

    const itemDate = item.created_at ? item.created_at.split('T')[0] : '';
    const matchesDateFrom = !dateFrom || itemDate >= dateFrom;
    const matchesDateTo = !dateTo || itemDate <= dateTo;

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Filtros aplicados na lista de feirantes
  const filteredVendors = vendors.filter(item => {
    return !searchTerm ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cpf && item.cpf.includes(searchTerm));
  });

  // Métricas gerais
  const totalRedeemedAmount = redemptions.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalOperationsCount = redemptions.length;
  const distinctVendorsCount = new Set(redemptions.map(r => r.vendor_id || r.vendor_name)).size;

  // Resgates do feirante selecionado para o modal
  const selectedVendorRedemptions = selectedVendor 
    ? redemptions.filter(r => r.vendor_id === selectedVendor.id)
    : [];

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  // Exportar CSV de Resgates no Sicredi
  const handleExportRedemptionsCSV = () => {
    if (filteredRedemptions.length === 0) return;

    const headers = ['Data', 'Hora', 'Feirante', 'CPF/CNPJ', 'EcoTrocas (ET)', 'Valor Pago (R$)'];
    const csvRows = [
      headers.join(';'),
      ...filteredRedemptions.map(item => {
        const dateObj = new Date(item.created_at);
        const dataStr = dateObj.toLocaleDateString('pt-BR');
        const horaStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const cpfStr = item.vendors?.cpf ? formatCpfCnpj(item.vendors.cpf) : 'N/I';
        const valor = (item.quantity || 0).toFixed(2).replace('.', ',');
        return `"${dataStr}";"${horaStr}";"${item.vendor_name}";"${cpfStr}";${item.quantity};"${valor}"`;
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sicredi_retiradas_feirantes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar CSV de Feirantes Cadastrados
  const handleExportVendorsCSV = () => {
    if (filteredVendors.length === 0) return;

    const headers = ['Nome / Estabelecimento', 'CPF/CNPJ', 'Total Resgatado (ET)', 'Total Pago (R$)', 'Última Troca', 'Qtd de Trocas'];
    const csvRows = [
      headers.join(';'),
      ...filteredVendors.map(v => {
        const cpfStr = v.cpf ? formatCpfCnpj(v.cpf) : 'N/I';
        const valorTotal = (v.total_redeemed || 0).toFixed(2).replace('.', ',');
        const ultimaTroca = v.last_redemption_at ? formatDateTime(v.last_redemption_at) : 'Nenhuma';
        return `"${v.name}";"${cpfStr}";${v.total_redeemed || 0};"${valorTotal}";"${ultimaTroca}";${v.redemptions_count || 0}`;
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `feirantes_parceiros_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar Extrato Individual
  const handleExportSingleVendorCSV = () => {
    if (!selectedVendor || selectedVendorRedemptions.length === 0) return;

    const headers = ['Data', 'Hora', 'Feirante', 'Quantidade (ET)', 'Valor Recebido (R$)'];
    const csvRows = [
      headers.join(';'),
      ...selectedVendorRedemptions.map(item => {
        const dateObj = new Date(item.created_at);
        const dataStr = dateObj.toLocaleDateString('pt-BR');
        const horaStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const valor = (item.quantity || 0).toFixed(2).replace('.', ',');
        return `"${dataStr}";"${horaStr}";"${item.vendor_name}";${item.quantity};"${valor}"`;
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_sicredi_${selectedVendor.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 items-start">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Feirantes & Retiradas no Sicredi
            </h1>
            <LiveIndicator />
          </div>
          <p className="text-gray-500 mt-1">
            Monitore quais feirantes trocaram tokens no Sicredi, as datas exatas das retiradas e os valores pagos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'redemptions' ? (
            <Button 
              onClick={handleExportRedemptionsCSV} 
              roleColor="prefeitura" 
              disabled={filteredRedemptions.length === 0}
            >
              <Download className="h-5 w-5 mr-2" />
              Exportar Retiradas
            </Button>
          ) : (
            <Button 
              onClick={handleExportVendorsCSV} 
              roleColor="prefeitura" 
              disabled={filteredVendors.length === 0}
            >
              <Download className="h-5 w-5 mr-2" />
              Exportar Feirantes
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Métricas em Destaque */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Total Pago aos Feirantes no Sicredi"
          value={`R$ ${totalRedeemedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${totalRedeemedAmount.toLocaleString('pt-BR')} EcoTrocas resgatadas`}
          icon={Coins}
          roleColor="prefeitura"
        />
        <StatCard
          label="Operações de Troca Realizadas"
          value={totalOperationsCount}
          subtitle="Trocas registradas na agência Sicredi"
          icon={History}
          roleColor="prefeitura"
        />
        <StatCard
          label="Feirantes que já Retiraram"
          value={`${distinctVendorsCount} de ${vendors.length}`}
          subtitle="Feirantes parceiros cadastrados"
          icon={Store}
          roleColor="prefeitura"
        />
      </div>

      {/* Abas de Navegação */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('redemptions')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'redemptions'
              ? 'border-prefeitura text-prefeitura bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <History className="h-4 w-4" />
          Histórico de Retiradas no Sicredi
          <span className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-semibold ${
            activeTab === 'redemptions' ? 'bg-prefeitura text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {redemptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'vendors'
              ? 'border-prefeitura text-prefeitura bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Store className="h-4 w-4" />
          Feirantes Cadastrados
          <span className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-semibold ${
            activeTab === 'vendors' ? 'bg-prefeitura text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {vendors.length}
          </span>
        </button>
      </div>

      {/* Filtros e Barra de Pesquisa */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Buscar por Feirante ou Documento
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Nome do feirante, CPF ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  roleColor="prefeitura"
                />
              </div>
            </div>

            {activeTab === 'redemptions' && (
              <>
                <div className="w-full md:w-44">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prefeitura focus:border-prefeitura bg-white"
                  />
                </div>

                <div className="w-full md:w-44">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prefeitura focus:border-prefeitura bg-white"
                  />
                </div>
              </>
            )}

            {(searchTerm || dateFrom || dateTo) && (
              <Button 
                onClick={handleClearFilters} 
                variant="outline" 
                roleColor="prefeitura"
                className="whitespace-nowrap h-[38px]"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Conteúdo da Aba 1: Histórico de Retiradas no Sicredi */}
      {activeTab === 'redemptions' && (
        <Card>
          <CardBody className="p-0">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-prefeitura" />
                  Registro Detalhado de Trocas Realizadas no Sicredi
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Visualização de cada feirante e a respectiva data e hora da troca de tokens.
                </p>
              </div>
              <div className="text-xs font-medium text-gray-500">
                Mostrando <strong className="text-gray-900">{filteredRedemptions.length}</strong> de {redemptions.length} trocas
              </div>
            </div>

            <Table>
              <THead>
                <Th>Data e Hora da Troca</Th>
                <Th>Feirante / Comerciante</Th>
                <Th>CPF/CNPJ</Th>
                <Th>Valor Retirado (Pago)</Th>
                <Th className="text-right">Ação</Th>
              </THead>
              <TBody>
                {loading ? (
                  <tr>
                    <Td colSpan={5} className="text-center py-12 text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-prefeitura border-t-transparent animate-spin" />
                        Carregando retiradas do Sicredi...
                      </div>
                    </Td>
                  </tr>
                ) : filteredRedemptions.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="text-center py-14 text-gray-500">
                      <Receipt className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-700">Nenhuma retirada encontrada.</p>
                      <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros de busca ou período de datas.</p>
                    </Td>
                  </tr>
                ) : (
                  filteredRedemptions.map((item) => {
                    const matchedVendor = vendors.find(v => v.id === item.vendor_id || v.name.toLowerCase() === item.vendor_name.toLowerCase());
                    const dateObj = new Date(item.created_at);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-emerald-50 text-prefeitura">
                              <Clock className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">
                                {dateObj.toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-xs text-gray-500">
                                às {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </Td>

                        <Td>
                          <div>
                            <p className="font-bold text-gray-900 leading-snug">
                              {item.vendor_name}
                            </p>
                            {matchedVendor?.phone && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Tel: {matchedVendor.phone}
                              </p>
                            )}
                          </div>
                        </Td>

                        <Td>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 font-mono">
                            {item.vendors?.cpf ? formatCpfCnpj(item.vendors.cpf) : matchedVendor?.cpf ? formatCpfCnpj(matchedVendor.cpf) : 'N/I'}
                          </span>
                        </Td>

                        <Td>
                          <div className="flex flex-col">
                            <span className="font-bold text-prefeitura text-base">
                              R$ {(item.quantity || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">
                              {(item.quantity || 0)} EcoTrocas (ET)
                            </span>
                          </div>
                        </Td>

                        <Td className="text-right">
                          <button
                            onClick={() => {
                              if (matchedVendor) {
                                setSelectedVendor(matchedVendor);
                              } else {
                                setSelectedVendor({
                                  id: item.vendor_id,
                                  name: item.vendor_name,
                                  cpf: item.vendors?.cpf,
                                  total_redeemed: item.quantity
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-prefeitura transition-colors"
                            title="Ver todo o extrato deste feirante"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            Extrato
                          </button>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Conteúdo da Aba 2: Feirantes Cadastrados */}
      {activeTab === 'vendors' && (
        <Card>
          <CardBody className="p-0">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Store className="h-4 w-4 text-prefeitura" />
                  Relação de Comerciantes e Feirantes Cadastrados
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Acompanhe a data da última troca realizada e o total histórico de cada feirante.
                </p>
              </div>
              <div className="text-xs font-medium text-gray-500">
                Mostrando <strong className="text-gray-900">{filteredVendors.length}</strong> de {vendors.length} feirantes
              </div>
            </div>

            <Table>
              <THead>
                <Th>Nome / Estabelecimento</Th>
                <Th>CPF/CNPJ</Th>
                <Th>Última Troca no Sicredi</Th>
                <Th>Total Resgatado</Th>
                <Th className="text-right">Ação</Th>
              </THead>
              <TBody>
                {loading ? (
                  <tr>
                    <Td colSpan={5} className="text-center py-12 text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-prefeitura border-t-transparent animate-spin" />
                        Carregando feirantes...
                      </div>
                    </Td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="text-center py-12 text-gray-500">
                      Nenhum comerciante encontrado.
                    </Td>
                  </tr>
                ) : (
                  filteredVendors.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <Td>
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          {item.address && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{item.address}</p>
                          )}
                        </div>
                      </Td>

                      <Td>
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {item.cpf ? formatCpfCnpj(item.cpf) : 'N/I'}
                        </span>
                      </Td>

                      <Td>
                        {item.last_redemption_at ? (
                          <div>
                            <p className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-prefeitura" />
                              {formatDateTime(item.last_redemption_at)}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Último valor: R$ {(item.last_redemption_amount || 0).toFixed(2)} ({item.redemptions_count} {item.redemptions_count === 1 ? 'troca' : 'trocas'})
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Nenhuma retirada realizada
                          </span>
                        )}
                      </Td>

                      <Td>
                        <div className="flex flex-col">
                          <span className="font-bold text-prefeitura text-sm">
                            {(item.total_redeemed || 0).toLocaleString('pt-BR')} ET
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            R$ {(item.total_redeemed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </Td>

                      <Td className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          roleColor="prefeitura"
                          onClick={() => setSelectedVendor(item)}
                        >
                          <Receipt className="h-3.5 w-3.5 mr-1.5" />
                          Ver Extrato
                        </Button>
                      </Td>
                    </tr>
                  ))
                )}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* ────────────────────── MODAL DE EXTRATO INDIVIDUAL DO FEIRANTE ────────────────────── */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-prefeitura rounded-xl">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Extrato de Retiradas no Sicredi</h3>
                  <p className="text-xs text-gray-500">Histórico de todas as trocas efetuadas por este feirante.</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVendor(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Informações do Feirante */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm">
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Feirante</p>
                <p className="font-bold text-gray-900 text-base">{selectedVendor.name}</p>
                <p className="text-xs text-gray-600 font-mono mt-0.5">
                  CPF/CNPJ: {selectedVendor.cpf ? formatCpfCnpj(selectedVendor.cpf) : 'Não informado'}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Retirado</p>
                <p className="font-bold text-prefeitura text-lg">
                  R$ {(selectedVendor.total_redeemed || selectedVendorRedemptions.reduce((a, c) => a + c.quantity, 0)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedVendorRedemptions.length} {selectedVendorRedemptions.length === 1 ? 'operação' : 'operações'} no Sicredi
                </p>
              </div>
            </div>

            {/* Tabela de Retiradas Individuais com Scroll */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl">
              <Table>
                <THead>
                  <Th>Data e Hora da Troca</Th>
                  <Th>Tokens (ET)</Th>
                  <Th className="text-right">Valor Recebido (R$)</Th>
                </THead>
                <TBody>
                  {selectedVendorRedemptions.length === 0 ? (
                    <tr>
                      <Td colSpan={3} className="text-center py-10 text-gray-400 italic">
                        Nenhuma troca registrada para este feirante no Sicredi até o momento.
                      </Td>
                    </tr>
                  ) : (
                    selectedVendorRedemptions.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <Td className="font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-prefeitura" />
                            {formatDateTime(r.created_at)}
                          </div>
                        </Td>
                        <Td>
                          <span className="font-semibold text-gray-700">{r.quantity} ET</span>
                        </Td>
                        <Td className="text-right font-bold text-prefeitura">
                          R$ {(r.quantity || 0).toFixed(2)}
                        </Td>
                      </tr>
                    ))
                  )}
                </TBody>
              </Table>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSingleVendorCSV}
                disabled={selectedVendorRedemptions.length === 0}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Baixar Extrato (CSV)
              </Button>

              <Button
                roleColor="prefeitura"
                onClick={() => setSelectedVendor(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsList;
