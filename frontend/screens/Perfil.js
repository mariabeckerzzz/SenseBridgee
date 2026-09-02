import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://192.168.56.1:3000';

export default function Perfil({ navigation }) {

  const { usuario, atualizarUsuario, logout } = useAuth();

  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);

  const [nomeEdit, setNomeEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [cpfEdit, setCpfEdit] = useState('');
  const [numeroEdit, setNumeroEdit] = useState('');

  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [legendasAtivas, setLegendasAtivas] = useState(true);

  function formatarCpf(texto) {
    const numeros = (texto || '').replace(/\D/g, '').slice(0, 11);
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function formatarNumero(texto) {
    const numeros = (texto || '').replace(/\D/g, '').slice(0, 11);
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function iniciarEdicao() {
    setNomeEdit(usuario.nome);
    setEmailEdit(usuario.email);
    setCpfEdit(formatarCpf(usuario.cpf));
    setNumeroEdit(formatarNumero(usuario.numero));
    setEditando(true);
  }

  function cancelarEdicao() {
    setEditando(false);
  }

  async function salvarEdicao() {
    if (!nomeEdit || !emailEdit || !cpfEdit || !numeroEdit) {
      Alert.alert('Preencha todos os campos');
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeEdit,
          email: emailEdit,
          cpf: cpfEdit,
          numero: numeroEdit,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(dados.mensagem || 'Erro ao salvar alterações');
        return;
      }

      await atualizarUsuario({
        nome: nomeEdit,
        email: emailEdit,
        cpf: cpfEdit.replace(/\D/g, ''),
        numero: numeroEdit.replace(/\D/g, ''),
      });

      setEditando(false);
      Alert.alert(dados.mensagem || 'Dados atualizados com sucesso');
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações');
    } finally {
      setSalvando(false);
    }
  }

  async function sair() {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'login' }],
    });
  }

  if (!usuario) {
    return null;
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

          <Text style={styles.nome}>{usuario.nome}</Text>
          <Text style={styles.email}>{usuario.email}</Text>

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

        {/* Dados pessoais */}
        <View style={styles.card}>
          <View style={styles.dadosPessoaisTopo}>
            <Text style={styles.cardTitulo}>Dados pessoais</Text>
            {!editando && (
              <TouchableOpacity onPress={iniciarEdicao}>
                <Ionicons name="pencil" size={18} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>

          {editando ? (
            <>
              <Text style={styles.rotulo}>Nome completo</Text>
              <TextInput
                style={styles.input}
                value={nomeEdit}
                onChangeText={setNomeEdit}
              />

              <Text style={styles.rotulo}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={emailEdit}
                onChangeText={setEmailEdit}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.rotulo}>CPF</Text>
              <TextInput
                style={styles.input}
                value={cpfEdit}
                onChangeText={(texto) => setCpfEdit(formatarCpf(texto))}
                keyboardType="numeric"
                maxLength={14}
              />

              <Text style={styles.rotulo}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={numeroEdit}
                onChangeText={(texto) => setNumeroEdit(formatarNumero(texto))}
                keyboardType="phone-pad"
                maxLength={15}
              />

              <View style={styles.botoesEdicao}>
                <TouchableOpacity
                  style={styles.botaoCancelar}
                  onPress={cancelarEdicao}
                  disabled={salvando}
                >
                  <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoSalvar}
                  onPress={salvarEdicao}
                  disabled={salvando}
                >
                  <Text style={styles.botaoSalvarTexto}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.dadoLinha}>
                <Text style={styles.dadoLabel}>Nome</Text>
                <Text style={styles.dadoValor}>{usuario.nome}</Text>
              </View>
              <View style={styles.dadoLinha}>
                <Text style={styles.dadoLabel}>E-mail</Text>
                <Text style={styles.dadoValor}>{usuario.email}</Text>
              </View>
              <View style={styles.dadoLinha}>
                <Text style={styles.dadoLabel}>CPF</Text>
                <Text style={styles.dadoValor}>{formatarCpf(usuario.cpf)}</Text>
              </View>
              <View style={[styles.dadoLinha, { borderBottomWidth: 0 }]}>
                <Text style={styles.dadoLabel}>Telefone</Text>
                <Text style={styles.dadoValor}>{formatarNumero(usuario.numero)}</Text>
              </View>
            </>
          )}
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

          <TouchableOpacity
            style={[styles.opcaoLinha, { borderBottomWidth: 0 }]}
            onPress={iniciarEdicao}
          >
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
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
  nome: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  email: { fontSize: 13, color: '#DBEAFE', marginTop: 2 },
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
  badgeTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
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
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  sobreTexto: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tag: { backgroundColor: '#DBEAFE', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  tagTexto: { color: '#2563EB', fontSize: 12, fontWeight: '600' },
  dadosPessoaisTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rotulo: { fontSize: 12, color: '#6B7280', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  botoesEdicao: { flexDirection: 'row', gap: 10, marginTop: 16 },
  botaoCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoCancelarTexto: { color: '#6B7280', fontWeight: '600' },
  botaoSalvar: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoSalvarTexto: { color: '#FFFFFF', fontWeight: '600' },
  dadoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dadoLabel: { fontSize: 14, color: '#6B7280' },
  dadoValor: { fontSize: 14, color: '#111827', fontWeight: '600' },
  statsLinha: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumero: { fontSize: 22, fontWeight: '700', color: '#2563EB' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  opcaoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  opcaoEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  opcaoTexto: { fontSize: 14, color: '#374151', fontWeight: '500' },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#E5E7EB', padding: 3 },
  toggleAtivo: { backgroundColor: '#2563EB' },
  toggleBola: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  toggleBolaAtiva: { transform: [{ translateX: 18 }] },
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
  botaoSairTexto: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});