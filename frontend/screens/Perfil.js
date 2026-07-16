import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Perfil({ navigation }) {

  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [legendasAtivas, setLegendasAtivas] = useState(true);

  function sair() {
    navigation.reset({
      index: 0,
      routes: [{ name: 'login' }],
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Cabeçalho azul */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.avatarCirculo}>
            <Text style={{ fontSize: 40 }}>👩</Text>
          </View>

          <Text style={styles.nome}>Maria</Text>
          <Text style={styles.email}>mariadu@gmail.com</Text>

          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
            <Text style={styles.badgeTexto}>Conta verificada</Text>
          </View>
        </View>

        {/* Sobre */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Sobre</Text>
          <Text style={styles.sobreTexto}>
            Usuária do SenseBridge conectando-se com voluntários para
            comunicação e aprendizado de Libras.
          </Text>

          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagTexto}>Libras</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagTexto}>Legendas</Text>
            </View>
          </View>
        </View>

        {/* Estatísticas */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Estatísticas</Text>
          <View style={styles.statsLinha}>
            <View style={styles.statItem}>
              <Text style={styles.statNumero}>8</Text>
              <Text style={styles.statLabel}>Chamadas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumero}>3</Text>
              <Text style={styles.statLabel}>Aulas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumero}>2</Text>
              <Text style={styles.statLabel}>Meses</Text>
            </View>
          </View>
        </View>

        {/* Configurações */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Configurações</Text>

          <View style={styles.opcaoLinha}>
            <View style={styles.opcaoEsquerda}>
              <Ionicons name="notifications-outline" size={20} color="#374151" />
              <Text style={styles.opcaoTexto}>Notificações</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, notificacoesAtivas && styles.toggleAtivo]}
              onPress={() => setNotificacoesAtivas(!notificacoesAtivas)}
            >
              <View style={[styles.toggleBola, notificacoesAtivas && styles.toggleBolaAtiva]} />
            </TouchableOpacity>
          </View>

          <View style={styles.opcaoLinha}>
            <View style={styles.opcaoEsquerda}>
              <Ionicons name="text-outline" size={20} color="#374151" />
              <Text style={styles.opcaoTexto}>Legendas automáticas</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, legendasAtivas && styles.toggleAtivo]}
              onPress={() => setLegendasAtivas(!legendasAtivas)}
            >
              <View style={[styles.toggleBola, legendasAtivas && styles.toggleBolaAtiva]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.opcaoLinha}>
            <View style={styles.opcaoEsquerda}>
              <Ionicons name="person-outline" size={20} color="#374151" />
              <Text style={styles.opcaoTexto}>Editar dados pessoais</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Botão sair */}
        <TouchableOpacity style={styles.botaoSair} onPress={sair}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.botaoSairTexto}>Sair da conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  header: {
    backgroundColor: '#2563EB',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  voltar: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarCirculo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  nome: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  email: {
    fontSize: 13,
    color: '#DBEAFE',
    marginTop: 2,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 12,
    gap: 6,
  },

  badgeTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  cardTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },

  sobreTexto: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },

  tags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  tag: {
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  tagTexto: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },

  statsLinha: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
  },

  statNumero: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563EB',
  },

  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  opcaoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  opcaoEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  opcaoTexto: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    padding: 3,
  },

  toggleAtivo: {
    backgroundColor: '#2563EB',
  },

  toggleBola: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  toggleBolaAtiva: {
    transform: [{ translateX: 18 }],
  },

  botaoSair: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    paddingVertical: 14,
  },

  botaoSairTexto: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});