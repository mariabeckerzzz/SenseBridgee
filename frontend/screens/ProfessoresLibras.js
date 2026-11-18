import PlayerVideo from '../components/PlayerVideo';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import {
  API_URL, avisar, COR_STATUS, ROTULO_MODALIDADE,
  resumoDisponibilidades,
} from '../utils/ensino';

export default function ProfessoresLibras() {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id_usuario;

  const [professores, setProfessores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [alvo, setAlvo] = useState(null);
  const [conteudo, setConteudo] = useState('');
  const [disp, setDisp] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [videos, setVideos] = useState([]);

  const carregar = useCallback(async () => {
    if (!idUsuario) { setCarregando(false); return; }
    try {
      const resposta = await fetch(`${API_URL}/ensino/candidaturas?id_usuario=${idUsuario}`);
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem || 'Erro ao carregar professores');
      setProfessores(dados || []);

      try {
        const rv = await fetch(`${API_URL}/ensino/videos/voluntario/${idUsuario}`);
        const dv = await rv.json();
        if (rv.ok) setVideos(dv || []);
      } catch {}

      setErro('');
    } catch (e) {
      setErro(e.message || 'Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  }, [idUsuario]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrir(prof) {
    setAlvo(prof);
    setConteudo('');
    setDisp('');
  }

  async function enviar() {
    if (!conteudo) return avisar('Atenção', 'Escolha o conteúdo que deseja aprender.');
    setEnviando(true);
    try {
      const resposta = await fetch(`${API_URL}/ensino/solicitacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: idUsuario,
          id_candidatura: alvo.id_candidatura,
          conteudo_desejado: conteudo,
          disponibilidade: disp.trim() || null,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem || 'Erro ao enviar');
      setAlvo(null);
      avisar('Sucesso', 'Solicitação enviada. Acompanhe o status no card do professor.');
      await carregar();
    } catch (e) {
      avisar('Erro', e.message);
    } finally {
      setEnviando(false);
    }
  }

  const itensDoAlvo = alvo ? Object.values(alvo.categorias || {}).flat() : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo} accessibilityRole="header">Aprender com professores</Text>
        <Text style={styles.subtitulo}>Pessoas surdas que querem ensinar Libras para você.</Text>
      </View>

      <View style={styles.secao}>
        <TouchableOpacity
          style={styles.atualizar}
          onPress={carregar}
          accessibilityRole="button"
          accessibilityLabel="Atualizar lista de professores"
        >
          <Ionicons name="refresh" size={18} color="#2563EB" />
          <Text style={styles.atualizarTexto}>Atualizar</Text>
        </TouchableOpacity>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#2563EB"
            style={{ marginTop: 20 }}
            accessibilityLabel="Carregando professores"
          />
        ) : erro ? (
          <View style={styles.cardAviso} accessibilityLiveRegion="polite">
            <Text style={styles.avisoErro}>{erro}</Text>
          </View>
        ) : professores.length === 0 ? (
          <View style={styles.cardAviso}>
            <Text style={styles.avisoTexto}>Nenhum professor disponível no momento.</Text>
          </View>
        ) : (
          professores.map((p) => {
            const estilo = p.minha_solicitacao ? COR_STATUS[p.minha_solicitacao] : null;
            const horarios = resumoDisponibilidades(p.disponibilidades);
            const conteudos = Object.values(p.categorias || {}).flat().join(', ');

            return (
              <View key={p.id_candidatura} style={styles.card}>
                <View style={styles.linha}>
                  <View style={styles.avatar} accessible accessibilityLabel={`Professor ${p.nome_professor}`}>
                    <Text style={styles.avatarTexto}>{(p.nome_professor || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>{p.nome_professor}</Text>
                    <Text style={styles.detalhe}>{ROTULO_MODALIDADE[p.modalidade]}</Text>
                  </View>
                </View>

                <Text style={styles.descricao}>{p.descricao}</Text>

                {Object.entries(p.categorias || {}).map(([cat, itens]) => (
                  <Text key={cat} style={styles.detalhe}>• {itens.join(', ')}</Text>
                ))}
                <Text style={styles.detalhe}>Horários: {horarios}</Text>

                {estilo ? (
                  <View
                    style={[styles.status, { backgroundColor: estilo.fundo }]}
                    accessible
                    accessibilityLabel={`Sua solicitação: ${estilo.rotulo}`}
                  >
                    <Text style={[styles.statusTexto, { color: estilo.texto }]}>
                      Sua solicitação: {estilo.rotulo}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.botao}
                    onPress={() => abrir(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quero aprender com ${p.nome_professor}`}
                  >
                    <Text style={styles.botaoTexto}>Quero aprender</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        <View style={styles.secao}>
          <Text style={styles.nome} accessibilityRole="header">Vídeos dos meus professores</Text>
          {videos.length === 0 ? (
            <View style={[styles.cardAviso, { marginTop: 10 }]}>
              <Text style={styles.avisoTexto}>
                Quando um professor aceitar você e publicar vídeos, eles aparecerão aqui.
              </Text>
            </View>
          ) : (
            videos.map((v) => (
              <View key={v.id_video} style={styles.card}>
                <Text style={styles.nome}>{v.palavra}</Text>
                <Text style={[styles.detalhe, { marginBottom: 10 }]}>
                  {v.nome_professor} • {v.data_publicacao}
                </Text>
                <PlayerVideo uri={`${API_URL}${v.caminho}`} />
              </View>
            ))
          )}
        </View>
      </View>

      <Modal visible={!!alvo} transparent animationType="fade" onRequestClose={() => setAlvo(null)}>
        <View style={styles.fundoModal}>
          <View style={styles.caixaModal}>
            <Text style={styles.nome} accessibilityRole="header">Aprender com {alvo?.nome_professor}</Text>

            <Text style={styles.rotulo}>O que você quer aprender?</Text>
            <View style={styles.chips}>
              {itensDoAlvo.map((item) => {
                const ativo = conteudo === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => setConteudo(item)}
                    accessibilityRole="button"
                    accessibilityLabel={item}
                    accessibilityState={{ selected: ativo }}
                  >
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.rotulo}>Sua disponibilidade (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: terças e quintas à tarde"
              value={disp}
              onChangeText={setDisp}
              accessibilityLabel="Sua disponibilidade, opcional"
            />

            <View style={styles.linha}>
              <TouchableOpacity
                style={[styles.botaoCancelar, { flex: 1 }]}
                onPress={() => setAlvo(null)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
              >
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botao, { flex: 1, marginTop: 0 }]}
                onPress={enviar}
                disabled={enviando}
                accessibilityRole="button"
                accessibilityLabel="Enviar solicitação"
                accessibilityState={{ disabled: enviando }}
              >
                {enviando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.botaoTexto}>Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  cabecalho: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 26, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  titulo: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  subtitulo: { color: '#DBEAFE', fontSize: 14, lineHeight: 20, marginTop: 6 },
  secao: { paddingHorizontal: 18, marginTop: 18 },
  atualizar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 10, minHeight: 44 },
  atualizarTexto: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  cardAviso: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  avisoTexto: { color: '#6B7280', textAlign: 'center', fontSize: 14 },
  avisoErro: { color: '#B91C1C', textAlign: 'center', fontSize: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: '#2563EB', fontWeight: '700', fontSize: 18 },
  nome: { color: '#111827', fontSize: 16, fontWeight: '700' },
  descricao: { color: '#374151', fontSize: 14, lineHeight: 20, marginTop: 10 },
  detalhe: { color: '#6B7280', fontSize: 13, lineHeight: 18, marginTop: 4 },
  botao: { minHeight: 44, marginTop: 14, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  botaoCancelar: { minHeight: 44, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  botaoCancelarTexto: { color: '#374151', fontWeight: '700' },
  status: { marginTop: 14, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  statusTexto: { fontWeight: '700', fontSize: 13 },
  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  caixaModal: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18 },
  rotulo: { color: '#111827', fontWeight: '700', fontSize: 14, marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  chipAtivo: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipTexto: { color: '#374151', fontSize: 13, fontWeight: '600' },
  chipTextoAtivo: { color: '#FFFFFF' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 16 },
});