import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, THead, TBody, Th, Td, Input, Button } from '../../components/ui';
import { Search, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCpfCnpj } from '../../utils/formatters';

const SicrediHistory: React.FC = () => {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dailyTotal, setDailyTotal] = useState(0);

  useEffect(() => {
    fetchHistory();

    const channel = supabase
      .channel('sicredi-history-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions' }, () => fetchHistory())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('redemptions')
        .select(`
          id,
          vendor_id,
          vendor_name,
          quantity,
          created_at,
          vendors ( cpf )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('vendor_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setRedemptions(data || []);

      // Calculate Daily Total
      const today = new Date().toISOString().split('T')[0];
      const total = (data || []).reduce((acc, curr) => {
        const itemDate = curr.created_at.split('T')[0];
        if (itemDate === today) {
          return acc + curr.quantity;
        }
        return acc;
      }, 0);
      
      setDailyTotal(total);

    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Resgates</h1>
          <p className="text-gray-500">Acompanhe todos os pagamentos realizados aos comerciantes.</p>
        </div>
        
        {/* Total do Dia Card */}
        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-xl border border-sicredi border-opacity-20 shadow-sm">
          <div className="bg-sicredi-light p-3 rounded-lg text-sicredi">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Processado Hoje</p>
            <p className="text-2xl font-black text-sicredi">R$ {dailyTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input 
                placeholder="Buscar por nome do comerciante..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                roleColor="sicredi"
              />
            </div>
            <Button onClick={fetchHistory} roleColor="sicredi" variant="secondary">
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <Table>
            <THead>
              <Th>Data e Hora</Th>
              <Th>Comerciante</Th>
              <Th>CPF/CNPJ</Th>
              <Th>Valor Pago (R$)</Th>
            </THead>
            <TBody>
              {loading ? (
                <tr><Td colSpan={4} className="text-center py-8">Carregando...</Td></tr>
              ) : redemptions.map((item) => (
                <tr key={item.id}>
                  <Td>
                    {new Date(item.created_at).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Td>
                  <Td className="font-semibold text-gray-900">{item.vendor_name}</Td>
                  <Td>{item.vendors ? formatCpfCnpj(item.vendors.cpf) : 'N/A'}</Td>
                  <Td>
                    <span className="font-bold text-sicredi">R$ {item.quantity.toFixed(2)}</span>
                  </Td>
                </tr>
              ))}
              {!loading && redemptions.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-center py-12 text-gray-500">
                    Nenhum resgate encontrado.
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

export default SicrediHistory;
