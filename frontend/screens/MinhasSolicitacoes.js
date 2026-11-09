import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:3000';

export default function MinhasSolicitacoes({ navigation }) {
  const { usuario } = useAuth();

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregarSolicitacoes() {
    try {
      if (!usuario?.id_usuario) return;

      const resposta = await fetch(`${API_URL}/solicitacoes/usuario/${usuario.id_usuario}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Erro ao carregar solicitações');
      }

      setSolicitacoes(dados || []);
    } catch (erro) {
      setErro(erro.message || 'Erro ao carregar solicitações');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!usuario?.id_usuario) {
      setCarregando(false);
      return;
    }

    carregarSolicitacoes();
  }, [usuario]);

  if (!usuario) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Faça login para continuar.</Text>
      </SafeAreaView>
    );
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.carregandoTexto}>Carregando solicitações...</Text>
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
          <Text style={styles.headerTitulo}>Minhas solicitações</Text>
          <Text style={styles.headerSubtitulo}>Acompanhe seus pedidos</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>
        {erro ? (
          <View style={styles.cardErro}>
            <Text style={styles.cardErroTexto}>{erro}</Text>
            <TouchableOpacity style={styles.botaoSecundario} onPress={carregarSolicitacoes}>
              <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {solicitacoes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma solicitação encontrada.</Text>
          </View>
        ) : (
          solicitacoes.map((item) => (
            <TouchableOpacity
              key={item.id_solicitacao}
              style={styles.card}
              onPress={() => navigation.navigate('DetalheSolicitacao', { idSolicitacao: item.id_solicitacao })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.nome_voluntario}</Text>
                <View style={styles.badgeStatus}>
                  <Text style={styles.badgeStatusTexto}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.cardText}>
                {item.data_agendamento} • {item.horario_inicio} - {item.horario_fim}
              </Text>
              <Text style={styles.cardText}>Tipo: {item.tipo_ajuda}</Text>
              <Text style={styles.cardText}>Descrição: {item.descricao || 'Sem descrição'}</Text>
            </TouchableOpacity>
          ))
        )}
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
  conteudo: { padding: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  badgeStatus: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeStatusTexto: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  cardErro: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  cardErroTexto: { color: '#991B1B', fontSize: 14, fontWeight: '600' },
  botaoSecundario: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  botaoSecundarioTexto: { color: '#2563EB', fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: { color: '#6B7280', textAlign: 'center', fontSize: 14 },
});