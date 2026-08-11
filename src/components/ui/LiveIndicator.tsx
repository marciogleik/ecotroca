import React from 'react';

const LiveIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full shadow-sm">
      <div className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
      </div>
      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
        Atualização em Tempo Real
      </span>
    </div>
  );
};

export default LiveIndicator;
