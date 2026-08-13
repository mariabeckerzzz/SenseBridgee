import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function telaInicial({ navigation }) {
  const { usuario } = useAuth();

  const acoes = [
    { titulo: 'Pedir Ajuda', subtitulo: 'Conecte-se agora', icone: 'call', tela: 'PedirAjuda' },
    { titulo: 'Voluntários', subtitulo: 'Agendar ajuda', icone: 'people', tela: 'Voluntarios' },
    { titulo: 'Aprender Libras', subtitulo: 'Aulas grátis', icone: 'sparkles', tela: 'AulasLibras' },
    { titulo: 'Meu Perfil', subtitulo: 'Configurações', icone: 'person', tela: 'Perfil' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Cabeçalho azul */}
        <View style={styles.header}>
          <View style={styles.headerTopo}>
            <View>
              <Text style={styles.saudacao}>Olá, {usuario?.nome ?? 'Visitante'}!</Text>
              <Text style={styles.subSaudacao}>Como podemos ajudar?</Text>
            </View>

            <TouchableOpacity style={styles.sino}>
              <Ionicons name="notifications" size={22} color="#2563EB" />
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid de ações */}
        <View style={styles.grid}>
          {acoes.map((acao, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigation.navigate(acao.tela)}
            >
              <View style={styles.iconeContainer}>
                <Ionicons name={acao.icone} size={22} color="#2563EB" />
              </View>
              <Text style={styles.cardTitulo}>{acao.titulo}</Text>
              <Text style={styles.cardSubtitulo}>{acao.subtitulo}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Atividades recentes */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Atividades Recentes</Text>

          <View style={styles.atividadeCard}>
            <View style={styles.atividadeIcone}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#2563EB" />
            </View>

            <View style={styles.atividadeInfo}>
              <Text style={styles.atividadeTitulo}>Chamada com João Silva</Text>
              <Text style={styles.atividadeData}>Hoje às 10:30 • 15 minutos</Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusTexto}>Concluída</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Barra inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="call" size={20} color="#2563EB" />
          <Text style={styles.tabTextoAtivo}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
          <Text style={styles.tabTexto}>Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="chatbubble-outline" size={20} color="#9CA3AF" />
          <Text style={styles.tabTexto}>Mensagens</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
          <Text style={styles.tabTexto}>Mais</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  saudacao: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },

  subSaudacao: {
    color: '#DBEAFE',
    fontSize: 14,
    marginTop: 4,
  },

  sino: {
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  badgeTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: -30,
  },

  card: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  iconeContainer: {
    backgroundColor: '#DBEAFE',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  cardSubtitulo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  secao: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
  },

  secaoTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  atividadeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  atividadeIcone: {
    backgroundColor: '#DBEAFE',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  atividadeInfo: {
    flex: 1,
  },

  atividadeTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  atividadeData: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  statusBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  statusTexto: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  tabItem: {
    alignItems: 'center',
  },

  tabTextoAtivo: {
    fontSize: 11,
    color: '#2563EB',
    marginTop: 4,
    fontWeight: '600',
  },

  tabTexto: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});