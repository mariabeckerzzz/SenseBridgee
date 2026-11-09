import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
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

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function DisponibilidadeVoluntario({ navigation }) {
  const { usuario } = useAuth();

  const [voluntarioLogadoId, setVoluntarioLogadoId] = useState(null);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(true);
  const [erro, setErro] = useState('');
  const [diaSemana, setDiaSemana] = useState('Segunda');
  const [horarioInicio, setHorarioInicio] = useState('09:00');
  const [horarioFim, setHorarioFim] = useState('09:30');
  const [editandoId, setEditandoId] = useState(null);

  async function carregarVoluntarioLogado() {
    if (!usuario?.id_usuario) return null;

    try {
      const resposta = await fetch(`${API_URL}/voluntarios`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || dados.erro || 'Erro ao buscar voluntários');
      }

      const voluntarioEncontrado = (dados || []).find(
        (voluntario) => Number(voluntario.id_usuario) === Number(usuario.id_usuario)
      );

      return voluntarioEncontrado ? voluntarioEncontrado.id_voluntario : null;
    } catch (erro) {
      console.log('Erro ao buscar voluntário logado:', erro);
      return null;
    }
  }

  async function carregarDisponibilidades() {
    try {
      if (!voluntarioLogadoId) {
        setDisponibilidades([]);
        return;
      }

      const resposta = await fetch(`${API_URL}/voluntarios/${voluntarioLogadoId}/disponibilidades`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || dados.erro || 'Erro ao carregar disponibilidades');
      }

      setDisponibilidades(dados || []);
    } catch (erro) {
      setErro(erro.message || 'Erro ao carregar disponibilidades');
    }
  }

  async function carregarSolicitacoes() {
    try {
      if (!voluntarioLogadoId) {
        setSolicitacoes([]);
        return;
      }

      const resposta = await fetch(`${API_URL}/solicitacoes/voluntario/${voluntarioLogadoId}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || dados.erro || 'Erro ao carregar solicitações');
      }

      setSolicitacoes(dados || []);
    } catch (erro) {
      setErro(erro.message || 'Erro ao carregar solicitações');
    } finally {
      setCarregandoSolicitacoes(false);
    }
  }

  useEffect(() => {
    if (!usuario?.id_usuario) {
      setCarregando(false);
      return;
    }

    async function init() {
      setCarregando(true);
      setErro('');

      const idVoluntario = await carregarVoluntarioLogado();
      setVoluntarioLogadoId(idVoluntario);

      if (!idVoluntario) {
        setCarregando(false);
        setErro('Voluntário não encontrado para esse usuário.');
        return;
      }

      await Promise.all([carregarDisponibilidades(), carregarSolicitacoes()]);
      setCarregando(false);
    }

    init();
  }, [usuario]);

  async function salvarDisponibilidade() {
    if (!voluntarioLogadoId) {
      Alert.alert('Erro', 'Voluntário não encontrado para esse usuário.');
      return;
    }

    if (!diaSemana || !horarioInicio || !horarioFim) {
      Alert.alert('Preencha todos os campos');
      return;
    }

    if (timeToMinutes(horarioInicio) >= timeToMinutes(horarioFim)) {
      Alert.alert('Horário inválido', 'O horário final deve ser posterior ao inicial.');
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/voluntarios/${voluntarioLogadoId}/disponibilidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dia_semana: diaSemana,
          horario_inicio: horarioInicio,
          horario_fim: horarioFim,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || dados.erro || 'Erro ao salvar disponibilidade');
      }

      Alert.alert('Sucesso', dados.mensagem || 'Disponibilidade salva com sucesso');

      setDiaSemana('Segunda');
      setHorarioInicio('09:00');
      setHorarioFim('09:30');
      setEditandoId(null);

      await carregarDisponibilidades();
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Não foi possível salvar a disponibilidade');
    }
  }

  async function removerDisponibilidade(idDisponibilidade) {
    if (!voluntarioLogadoId) return;

    try {
      const resposta = await fetch(
        `${API_URL}/voluntarios/${voluntarioLogadoId}/disponibilidades/${idDisponibilidade}`,
        {
          method: 'DELETE',
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || dados.erro || 'Erro ao remover disponibilidade');
      }

      Alert.alert('Sucesso', dados.mensagem || 'Disponibilidade removida com sucesso');
      await carregarDisponibilidades();
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Não foi possível remover a disponibilidade');
    }
  }

  async function atualizarStatusSolicitacao(idSolicitacao, status) {
    try {
      const resposta = await fetch(`${API_URL}/solicitacoes/${idSolicitacao}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || dados.erro || 'Erro ao atualizar status');
      }

      Alert.alert('Sucesso', dados.mensagem || 'Status atualizado com sucesso');
      await carregarSolicitacoes();
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Não foi possível atualizar o status');
    }
  }

  function timeToMinutes(hora) {
    if (!hora) return 0;
    const [h, m] = String(hora).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  if (!usuario) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Faça login para continuar.</Text>
      </SafeAreaView>
    );
  }

  if (usuario.tipo_usuario !== 'voluntario') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>A área do voluntário é exclusiva para usuários do tipo voluntário.</Text>
      </SafeAreaView>
    );
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.carregandoTexto}>Carregando sua área...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitulo}>Disponibilidade</Text>
          <Text style={styles.headerSubtitulo}>Gerencie seus horários</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>
        {erro ? (
          <View style={styles.cardErro}>
            <Text style={styles.cardErroTexto}>{erro}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.titulo}>Cadastrar disponibilidade</Text>

          <Text style={styles.rotulo}>Dia da semana</Text>
          <View style={styles.selectBox}>
            {DIAS_SEMANA.map((dia) => (
              <TouchableOpacity
                key={dia}
                onPress={() => setDiaSemana(dia)}
                style={[styles.dayButton, diaSemana === dia && styles.dayButtonActive]}
              >
                <Text style={[styles.dayButtonText, diaSemana === dia && styles.dayButtonTextActive]}>
                  {dia}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.rotulo}>Horário de início</Text>
          <TextInput
            style={styles.input}
            value={horarioInicio}
            onChangeText={setHorarioInicio}
            placeholder="Ex.: 09:00"
          />

          <Text style={styles.rotulo}>Horário de fim</Text>
          <TextInput
            style={styles.input}
            value={horarioFim}
            onChangeText={setHorarioFim}
            placeholder="Ex.: 10:00"
          />

          <TouchableOpacity style={styles.botaoSalvar} onPress={salvarDisponibilidade}>
            <Text style={styles.botaoSalvarTexto}>
              {editandoId ? 'Salvar alterações' : 'Cadastrar disponibilidade'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilidades cadastradas</Text>

          {disponibilidades.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma disponibilidade cadastrada.</Text>
            </View>
          ) : (
            disponibilidades.map((item) => (
              <View key={item.id_disponibilidade} style={styles.cardItem}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.dia_semana}</Text>
                  <Text style={styles.cardText}>
                    {item.horario_inicio} - {item.horario_fim}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditandoId(item.id_disponibilidade);
                      setDiaSemana(item.dia_semana);
                      setHorarioInicio(item.horario_inicio);
                      setHorarioFim(item.horario_fim);
                    }}
                    style={styles.botaoEditar}
                  >
                    <Text style={styles.botaoEditarTexto}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => removerDisponibilidade(item.id_disponibilidade)}
                    style={styles.botaoRemover}
                  >
                    <Text style={styles.botaoRemoverTexto}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitações recebidas</Text>

          {carregandoSolicitacoes ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : solicitacoes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma solicitação recebida.</Text>
            </View>
          ) : (
            solicitacoes.map((item) => (
              <View key={item.id_solicitacao} style={styles.cardItem}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.nome_pcd}</Text>
                  <Text style={styles.cardText}>
                    {item.data_agendamento} • {item.horario_inicio} - {item.horario_fim}
                  </Text>
                  <Text style={styles.cardText}>Tipo: {item.tipo_ajuda}</Text>
                  <Text style={styles.cardTextStatus}>Status: {item.status}</Text>
                </View>

                <View style={styles.cardActionsVertical}>
                  <TouchableOpacity
                    onPress={() => atualizarStatusSolicitacao(item.id_solicitacao, 'aceita')}
                    style={styles.botaoAceitar}
                  >
                    <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => atualizarStatusSolicitacao(item.id_solicitacao, 'cancelada')}
                    style={styles.botaoRecusar}
                  >
                    <Text style={styles.botaoRecusarTexto}>Recusar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  containerCenter: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  carregandoTexto: { marginTop: 12, color: '#374151', fontWeight: '600' },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botaoVoltar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitulo: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  headerSubtitulo: { color: '#DBEAFE', fontSize: 13, marginTop: 3 },
  conteudo: { padding: 20, paddingBottom: 32 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  titulo: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  rotulo: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  selectBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  dayButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  dayButtonTextActive: { color: '#FFFFFF' },
  botaoSalvar: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoSalvarTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: { color: '#6B7280', textAlign: 'center', fontSize: 14 },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  cardTextStatus: { fontSize: 12, color: '#2563EB', fontWeight: '600', marginTop: 4 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botaoEditar: {
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  botaoEditarTexto: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
  botaoRemover: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  botaoRemoverTexto: { color: '#B91C1C', fontWeight: '700', fontSize: 12 },
  cardActionsVertical: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'stretch',
  },
  botaoAceitar: {
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  botaoAceitarTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  botaoRecusar: {
    backgroundColor: '#F7C6C6',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  botaoRecusarTexto: { color: '#B91C1C', fontWeight: '700', fontSize: 12 },
});