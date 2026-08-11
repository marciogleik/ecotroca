export const formatCpfCnpj = (value: string): string => {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '');

  // Limita a 14 caracteres numéricos (tamanho do CNPJ)
  const truncated = digits.slice(0, 14);

  // Se tiver até 11 dígitos, formata como CPF
  if (truncated.length <= 11) {
    return truncated
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  }

  // Se tiver mais de 11 dígitos, formata como CNPJ
  return truncated
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2');
};

export const clearMask = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const numeroPorExtenso = (valor: number): string => {
  const v = Math.abs(Math.floor(valor));
  if (v === 0) return 'zero';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezAondezesseis = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const converterCentena = (n: number): string => {
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    let partes: string[] = [];
    if (c > 0) partes.push(centenas[c]);

    if (d === 1) {
      partes.push(dezAondezesseis[u]);
    } else {
      if (d > 1) partes.push(dezenas[d]);
      if (u > 0) partes.push(unidades[u]);
    }

    return partes.join(' e ');
  };

  if (v < 1000) return converterCentena(v);

  const milha = Math.floor(v / 1000);
  const resto = v % 1000;

  let textoMilha = milha === 1 ? 'um mil' : `${converterCentena(milha)} mil`;
  if (resto > 0) {
    if (resto < 100 || resto % 100 === 0) {
      textoMilha += ` e ${converterCentena(resto)}`;
    } else {
      textoMilha += ` ${converterCentena(resto)}`;
    }
  }

  return textoMilha;
};
