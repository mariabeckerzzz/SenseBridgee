import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const API_URL = Platform.select({
  web: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const ABREV_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const TIPOS_AJUDA = ['Libras', 'Leitura', 'Atendimento geral'];

// Alert.alert não funciona bem no navegador, então usamos window.alert nele
function avisar(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(mensagem ? `${titulo}\n${mensagem}` : titulo);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

// Gera YYYY-MM-DD no horário local (toISOString mudaria o dia por causa do fuso)
function formatarDataSQL(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function gerarProximosDias(quantidade) {
  const lista = [];
  const hoje = new Date();
  for (let i = 0; i < quantidade; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    lista.push({
      data: d,
      chave: formatarDataSQL(d),
      abrev: ABREV_DIAS[d.getDay()],
      numero: d.getDate(),
      nomeDia: NOMES_DIAS[d.getDay()],
    });
  }
  return lista;
}

export default function Voluntarios({ navigation }) {
  const { usuario } = useAuth();

  const [dias] = useState(() => gerarProximosDias(7));
  const [diaSelecionado, setDiaSelecionado] = useState(dias[0]);
  const [voluntarios, setVoluntarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [voluntarioSelecionado, setVoluntarioSelecionado] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [tipoAjuda, setTipoAjuda] = useState(TIPOS_AJUDA[0]);
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const resposta = await fetch(`${API_URL}/voluntarios/disponiveis`);
        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(dados.mensagem || 'Erro ao buscar voluntários');
        }

        setVoluntarios(dados || []);
      } catch (e) {
        setErro(e.message || 'Erro ao buscar voluntários');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // Voluntários que têm horário no dia da semana escolhido
  const voluntariosDoDia = voluntarios
    .map((v) => ({
      ...v,
      horariosDoDia: v.disponibilidades.filter((d) => d.dia_semana === diaSelecionado.nomeDia),
    }))
    .filter((v) => v.horariosDoDia.length > 0);

  const voluntarioAtual = voluntariosDoDia.find(
    (v) => v.id_voluntario === voluntarioSelecionado
  );

  function escolherDia(dia) {
    setDiaSelecionado(dia);
    setVoluntarioSelecionado(null);
    setHorarioSelecionado(null);
  }

  function escolherVoluntario(id) {
    setVoluntarioSelecionado(id);
    setHorarioSelecionado(null);
  }

  async function confirmarAgendamento() {
    if (!usuario?.id_usuario) {
      avisar('Atenção', 'Faça login para continuar.');
      return;
    }

    if (!voluntarioAtual || !horarioSelecionado) {
      avisar('Atenção', 'Escolha um voluntário e um horário.');
      return;
    }

    setEnviando(true);

    try {
      // 1) descobre o id_pcd do usuário logado
      const respostaPcd = await fetch(`${API_URL}/pcd/usuario/${usuario.id_usuario}`);
      const dadosPcd = await respostaPcd.json();

      if (!respostaPcd.ok) {
        throw new Error(dadosPcd.mensagem || 'Perfil de PcD não encontrado');
      }

      // 2) envia a solicitação
      const resposta = await fetch(`${API_URL}/solicitacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pcd: dadosPcd.id_pcd,
          id_voluntario: voluntarioAtual.id_voluntario,
          id_disponibilidade: horarioSelecionado.id_disponibilidade,
          tipo_ajuda: tipoAjuda,
          descricao: descricao.trim() || null,
          data_agendamento: diaSelecionado.chave,
          horario_inicio: horarioSelecionado.horario_inicio,
          horario_fim: horarioSelecionado.horario_fim,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Erro ao enviar solicitação');
      }

      avisar('Sucesso', 'Solicitação enviada! Aguarde a resposta do voluntário.');
      navigation.goBack();
    } catch (e) {
      avisar('Erro', e.message || 'Não foi possível enviar a solicitação');
    } finally {
      setEnviando(false);
    }
  }

  const podeConfirmar = !!voluntarioAtual && !!horarioSelecionado && !enviando;

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitulo}>Agendar Assistência</Text>
        <Text style={styles.headerSubtitulo}>Escolha o melhor horário para você</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>
        {/* Mês */}
        <Text style={styles.mesTexto}>
          {MESES[diaSelecionado.data.getMonth()]} {diaSelecionado.data.getFullYear()}
        </Text>

        {/* Próximos 7 dias */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.diasLinha}
        >
          {dias.map((dia) => {
            const selecionado = dia.chave === diaSelecionado.chave;
            return (
              <TouchableOpacity
                key={dia.chave}
                style={[styles.diaCard, selecionado && styles.diaCardSelecionado]}
                onPress={() => escolherDia(dia)}
              >
                <Text style={[styles.diaLabel, selecionado && styles.textoBranco]}>
                  {dia.abrev}
                </Text>
                <Text style={[styles.diaNumero, selecionado && styles.textoBranco]}>
                  {dia.numero}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Voluntários do dia */}
        <Text style={styles.secaoTitulo}>Voluntários disponíveis</Text>

        {carregando ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
        ) : erro ? (
          <View style={styles.cardAviso}>
            <Text style={styles.avisoErro}>{erro}</Text>
          </View>
        ) : voluntariosDoDia.length === 0 ? (
          <View style={styles.cardAviso}>
            <Text style={styles.avisoTexto}>
              Nenhum voluntário disponível em {diaSelecionado.nomeDia}. Tente outro dia.
            </Text>
          </View>
        ) : (
          voluntariosDoDia.map((v) => {
            const selecionado = v.id_voluntario === voluntarioSelecionado;
            return (
              <TouchableOpacity
                key={v.id_voluntario}
                style={[styles.voluntarioCard, selecionado && styles.voluntarioCardSelecionado]}
                onPress={() => escolherVoluntario(v.id_voluntario)}
              >
                <View style={styles.voluntarioAvatar}>
                  <Ionicons name="person" size={22} color="#2563EB" />
                </View>

                <View style={styles.voluntarioInfo}>
                  <View style={styles.voluntarioNomeLinha}>
                    <Text style={styles.voluntarioNome}>{v.nome}</Text>
                    <View style={styles.notaBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.notaTexto}>{v.avaliacao}</Text>
                    </View>
                  </View>
                  <Text style={styles.voluntarioEspecialidade}>
                    Especialidade: {v.especialidade}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Horários do voluntário escolhido */}
        {voluntarioAtual ? (
          <>
            <Text style={styles.secaoTitulo}>Horários de {voluntarioAtual.nome}</Text>
            <View style={styles.horariosGrid}>
              {voluntarioAtual.horariosDoDia.map((h) => {
                const selecionado =
                  horarioSelecionado?.id_disponibilidade === h.id_disponibilidade;
                return (
                  <TouchableOpacity
                    key={h.id_disponibilidade}
                    style={[styles.horarioCard, selecionado && styles.horarioSelecionado]}
                    onPress={() => setHorarioSelecionado(h)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={selecionado ? '#FFFFFF' : '#6B7280'}
                    />
                    <Text style={[styles.horarioTexto, selecionado && styles.textoBranco]}>
                      {h.horario_inicio} - {h.horario_fim}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tipo de ajuda */}
            <Text style={styles.secaoTitulo}>Tipo de ajuda</Text>
            <View style={styles.tiposLinha}>
              {TIPOS_AJUDA.map((tipo) => {
                const selecionado = tipo === tipoAjuda;
                return (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.tipoChip, selecionado && styles.tipoChipSelecionado]}
                    onPress={() => setTipoAjuda(tipo)}
                  >
                    <Text style={[styles.tipoTexto, selecionado && styles.textoBranco]}>
                      {tipo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Descrição opcional */}
            <TextInput
              style={styles.input}
              placeholder="Descreva do que você precisa (opcional)"
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />
          </>
        ) : null}
      </ScrollView>

      {/* Botão de confirmar */}
      <View style={styles.rodape}>
        <TouchableOpacity
          style={[styles.botaoConfirmar, !podeConfirmar && styles.botaoDesabilitado]}
          disabled={!podeConfirmar}
          onPress={confirmarAgendamento}
        >
          <Text style={styles.botaoConfirmarTexto}>
            {enviando
              ? 'Enviando...'
              : horarioSelecionado
              ? `Solicitar às ${horarioSelecionado.horario_inicio}`
              : 'Selecione voluntário e horário'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitulo: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 12 },
  headerSubtitulo: { color: '#DBEAFE', fontSize: 14, marginTop: 6 },

  conteudo: { padding: 20, paddingBottom: 40 },

  mesTexto: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 16 },

  diasLinha: { gap: 10, paddingBottom: 4, marginBottom: 20 },
  diaCard: {
    width: 58,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  diaCardSelecionado: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  diaLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  diaNumero: { fontSize: 16, fontWeight: '700', color: '#111827' },
  textoBranco: { color: '#FFFFFF' },

  secaoTitulo: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12, marginTop: 8 },

  cardAviso: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  avisoTexto: { color: '#6B7280', textAlign: 'center', fontSize: 14 },
  avisoErro: { color: '#B91C1C', textAlign: 'center', fontSize: 14 },

  voluntarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  voluntarioCardSelecionado: { borderColor: '#2563EB', borderWidth: 2 },
  voluntarioAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voluntarioInfo: { flex: 1 },
  voluntarioNomeLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voluntarioNome: { fontSize: 15, fontWeight: '700', color: '#111827' },
  notaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  notaTexto: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  voluntarioEspecialidade: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  horarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  horarioSelecionado: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  horarioTexto: { fontSize: 14, fontWeight: '600', color: '#111827' },

  tiposLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tipoChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tipoChipSelecionado: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  tipoTexto: { color: '#6B7280', fontWeight: '600', fontSize: 13 },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  rodape: { padding: 20, backgroundColor: '#F5F7FA' },
  botaoConfirmar: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botaoDesabilitado: { backgroundColor: '#93C5FD' },
  botaoConfirmarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});