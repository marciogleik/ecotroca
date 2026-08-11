import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '../../components/ui';
import { Recycle, Droplets, Leaf, Waves, Wind, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EnvironmentalImpact: React.FC = () => {
  const [data, setData] = useState({
    containers: 0,
    oil: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: deliveries } = await supabase.from('deliveries').select('containers, oil_liters');
      const totalContainers = deliveries?.reduce((acc, curr) => acc + (curr.containers || 0), 0) || 0;
      const totalOil = deliveries?.reduce((acc, curr) => acc + (Number(curr.oil_liters) || 0), 0) || 0;
      setData({ containers: totalContainers, oil: totalOil });
      setLoading(false);
    };
    fetchData();
  }, []);

  // Constants for estimation
  const KG_PER_CONTAINER = 0.02; // 20g
  const WATER_PROTECTED_PER_LITER_OIL = 25000; // 25,000 liters
  const CO2_SAVED_PER_KG_PLASTIC = 1.5; // kg of CO2

  const totalKg = data.containers * KG_PER_CONTAINER;
  const totalWaterProtected = data.oil * WATER_PROTECTED_PER_LITER_OIL;
  const totalCO2 = totalKg * CO2_SAVED_PER_KG_PLASTIC;

  if (loading) return <div>Carregando impacto...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Impacto Ambiental</h1>
        <p className="text-gray-500">Estimativas dos benefícios ecológicos gerados pelo programa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Recycle className="h-6 w-6" />
            </div>
            <span className="font-bold uppercase tracking-wider text-xs opacity-80">Recicláveis</span>
          </div>
          <p className="text-4xl font-black mb-1">{totalKg.toFixed(1)} kg</p>
          <p className="text-sm opacity-90">de resíduos desviados de aterros sanitários.</p>
        </div>

        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Droplets className="h-6 w-6" />
            </div>
            <span className="font-bold uppercase tracking-wider text-xs opacity-80">Óleo Vegetal</span>
          </div>
          <p className="text-4xl font-black mb-1">{data.oil.toFixed(1)} L</p>
          <p className="text-sm opacity-90">de óleo coletado e destinado corretamente.</p>
        </div>

        <div className="bg-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Leaf className="h-6 w-6" />
            </div>
            <span className="font-bold uppercase tracking-wider text-xs opacity-80">Natureza</span>
          </div>
          <p className="text-4xl font-black mb-1">{data.containers}</p>
          <p className="text-sm opacity-90">recipientes que deixaram de poluir a cidade.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader title="Equivalências Ecológicas" icon={ShieldCheck} />
          <CardBody className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Waves className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Proteção de Recursos Hídricos</p>
                <p className="text-gray-600 text-sm mt-1">
                  A coleta de {data.oil.toFixed(1)}L de óleo evitou a contaminação de aproximadamente 
                  <span className="font-bold text-blue-600 ml-1">{totalWaterProtected.toLocaleString()} litros de água</span> potável.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Wind className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Redução de Emissões de Carbono</p>
                <p className="text-gray-600 text-sm mt-1">
                  A reciclagem destes materiais economizou o equivalente a 
                  <span className="font-bold text-green-600 ml-1">{totalCO2.toFixed(1)} kg de CO2</span> que seriam emitidos na produção de novos plásticos.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Metodologia de Cálculo" />
          <CardBody>
            <div className="space-y-4 text-sm text-gray-600">
              <p>Os cálculos de impacto ambiental baseiam-se em médias nacionais de sustentabilidade:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Recipientes:</strong> Média de 20g por unidade (mistura de PET e latas).</li>
                <li><strong>Óleo:</strong> 1 litro de óleo descartado incorretamente pode contaminar até 25.000 litros de água.</li>
                <li><strong>Energia:</strong> A reciclagem de alumínio e plástico consome até 95% menos energia que a produção primária.</li>
              </ul>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Objetivo Estratégico</p>
                <p className="italic font-medium">"Transformar resíduos em valor social, educando as novas gerações para uma economia circular."</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default EnvironmentalImpact;
