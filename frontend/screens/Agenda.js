import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:3000';

export default function Agenda({ navigation }) {
  const { usuario } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregarAgenda() {
    try {
      if (!usuario?.id_usuario) {
        setAgendamentos([]);
        return;
      }

      const respostaPcd = await fetch(
        `${API_URL}/pcd/usuario/${usuario.id_usuario}`
      );
      const dadosPcd = await respostaPcd.json();

      if (!respostaPcd.ok) {
        throw new Error(dadosPcd.mensagem || 'Erro ao buscar perfil PcD');
      }

      const resposta = await fetch(
        `${API_URL}/solicitacoes/pcd/${dadosPcd.id_pcd}`
      );
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Erro ao carregar agendamentos');
      }

      setAgendamentos(dados.filter((item) => item.status === 'aceita'));
      setErro('');
    } catch (e) {
      setErro(e.message || 'Erro ao carregar agendamentos');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAgenda();
  }, [usuario?.id_usuario]);

  if (carregando) {
    return (
      <SafeAreaView style={styles.centro}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.textoAuxiliar}>Carregando agenda...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.titulo}>Agenda</Text>
          <Text style={styles.subtitulo}>Seus agendamentos confirmados</Text>
        </View>
      </View>

      {erro ? (
        <View style={styles.avisoErro}>
          <Text style={styles.textoErro}>{erro}</Text>
          <TouchableOpacity onPress={carregarAgenda}>
            <Text style={styles.tentarNovamente}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={agendamentos}
        keyExtractor={(item) => String(item.id_solicitacao)}
        contentContainerStyle={
          agendamentos.length === 0 ? styles.listaVazia : styles.lista
        }
        ListEmptyComponent={
          !erro ? (
            <Text style={styles.vazio}>
              Você ainda não tem agendamentos confirmados.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.linha}>
              <Text style={styles.nome}>{item.nome_voluntario}</Text>
              <Text style={styles.status}>Confirmado</Text>
            </View>

            <Text style={styles.detalhe}>
              {item.data_agendamento} • {item.horario_inicio}–{item.horario_fim}
            </Text>
            <Text style={styles.detalhe}>Tipo: {item.tipo_ajuda}</Text>
            {item.descricao ? (
              <Text style={styles.detalhe}>Descrição: {item.descricao}</Text>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  textoAuxiliar: { marginTop: 10, color: '#6B7280' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    backgroundColor: '#2563EB',
  },
  titulo: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  subtitulo: { color: '#DBEAFE', marginTop: 3 },
  lista: { padding: 16 },
  listaVazia: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  vazio: { textAlign: 'center', color: '#6B7280' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nome: { color: '#111827', fontSize: 16, fontWeight: '700' },
  status: { color: '#047857', fontWeight: '700', fontSize: 12 },
  detalhe: { color: '#6B7280', marginTop: 7 },
  avisoErro: { margin: 16, padding: 14, backgroundColor: '#FEE2E2', borderRadius: 12 },
  textoErro: { color: '#991B1B' },
  tentarNovamente: { color: '#2563EB', fontWeight: '700', marginTop: 10 },
});