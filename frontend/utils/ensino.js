import { Alert, Platform } from 'react-native';

export const API_URL = Platform.select({
  web: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export function avisar(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(mensagem ? `${titulo}\n${mensagem}` : titulo);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

export function confirmar(titulo, mensagem, aoConfirmar) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n${mensagem}`)) aoConfirmar();
  } else {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: aoConfirmar },
    ]);
  }
}

// id = valor salvo no banco; itens = conteúdos que podem ser marcados
export const CATEGORIAS_ENSINO = [
  {
    id: 'alfabeto_numeros',
    icone: 'hand-left-outline',
    titulo: 'Alfabeto e números',
    descricao: 'Ensine o alfabeto manual e os números em Libras.',
    itens: ['Alfabeto', 'Números'],
  },
  {
    id: 'cumprimentos_cotidiano',
    icone: 'chatbubble-ellipses-outline',
    titulo: 'Cumprimentos e cotidiano',
    descricao: 'Compartilhe sinais usados no dia a dia, como saudações e expressões de cortesia.',
    itens: ['Olá', 'Bom dia', 'Boa tarde', 'Boa noite', 'Obrigado', 'Por favor', 'Tudo bem', 'Desculpa', 'Outras expressões'],
  },
  {
    id: 'pratica',
    icone: 'people-outline',
    titulo: 'Prática com voluntários',
    descricao: 'Pratique conversação e tire dúvidas com quem está aprendendo.',
    itens: ['Conversação', 'Tirar dúvidas', 'Correção dos movimentos', 'Individual', 'Pequenos grupos'],
  },
];

export const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const MODALIDADES = [
  { id: 'online', rotulo: 'Online' },
  { id: 'presencial', rotulo: 'Presencial' },
  { id: 'ambos', rotulo: 'Ambos' },
];

export const ROTULO_MODALIDADE = { online: 'Online', presencial: 'Presencial', ambos: 'Online e presencial' };

export const COR_STATUS = {
  pendente: { fundo: '#FEF3C7', texto: '#92400E', rotulo: 'Pendente' },
  aceita: { fundo: '#D1FAE5', texto: '#059669', rotulo: 'Aceita' },
  recusada: { fundo: '#FEE2E2', texto: '#B91C1C', rotulo: 'Recusada' },
};

export const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function resumoDisponibilidades(lista = []) {
  return lista.map((d) => `${d.dia_semana} ${d.horario_inicio}-${d.horario_fim}`).join(' • ');
}

export function resumoConteudos(categorias = {}) {
  return Object.values(categorias).flat().join(', ');
}