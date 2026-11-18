import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:3000';

export default function Mensagens({ navigation }) {
  const { usuario } = useAuth();
  const usuarioId = usuario?.id_usuario;

  const [conversas, setConversas] = useState([]);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregarConversas() {
    try {
      const resposta = await fetch(`${API_URL}/mensagens/conversas/${usuarioId}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Não foi possível carregar as conversas');
      }

      setConversas(dados);
      setErro('');
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarMensagens(idSolicitacao) {
    try {
      const resposta = await fetch(
        `${API_URL}/mensagens/solicitacao/${idSolicitacao}?usuarioId=${usuarioId}`
      );
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Não foi possível carregar as mensagens');
      }

      setMensagens(dados);
      setErro('');
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    if (usuarioId) carregarConversas();
    else setCarregando(false);
  }, [usuarioId]);

  useEffect(() => {
    if (!conversaAtiva) return;

    carregarMensagens(conversaAtiva.id_solicitacao);

    // Atualiza a conversa aberta para receber mensagens novas.
    const intervalo = setInterval(
      () => carregarMensagens(conversaAtiva.id_solicitacao),
      3000
    );

    return () => clearInterval(intervalo);
  }, [conversaAtiva?.id_solicitacao, usuarioId]);

  async function enviarMensagem() {
    const conteudo = texto.trim();
    if (!conteudo || !conversaAtiva || enviando) return;

    setEnviando(true);
    setErro('');

    try {
      const resposta = await fetch(
        `${API_URL}/mensagens/solicitacao/${conversaAtiva.id_solicitacao}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId, conteudo }),
        }
      );
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Não foi possível enviar a mensagem');
      }

      setTexto('');
      await carregarMensagens(conversaAtiva.id_solicitacao);
      await carregarConversas();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.centro}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {conversaAtiva ? (
          <TouchableOpacity onPress={() => setConversaAtiva(null)}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        )}

        <Text style={styles.titulo}>
          {conversaAtiva ? conversaAtiva.nome_contato : 'Mensagens'}
        </Text>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {!conversaAtiva ? (
        <FlatList
          data={conversas}
          keyExtractor={(item) => String(item.id_solicitacao)}
          contentContainerStyle={conversas.length === 0 ? styles.listaVazia : null}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Você ainda não tem conversas. Elas aparecerão aqui quando houver solicitações.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversa}
              onPress={() => setConversaAtiva(item)}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#2563EB" />
              </View>
              <View style={styles.infoConversa}>
                <Text style={styles.nome}>{item.nome_contato}</Text>
                <Text style={styles.previa} numberOfLines={1}>
                  {item.ultima_mensagem || 'Ainda não há mensagens'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <>
          <FlatList
            style={styles.listaMensagens}
            data={mensagens}
            keyExtractor={(item) => String(item.id_mensagem)}
            contentContainerStyle={styles.conteudoMensagens}
            ListEmptyComponent={
              <Text style={styles.vazio}>Inicie a conversa enviando uma mensagem.</Text>
            }
            renderItem={({ item }) => {
              const minhaMensagem = String(item.remetente) === String(usuarioId);

              return (
                <View
                  style={[
                    styles.balao,
                    minhaMensagem ? styles.balaoMeu : styles.balaoOutro,
                  ]}
                >
                  <Text style={minhaMensagem ? styles.textoMeu : styles.textoOutro}>
                    {item.conteudo}
                  </Text>
                </View>
              );
            }}
          />

          <View style={styles.compositor}>
            <TextInput
              style={styles.input}
              value={texto}
              onChangeText={setTexto}
              placeholder="Escreva uma mensagem..."
              multiline
            />
            <TouchableOpacity
              style={styles.botaoEnviar}
              onPress={enviarMensagem}
              disabled={!texto.trim() || enviando}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titulo: { fontSize: 18, fontWeight: '700', color: '#111827' },
  erro: { padding: 12, color: '#991B1B', backgroundColor: '#FEE2E2' },
  conversa: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoConversa: { flex: 1 },
  nome: { color: '#111827', fontWeight: '700' },
  previa: { color: '#6B7280', marginTop: 4 },
  listaVazia: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  vazio: { textAlign: 'center', color: '#6B7280', padding: 20 },
  listaMensagens: { flex: 1 },
  conteudoMensagens: { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
  balao: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 5,
  },
  balaoMeu: { alignSelf: 'flex-end', backgroundColor: '#2563EB' },
  balaoOutro: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF' },
  textoMeu: { color: '#FFFFFF' },
  textoOutro: { color: '#111827' },
  compositor: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botaoEnviar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
});