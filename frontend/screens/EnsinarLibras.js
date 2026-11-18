import VideosProfessor from './VideosProfessor';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import {
  API_URL, avisar, confirmar, CATEGORIAS_ENSINO, DIAS, MODALIDADES,
  ROTULO_MODALIDADE, COR_STATUS, HORA_VALIDA, resumoDisponibilidades, resumoConteudos,
} from '../utils/ensino';

const FORM_VAZIO = {
  selecionados: {}, descricao: '', dias: [], inicio: '', fim: '', modalidade: 'online', max: '',
};

export default function EnsinarLibras() {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id_usuario;

  const [candidatura, setCandidatura] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [formVisivel, setFormVisivel] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!idUsuario) { setCarregando(false); return; }
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/ensino/candidaturas/pcd/${idUsuario}`),
        fetch(`${API_URL}/ensino/solicitacoes/professor/${idUsuario}`),
      ]);
      const d1 = await r1.json();
      const d2 = await r2.json();
      if (!r1.ok) throw new Error(d1.mensagem || 'Erro ao carregar candidatura');
      if (!r2.ok) throw new Error(d2.mensagem || 'Erro ao carregar solicitações');
      setCandidatura(d1);
      setSolicitacoes(d2 || []);
      setErro('');
    } catch (e) {
      setErro(e.message || 'Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  }, [idUsuario]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirFormulario(categoriaInicial) {
    if (candidatura) {
      const disp = candidatura.disponibilidades || [];
      setForm({
        selecionados: { ...candidatura.categorias },
        descricao: candidatura.descricao,
        dias: disp.map((d) => d.dia_semana),
        inicio: disp[0]?.horario_inicio || '',
        fim: disp[0]?.horario_fim || '',
        modalidade: candidatura.modalidade,
        max: candidatura.max_voluntarios ? String(candidatura.max_voluntarios) : '',
      });
    } else {
      const base = { ...FORM_VAZIO, selecionados: {} };
      if (categoriaInicial) {
        const cat = CATEGORIAS_ENSINO.find((c) => c.id === categoriaInicial);
        base.selecionados[categoriaInicial] = [...cat.itens];
      }
      setForm(base);
    }
    setFormVisivel(true);
  }

  function alternarItem(catId, item) {
    setForm((f) => {
      const atual = f.selecionados[catId] || [];
      const novo = atual.includes(item) ? atual.filter((i) => i !== item) : [...atual, item];
      return { ...f, selecionados: { ...f.selecionados, [catId]: novo } };
    });
  }

  function alternarDia(dia) {
    setForm((f) => ({
      ...f,
      dias: f.dias.includes(dia) ? f.dias.filter((d) => d !== dia) : [...f.dias, dia],
    }));
  }

  async function salvar() {
    const categorias = Object.entries(form.selecionados)
      .filter(([, itens]) => itens.length > 0)
      .map(([categoria, itens]) => ({ categoria, itens }));

    if (categorias.length === 0) return avisar('Atenção', 'Selecione ao menos um conteúdo para ensinar.');
    if (!form.descricao.trim()) return avisar('Atenção', 'Descreva o conteúdo que pretende compartilhar.');
    if (form.dias.length === 0) return avisar('Atenção', 'Selecione ao menos um dia disponível.');
    if (!HORA_VALIDA.test(form.inicio) || !HORA_VALIDA.test(form.fim)) {
      return avisar('Atenção', 'Informe os horários no formato HH:MM (ex.: 14:00).');
    }
    if (form.inicio >= form.fim) return avisar('Atenção', 'O horário de início deve ser anterior ao de fim.');

    const corpo = {
      id_usuario: idUsuario,
      descricao: form.descricao.trim(),
      modalidade: form.modalidade,
      max_voluntarios: form.max ? Number(form.max) : null,
      categorias,
      disponibilidades: DIAS.filter((d) => form.dias.includes(d)).map((d) => ({
        dia_semana: d, horario_inicio: form.inicio, horario_fim: form.fim,
      })),
    };

    setSalvando(true);
    try {
      const url = candidatura
        ? `${API_URL}/ensino/candidaturas/${candidatura.id_candidatura}`
        : `${API_URL}/ensino/candidaturas`;
      const resposta = await fetch(url, {
        method: candidatura ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem || 'Erro ao salvar');
      setFormVisivel(false);
      avisar('Sucesso', dados.mensagem);
      await carregar();
    } catch (e) {
      avisar('Erro', e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function alternarPausa() {
    const novo = candidatura.status === 'ativa' ? 'pausada' : 'ativa';
    try {
      const resposta = await fetch(`${API_URL}/ensino/candidaturas/${candidatura.id_candidatura}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: idUsuario, status: novo }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem);
      await carregar();
    } catch (e) {
      avisar('Erro', e.message || 'Não foi possível atualizar');
    }
  }

  function excluir() {
    confirmar('Excluir candidatura', 'Isso também remove as solicitações recebidas. Deseja continuar?', async () => {
      try {
        const resposta = await fetch(
          `${API_URL}/ensino/candidaturas/${candidatura.id_candidatura}?id_usuario=${idUsuario}`,
          { method: 'DELETE' }
        );
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem);
        avisar('Sucesso', dados.mensagem);
        await carregar();
      } catch (e) {
        avisar('Erro', e.message || 'Não foi possível excluir');
      }
    });
  }

  async function responder(id, status) {
    try {
      const resposta = await fetch(`${API_URL}/ensino/solicitacoes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: idUsuario, status }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem);
      avisar('Sucesso', dados.mensagem);
      await carregar();
    } catch (e) {
      avisar('Erro', e.message || 'Não foi possível atualizar');
    }
  }

  const selecionadas = candidatura ? Object.keys(candidatura.categorias || {}) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudoTela} showsVerticalScrollIndicator={false}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Ensinar Libras</Text>
        <Text style={styles.subtitulo}>Compartilhe seu conhecimento de Libras com outras pessoas.</Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />
      ) : (
        <>
          {erro ? (
            <View style={[styles.secao, styles.cardAviso]}>
              <Text style={styles.avisoErro}>{erro}</Text>
            </View>
          ) : null}

          <View style={styles.secao}>
            <Text style={styles.tituloSecao}>Como você pode ensinar</Text>
            <Text style={styles.descricaoSecao}>
              Escolha o que você gostaria de compartilhar com os voluntários.
            </Text>
            <View style={styles.lista}>
              {CATEGORIAS_ENSINO.map((item) => {
                const marcada = selecionadas.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, marcada && styles.cardMarcado]}
                    onPress={() => abrirFormulario(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.titulo}${marcada ? ', selecionado' : ''}`}
                  >
                    <View style={styles.iconeCard}>
                      <Ionicons name={item.icone} size={22} color="#2563EB" />
                    </View>
                    <View style={styles.textoCard}>
                      <Text style={styles.nomeCard}>{item.titulo}</Text>
                      <Text style={styles.descricaoCard}>{item.descricao}</Text>
                    </View>
                    {marcada ? <Ionicons name="checkmark-circle" size={22} color="#059669" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.secao}>
            {candidatura ? (
              <View style={styles.cardCandidatura}>
                <View style={styles.linhaTopo}>
                  <Text style={styles.nomeCard}>Minha candidatura</Text>
                  <View style={[styles.badge, { backgroundColor: candidatura.status === 'ativa' ? '#D1FAE5' : '#FEF3C7' }]}>
                    <Text style={[styles.badgeTexto, { color: candidatura.status === 'ativa' ? '#059669' : '#92400E' }]}>
                      {candidatura.status === 'ativa' ? 'Publicada' : 'Pausada'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.descricaoCard}>{candidatura.descricao}</Text>
                <Text style={styles.detalhe}>Conteúdos: {resumoConteudos(candidatura.categorias)}</Text>
                <Text style={styles.detalhe}>Horários: {resumoDisponibilidades(candidatura.disponibilidades)}</Text>
                <Text style={styles.detalhe}>
                  Modalidade: {ROTULO_MODALIDADE[candidatura.modalidade]}
                  {candidatura.max_voluntarios ? ` • Máx. ${candidatura.max_voluntarios} voluntários` : ''}
                </Text>

                <View style={styles.acoes}>
                  <TouchableOpacity style={styles.botaoSecundario} onPress={() => abrirFormulario()}>
                    <Ionicons name="create-outline" size={16} color="#2563EB" />
                    <Text style={styles.botaoSecundarioTexto}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoSecundario} onPress={alternarPausa}>
                    <Ionicons name={candidatura.status === 'ativa' ? 'pause-outline' : 'play-outline'} size={16} color="#2563EB" />
                    <Text style={styles.botaoSecundarioTexto}>{candidatura.status === 'ativa' ? 'Pausar' : 'Reativar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoPerigo} onPress={excluir}>
                    <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                    <Text style={styles.botaoPerigoTexto}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.botaoPrincipal} onPress={() => abrirFormulario()} accessibilityRole="button">
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.botaoPrincipalTexto}>Quero ensinar Libras</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <VideosProfessor />

          <View style={styles.secao}>
            <View style={styles.linhaTopo}>
              <Text style={styles.tituloSecao}>Voluntários interessados</Text>
              <TouchableOpacity onPress={carregar} accessibilityLabel="Atualizar lista">
                <Ionicons name="refresh" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {solicitacoes.length === 0 ? (
              <View style={styles.estadoVazio}>
                <Ionicons name="people-outline" size={28} color="#6B7280" />
                <Text style={styles.textoEstadoVazio}>
                  Nenhum voluntário demonstrou interesse ainda. Quando alguém solicitar para aprender com você, as solicitações aparecerão aqui.
                </Text>
              </View>
            ) : (
              solicitacoes.map((s) => {
                const estilo = COR_STATUS[s.status] || COR_STATUS.pendente;
                return (
                  <View key={s.id_solicitacao_aprender} style={styles.cardVoluntario}>
                    <View style={styles.linhaTopo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarTexto}>{(s.nome_voluntario || '?').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nomeCard}>{s.nome_voluntario}</Text>
                        <Text style={styles.detalhe}>Solicitado em {s.data_solicitacao}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: estilo.fundo }]}>
                        <Text style={[styles.badgeTexto, { color: estilo.texto }]}>{estilo.rotulo}</Text>
                      </View>
                    </View>
                    <Text style={styles.detalhe}>Quer aprender: {s.conteudo_desejado}</Text>
                    {s.disponibilidade ? <Text style={styles.detalhe}>Disponibilidade: {s.disponibilidade}</Text> : null}

                    {s.status === 'pendente' ? (
                      <View style={styles.acoes}>
                        <TouchableOpacity style={styles.botaoAceitar} onPress={() => responder(s.id_solicitacao_aprender, 'aceita')}>
                          <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.botaoRecusar} onPress={() => responder(s.id_solicitacao_aprender, 'recusada')}>
                          <Text style={styles.botaoRecusarTexto}>Recusar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </>
      )}

      <Modal visible={formVisivel} animationType="slide" onRequestClose={() => setFormVisivel(false)}>
        <View style={styles.modal}>
          <View style={styles.modalTopo}>
            <Text style={styles.tituloSecao}>{candidatura ? 'Editar candidatura' : 'Quero ensinar Libras'}</Text>
            <TouchableOpacity onPress={() => setFormVisivel(false)} accessibilityLabel="Fechar">
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
            <Text style={styles.rotulo}>O que você quer ensinar</Text>
            {CATEGORIAS_ENSINO.map((cat) => (
              <View key={cat.id} style={{ marginBottom: 12 }}>
                <Text style={styles.nomeCard}>{cat.titulo}</Text>
                <View style={styles.chips}>
                  {cat.itens.map((item) => {
                    const ativo = (form.selecionados[cat.id] || []).includes(item);
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[styles.chip, ativo && styles.chipAtivo]}
                        onPress={() => alternarItem(cat.id, item)}
                        accessibilityState={{ selected: ativo }}
                      >
                        <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <Text style={styles.rotulo}>Descrição do conteúdo</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              multiline
              placeholder="Conte o que pretende compartilhar"
              value={form.descricao}
              onChangeText={(t) => setForm((f) => ({ ...f, descricao: t }))}
            />

            <Text style={styles.rotulo}>Dias disponíveis</Text>
            <View style={styles.chips}>
              {DIAS.map((dia) => {
                const ativo = form.dias.includes(dia);
                return (
                  <TouchableOpacity key={dia} style={[styles.chip, ativo && styles.chipAtivo]} onPress={() => alternarDia(dia)}>
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{dia}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.rotulo}>Horário (o mesmo para os dias escolhidos)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Início 14:00" maxLength={5}
                value={form.inicio} onChangeText={(t) => setForm((f) => ({ ...f, inicio: t }))} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Fim 16:00" maxLength={5}
                value={form.fim} onChangeText={(t) => setForm((f) => ({ ...f, fim: t }))} />
            </View>

            <Text style={styles.rotulo}>Modalidade</Text>
            <View style={styles.chips}>
              {MODALIDADES.map((m) => {
                const ativo = form.modalidade === m.id;
                return (
                  <TouchableOpacity key={m.id} style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => setForm((f) => ({ ...f, modalidade: m.id }))}>
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{m.rotulo}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.rotulo}>Máximo de voluntários (opcional)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex.: 5"
              value={form.max} onChangeText={(t) => setForm((f) => ({ ...f, max: t.replace(/\D/g, '') }))} />

            <TouchableOpacity style={[styles.botaoPrincipal, { marginTop: 22 }]} onPress={salvar} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#FFFFFF" /> : (
                <Text style={styles.botaoPrincipalTexto}>{candidatura ? 'Salvar alterações' : 'Publicar candidatura'}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  conteudoTela: { paddingBottom: 28 },
  cabecalho: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 26, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  titulo: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  subtitulo: { color: '#DBEAFE', fontSize: 14, lineHeight: 20, marginTop: 6 },
  secao: { paddingHorizontal: 18, marginTop: 22 },
  tituloSecao: { color: '#111827', fontSize: 20, fontWeight: '700' },
  descricaoSecao: { color: '#6B7280', fontSize: 14, lineHeight: 20, marginTop: 5 },
  lista: { marginTop: 14, rowGap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  cardMarcado: { borderColor: '#059669', backgroundColor: '#F0FDF4' },
  iconeCard: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderRadius: 21, backgroundColor: '#DBEAFE' },
  textoCard: { flex: 1 },
  nomeCard: { color: '#111827', fontSize: 15, fontWeight: '700' },
  descricaoCard: { color: '#6B7280', fontSize: 13, lineHeight: 18, marginTop: 4 },
  detalhe: { color: '#6B7280', fontSize: 13, lineHeight: 18, marginTop: 4 },
  cardAviso: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  avisoErro: { color: '#B91C1C', textAlign: 'center', fontSize: 14 },
  cardCandidatura: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTexto: { fontSize: 11, fontWeight: '700' },
  acoes: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  botaoPrincipal: { flexDirection: 'row', gap: 8, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#2563EB' },
  botaoPrincipalTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  botaoSecundario: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#DBEAFE' },
  botaoSecundarioTexto: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  botaoPerigo: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FEE2E2' },
  botaoPerigoTexto: { color: '#B91C1C', fontWeight: '700', fontSize: 13 },
  estadoVazio: { alignItems: 'center', padding: 20, marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  textoEstadoVazio: { color: '#6B7280', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 9 },
  cardVoluntario: { marginTop: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  avatar: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#DBEAFE' },
  avatarTexto: { color: '#2563EB', fontWeight: '700', fontSize: 17 },
  botaoAceitar: { flex: 1, backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  botaoAceitarTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  botaoRecusar: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  botaoRecusarTexto: { color: '#B91C1C', fontWeight: '700', fontSize: 14 },
  modal: { flex: 1, backgroundColor: '#F5F7FA' },
  modalTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  rotulo: { color: '#111827', fontWeight: '700', fontSize: 14, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  chipAtivo: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipTexto: { color: '#374151', fontSize: 13, fontWeight: '600' },
  chipTextoAtivo: { color: '#FFFFFF' },
});