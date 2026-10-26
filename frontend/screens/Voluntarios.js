import { useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://192.168.56.1:3000';

function formatarData(data) {
  const date = new Date(`${data}T12:00:00`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function nomeDiaSemana(data) {
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' });
}

function gerarProximosDias(total = 7) {
  const lista = [];
  const hoje = new Date();

  for (let index = 0; index < total; index += 1) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + index);
    lista.push({
      valor: data.toISOString().split('T')[0],
      label: data.toLocaleDateString('pt-BR', { weekday: 'short' }),
      numero: data.getDate(),
    });
  }

  return lista;
}

export default function Voluntarios({ navigation }) {
  const { usuario } = useAuth();
  const [voluntarios, setVoluntarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [error, setError] = useState('');
  const [voluntarioSelecionado, setVoluntarioSelecionado] = useState(null);
  const [diaSelecionado, setDiaSelecionado] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [tipoAjuda, setTipoAjuda] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  const proximosDias = useMemo(() => gerarProximosDias(7), []);

  async function carregarVoluntarios() {
    try {
      setCarregando(true);
      setError('');
      const resposta = await fetch(`${API_URL}/voluntarios`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Erro ao buscar voluntários');
      }

      setVoluntarios(dados);
      if (dados.length > 0) {
        setVoluntarioSelecionado(dados[0]);
      }
    } catch (erro) {
      setError(erro.message || 'Não foi possível carregar voluntários');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarVoluntarios();
  }, []);

  useEffect(() => {
    if (!voluntarioSelecionado) {
      setDiaSelecionado('');
      setHorarioSelecionado(null);
      return;
    }

    const primeiraDataDisponivel = proximosDias.find((dia) => {
      const diaSemana = new Date(`${dia.valor}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' });
      const nome = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
      const nomesMapeados = {
        Domingo: 'Domingo',
        Segunda: 'Segunda',
        Segunda-feira: 'Segunda',
        Terça: 'Terça',
        Terça-feira: 'Terça',
        Quarta: 'Quarta',
        Quarta-feira: 'Quarta',
        Quinta: 'Quinta',
        Quinta-feira: 'Quinta',
        Sexta: 'Sexta',
        Sexta-feira: 'Sexta',
        Sábado: 'Sábado',
      };

      return (voluntarioSelecionado.disponibilidades || []).some(
        (item) => item.dia_semana === nomesMapeados[nome]
      );
    });

    if (primeiraDataDisponivel) {
      setDiaSelecionado(primeiraDataDisponivel.valor);
      setHorarioSelecionado(null);
    } else {
      setDiaSelecionado('');
      setHorarioSelecionado(null);
    }
  }, [voluntarioSelecionado]);

  const opcoesDeHorario = useMemo(() => {
    if (!voluntarioSelecionado || !diaSelecionado) {
      return [];
    }

    const diaSemana = new Date(`${diaSelecionado}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' });
    const nome = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    const nomesMapeados = {
      Domingo: 'Domingo',
      Segunda: 'Segunda',
      Segunda-feira: 'Segunda',
      Terça: 'Terça',
      Terça-feira: 'Terça',
      Quarta: 'Quarta',
      Quarta-feira: 'Quarta',
      Quinta: 'Quinta',
      Quinta-feira: 'Quinta',
      Sexta: 'Sexta',
      Sexta-feira: 'Sexta',
      Sábado: 'Sábado',
    };

    const disponibilidadeDoDia = (voluntarioSelecionado.disponibilidades || []).filter(
      (item) => item.dia_semana === nomesMapeados[nome]
    );

    return disponibilidadeDoDia.map((item) => ({
      ...item,
      label: `${item.horario_inicio} - ${item.horario_fim}`,
    }));
  }, [diaSelecionado, voluntarioSelecionado]);

  async function confirmarAgendamento() {
    if (!usuario?.id_usuario) {
      Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
      return;
    }

    if (!voluntarioSelecionado) {
      Alert.alert('Selecione um voluntário');
      return;
    }

    if (!diaSelecionado) {
      Alert.alert('Selecione um dia disponível');
      return;
    }

    if (!horarioSelecionado) {
      Alert.alert('Selecione um horário disponível');
      return;
    }

    if (!tipoAjuda.trim()) {
      Alert.alert('Informe o tipo de ajuda');
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch(`${API_URL}/solicitacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pcd: usuario.id_usuario,
          id_voluntario: voluntarioSelecionado.id_usuario,
          data_agendamento: diaSelecionado,
          horario_inicio: horarioSelecionado.horario_inicio,
          horario_fim: horarioSelecionado.horario_fim,
          tipo_ajuda: tipoAjuda.trim(),
          descricao: descricao.trim(),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Não foi possível criar o agendamento');
      }

      Alert.alert('Agendamento solicitado', dados.mensagem || 'Solicitação enviada com sucesso');
      setTipoAjuda('');
      setDescricao('');
      setHorarioSelecionado(null);
      navigation.navigate('MinhasSolicitacoes');
    } catch (erro) {
      Alert.alert('Erro no agendamento', erro.message || 'Tente novamente mais tarde');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.carregandoTexto}>Carregando voluntários...</Text>
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
          <Text style={styles.headerTitulo}>Agendar assistência</Text>
          <Text style={styles.headerSubtitulo}>Escolha o voluntário e o melhor horário</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>
        {error ? (
          <View style={styles.cardErro}>
            <Text style={styles.cardErroTexto}>{error}</Text>
            <TouchableOpacity style={styles.botaoSecundario} onPress={carregarVoluntarios}>
              <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.secaoTitulo}>Voluntários disponíveis</Text>
        {voluntarios.length === 0 ? (
          <View style={styles.cardVazia}>
            <Text style={styles.cardVaziaTexto}>Nenhum voluntário disponível no momento.</Text>
          </View>
        ) : (
          <View style={styles.listaVoluntarios}>
            {voluntarios.map((voluntario) => {
              const selecionado = voluntarioSelecionado?.id_usuario === voluntario.id_usuario;
              return (
                <TouchableOpacity
                  key={voluntario.id_usuario}
                  style={[styles.cardVoluntario, selecionado && styles.cardVoluntarioSelecionado]}
                  onPress={() => setVoluntarioSelecionado(voluntario)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarTexto}>👩‍🦱</Text>
                  </View>

                  <View style={styles.dadosVoluntario}>
                    <Text style={styles.nomeVoluntario}>{voluntario.nome}</Text>
                    <Text style={styles.especialidade}>{voluntario.especialidade || 'Atendimento geral'}</Text>
                    <Text style={styles.disponibilidadeTexto}>
                      {voluntario.total_disponibilidades || 0} horários disponíveis
                    </Text>
                  </View>

                  <View style={styles.badgeNota}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.badgeNotaTexto}>5.0</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {voluntarioSelecionado ? (
          <>
            <Text style={styles.secaoTitulo}>Disponibilidade do voluntário</Text>
            <View style={styles.listaDias}>
              {proximosDias.map((dia) => {
                const habilitado = (voluntarioSelecionado.disponibilidades || []).some((item) => {
                  const nomeDia = new Date(`${dia.valor}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' });
                  const nome = nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1);
                  const nomesMapeados = {
                    Domingo: 'Domingo',
                    Segunda: 'Segunda',
                    'Segunda-feira': 'Segunda',
                    Terça: 'Terça',
                    'Terça-feira': 'Terça',
                    Quarta: 'Quarta',
                    'Quarta-feira': 'Quarta',
                    Quinta: 'Quinta',
                    'Quinta-feira': 'Quinta',
                    Sexta: 'Sexta',
                    'Sexta-feira': 'Sexta',
                    Sábado: 'Sábado',
                  };

                  return item.dia_semana === nomesMapeados[nome];
                });

                const selecionado = dia.valor === diaSelecionado;

                return (
                  <TouchableOpacity
                    key={dia.valor}
                    disabled={!habilitado}
                    onPress={() => {
                      setDiaSelecionado(dia.valor);
                      setHorarioSelecionado(null);
                    }}
                    style={[
                      styles.diaCard,
                      !habilitado && styles.diaCardDesabilitado,
                      selecionado && styles.diaCardSelecionado,
                    ]}
                  >
                    <Text style={[styles.diaCardLabel, selecionado && styles.diaCardLabelSelecionado]}>{dia.label}</Text>
                    <Text style={[styles.diaCardNumero, selecionado && styles.diaCardLabelSelecionado]}>{dia.numero}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {diaSelecionado ? (
              <>
                <Text style={styles.secaoTitulo}>Horários disponíveis</Text>
                <View style={styles.gridHorarios}>
                  {opcoesDeHorario.length === 0 ? (
                    <Text style={styles.infoVazia}>Nenhum horário disponível para este dia.</Text>
                  ) : (
                    opcoesDeHorario.map((item) => {
                      const selecionado = horarioSelecionado?.id_disponibilidade === item.id_disponibilidade;
                      return (
                        <TouchableOpacity
                          key={item.id_disponibilidade}
                          onPress={() => setHorarioSelecionado(item)}
                          style={[styles.horarioCard, selecionado && styles.horarioCardSelecionado]}
                        >
                          <Text style={[styles.horarioTexto, selecionado && styles.horarioTextoSelecionado]}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </>
            ) : null}

            <Text style={styles.secaoTitulo}>Solicitação de ajuda</Text>
            <View style={styles.formCard}>
              <Text style={styles.rotulo}>Tipo de ajuda</Text>
              <TextInput
                style={styles.input}
                value={tipoAjuda}
                onChangeText={setTipoAjuda}
                placeholder="Ex.: Libras, leitura, acompanhamento"
              />

              <Text style={styles.rotulo}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.input, styles.inputArea]}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Descreva sua necessidade"
                multiline
                numberOfLines={4}
              />

              {horarioSelecionado ? (
                <View style={styles.resumoAgendamento}>
                  <Text style={styles.resumoTitulo}>Resumo</Text>
                  <Text style={styles.resumoTexto}>Voluntário: {voluntarioSelecionado.nome}</Text>
                  <Text style={styles.resumoTexto}>Data: {formatarData(diaSelecionado)}</Text>
                  <Text style={styles.resumoTexto}>Horário: {horarioSelecionado.label}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      {voluntarioSelecionado && diaSelecionado && horarioSelecionado ? (
        <View style={styles.rodape}>
          <TouchableOpacity
            style={[styles.botaoConfirmar, enviando && styles.botaoConfirmarDesabilitado]}
            onPress={confirmarAgendamento}
            disabled={enviando}
          >
            <Text style={styles.botaoConfirmarTexto}>
              {enviando ? 'Solicitando...' : 'Confirmar agendamento'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  conteudo: { padding: 20, paddingBottom: 120 },
  secaoTitulo: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 18, marginBottom: 12 },
  listaVoluntarios: { gap: 12 },
  cardVoluntario: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardVoluntarioSelecionado: {
    borderColor: '#2563EB',
    borderWidth: 2,
    shadowColor: '#2563EB',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTexto: { fontSize: 22 },
  dadosVoluntario: { flex: 1 },
  nomeVoluntario: { fontSize: 16, fontWeight: '700', color: '#111827' },
  especialidade: { fontSize: 13, color: '#2563EB', marginTop: 2 },
  disponibilidadeTexto: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badgeNota: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  badgeNotaTexto: { color: '#92400E', fontSize: 12, fontWeight: '700' },
  cardErro: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  cardErroTexto: { color: '#991B1B', fontSize: 14, fontWeight: '600' },
  botaoSecundario: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  botaoSecundarioTexto: { color: '#2563EB', fontWeight: '700' },
  cardVazia: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardVaziaTexto: { color: '#6B7280', textAlign: 'center' },
  listaDias: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  diaCard: {
    width: 56,
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  diaCardDesabilitado: { opacity: 0.4 },
  diaCardSelecionado: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  diaCardLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  diaCardLabelSelecionado: { color: '#FFFFFF' },
  diaCardNumero: { marginTop: 4, color: '#111827', fontSize: 18, fontWeight: '700' },
  gridHorarios: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  horarioCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  horarioCardSelecionado: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  horarioTexto: { color: '#111827', fontWeight: '600' },
  horarioTextoSelecionado: { color: '#2563EB' },
  infoVazia: { color: '#6B7280', marginTop: 6 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
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
  inputArea: { minHeight: 90, textAlignVertical: 'top' },
  resumoAgendamento: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  resumoTitulo: { fontSize: 14, fontWeight: '700', color: '#1D4ED8', marginBottom: 6 },
  resumoTexto: { fontSize: 13, color: '#1F2937', marginBottom: 2 },
  rodape: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5F7FA',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  botaoConfirmar: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botaoConfirmarDesabilitado: { opacity: 0.7 },
  botaoConfirmarTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
