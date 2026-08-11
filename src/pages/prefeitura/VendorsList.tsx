import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, THead, TBody, Th, Td, Button, Input, LiveIndicator } from '../../components/ui';
import { Download, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCpfCnpj } from '../../utils/formatters';

const VendorsList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('vendors').select('*');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`);
      }

      const { data: result, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('prefeitura-vendors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ['Nome', 'CPF/CNPJ', 'Total Resgatado'];
    const csvRows = [
      headers.join(','),
      ...data.map(item => `"${item.name}","${item.cpf}",${item.total_redeemed}`)
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ecotroca_comerciantes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 items-start">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Comerciantes Parceiros</h1>
            <LiveIndicator />
          </div>
          <p className="text-gray-500 mt-1">Gerencie e monitore os estabelecimentos que aceitam EcoTrocas.</p>
        </div>
        <Button onClick={handleExportCSV} roleColor="prefeitura" disabled={data.length === 0}>
          <Download className="h-5 w-5 mr-2" />
          Exportar Lista
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                roleColor="prefeitura"
              />
            </div>
            <Button onClick={fetchData} roleColor="prefeitura" variant="secondary">
              <Search className="h-5 w-5 mr-2" />
              Buscar
            </Button>
          </div>

          <Table>
            <THead>
              <Th>Nome / Estabelecimento</Th>
              <Th>CPF/CNPJ</Th>
              <Th>Total Pago</Th>
            </THead>
            <TBody>
              {loading ? (
                <tr><Td colSpan={3} className="text-center py-8">Carregando...</Td></tr>
              ) : data.length === 0 ? (
                <tr><Td colSpan={3} className="text-center py-12 text-gray-500">Nenhum comerciante encontrado.</Td></tr>
              ) : data.map((item) => (
                <tr key={item.id}>
                  <Td className="font-semibold text-gray-900">{item.name}</Td>
                  <Td>{item.cpf ? formatCpfCnpj(item.cpf) : 'N/I'}</Td>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-bold text-prefeitura">{(item.total_redeemed || 0)} ET</span>
                      <span className="text-xs text-gray-500 font-medium">(R$ {(item.total_redeemed || 0).toFixed(2)})</span>
                    </div>
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
};

export default VendorsList;
