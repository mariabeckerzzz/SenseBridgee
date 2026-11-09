import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
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

function avisar(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(mensagem ? `${titulo}\n${mensagem}` : titulo);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

const COR_STATUS = {
  pendente: { fundo: '#FEF3C7', texto: '#92400E', rotulo: 'Pendente' },
  aceita: { fundo: '#D1FAE5', texto: '#059669', rotulo: 'Aceita' },
  concluida: { fundo: '#DBEAFE', texto: '#1D4ED8', rotulo: 'Concluída' },
  cancelada: { fundo: '#FEE2E2', texto: '#B91C1C', rotulo: 'Recusada' },
};

export default function SolicitacoesVoluntario({ navigation }) {
  const { usuario } = useAuth();

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [idVoluntario, setIdVoluntario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarSolicitacoes = useCallback(async (idVol) => {
    try {
      const resposta = await fetch(`${API_URL}/solicitacoes/voluntario/${idVol}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Erro ao carregar solicitações');
      }

      setSolicitacoes(dados || []);
      setErro('');
    } catch (e) {
      setErro(e.message || 'Erro ao carregar solicitações');
    }
  }, []);

  useEffect(() => {
    async function iniciar() {
      if (!usuario?.id_usuario) {
        setCarregando(false);
        return;
      }

      try {
        const resposta = await fetch(`${API_URL}/voluntarios`);
        const dados = await resposta.json();

        const encontrado = (dados || []).find(
          (v) => Number(v.id_usuario) === Number(usuario.id_usuario)
        );

        if (!encontrado) {
          setErro('Voluntário não encontrado para esse usuário.');
          setCarregando(false);
          return;
        }

        setIdVoluntario(encontrado.id_voluntario);
        await carregarSolicitacoes(encontrado.id_voluntario);
      } catch (e) {
        setErro('Não foi possível conectar ao servidor.');
      } finally {
        setCarregando(false);
      }
    }

    iniciar();
  }, [usuario, carregarSolicitacoes]);

  async function atualizarStatus(idSolicitacao, status) {
    try {
      const resposta = await fetch(`${API_URL}/solicitacoes/${idSolicitacao}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Erro ao atualizar status');
      }

      avisar('Sucesso', status === 'aceita' ? 'Solicitação aceita.' : 'Solicitação recusada.');
      await carregarSolicitacoes(idVoluntario);
    } catch (e) {
      avisar('Erro', e.message || 'Não foi possível atualizar o status');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitulo}>Solicitações</Text>
          <Text style={styles.headerSubtitulo}>Pedidos de ajuda recebidos</Text>
        </View>

        <TouchableOpacity
          onPress={() => idVoluntario && carregarSolicitacoes(idVoluntario)}
          style={styles.botaoVoltar}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>
        {carregando ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />
        ) : erro ? (
          <View style={styles.cardAviso}>
            <Text style={styles.avisoErro}>{erro}</Text>
          </View>
        ) : solicitacoes.length === 0 ? (
          <View style={styles.cardAviso}>
            <Text style={styles.avisoTexto}>Nenhuma solicitação recebida ainda.</Text>
          </View>
        ) : (
          solicitacoes.map((item) => {
            const estilo = COR_STATUS[item.status] || COR_STATUS.pendente;
            return (
              <View key={item.id_solicitacao} style={styles.card}>
                <View style={styles.cardTopo}>
                  <Text style={styles.cardTitulo}>{item.nome_pcd}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: estilo.fundo }]}>
                    <Text style={[styles.statusTexto, { color: estilo.texto }]}>
                      {estilo.rotulo}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTexto}>
                  {item.data_agendamento} • {item.horario_inicio} - {item.horario_fim}
                </Text>
                <Text style={styles.cardTexto}>Tipo: {item.tipo_ajuda}</Text>
                {item.descricao ? (
                  <Text style={styles.cardTexto}>Descrição: {item.descricao}</Text>
                ) : null}

                {item.status === 'pendente' ? (
                  <View style={styles.acoes}>
                    <TouchableOpacity
                      style={styles.botaoAceitar}
                      onPress={() => atualizarStatus(item.id_solicitacao, 'aceita')}
                    >
                      <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.botaoRecusar}
                      onPress={() => atualizarStatus(item.id_solicitacao, 'cancelada')}
                    >
                      <Text style={styles.botaoRecusarTexto}>Recusar</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#2563EB',
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoVoltar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitulo: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  headerSubtitulo: { color: '#DBEAFE', fontSize: 13, marginTop: 3, textAlign: 'center' },

  conteudo: { padding: 20, paddingBottom: 32 },

  cardAviso: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avisoTexto: { color: '#6B7280', textAlign: 'center', fontSize: 14 },
  avisoErro: { color: '#B91C1C', textAlign: 'center', fontSize: 14 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  cardTexto: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusTexto: { fontSize: 11, fontWeight: '700' },

  acoes: { flexDirection: 'row', gap: 10, marginTop: 14 },
  botaoAceitar: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoAceitarTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  botaoRecusar: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoRecusarTexto: { color: '#B91C1C', fontWeight: '700', fontSize: 14 },
});