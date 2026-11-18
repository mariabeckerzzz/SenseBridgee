import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Modal, Platform, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, avisar, confirmar } from '../utils/ensino';
import PlayerVideo from '../components/PlayerVideo';

const LIMITE_SEGUNDOS = 90;
const ESTILO_VIDEO = {
  width: '100%', maxWidth: 720, aspectRatio: '16 / 9',
  backgroundColor: '#000', borderRadius: 14, objectFit: 'cover',
};

function formatarTempo(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function VideosProfessor() {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id_usuario;

  const [videos, setVideos] = useState([]);
  const [palavra, setPalavra] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState('preparando'); 
  const [frontal, setFrontal] = useState(true);
  const [segundos, setSegundos] = useState(0);
  const [blobGravado, setBlobGravado] = useState(null);
  const [urlPrevia, setUrlPrevia] = useState(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const pedacosRef = useRef([]);

  const refVideo = useCallback((el) => {
    if (el && streamRef.current) el.srcObject = streamRef.current;
    refVideo.el = el;
  }, []);

  const carregar = useCallback(async () => {
    if (!idUsuario) { setCarregando(false); return; }
    try {
      const resposta = await fetch(`${API_URL}/ensino/videos/pcd/${idUsuario}`);
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem || 'Erro ao carregar vídeos');
      setVideos(dados || []);
    } catch (e) {
      avisar('Erro', e.message || 'Não foi possível carregar os vídeos');
    } finally {
      setCarregando(false);
    }
  }, [idUsuario]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    if (etapa !== 'gravando') return undefined;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [etapa]);

  useEffect(() => {
    if (etapa === 'gravando' && segundos >= LIMITE_SEGUNDOS) pararGravacao();
  }, [segundos, etapa]);

  useEffect(() => () => pararCamera(), []);

  function pararCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function iniciarCamera(usarFrontal) {
    pararCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: usarFrontal ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (refVideo.el) refVideo.el.srcObject = stream;
      setEtapa('pronto');
    } catch (e) {
      fecharGravador();
      avisar('Câmera indisponível', 'Permita o acesso à câmera e ao microfone no navegador e tente de novo.');
    }
  }

  function abrirGravador() {
    if (!palavra.trim()) return avisar('Atenção', 'Digite a palavra ou expressão que você vai ensinar.');
    setSegundos(0);
    setBlobGravado(null);
    setUrlPrevia(null);
    setEtapa('preparando');
    setAberto(true);
    iniciarCamera(frontal);
  }

  function alternarCamera() {
    const novo = !frontal;
    setFrontal(novo);
    iniciarCamera(novo);
  }

  function iniciarGravacao() {
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']
      .find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(
      streamRef.current,
      mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : undefined
    );
    pedacosRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size) pedacosRef.current.push(e.data); };
    recorder.onstop = () => {
      const tipo = (recorder.mimeType || 'video/webm').split(';')[0];
      const blob = new Blob(pedacosRef.current, { type: tipo });
      setBlobGravado(blob);
      setUrlPrevia(URL.createObjectURL(blob));
      pararCamera();
      setEtapa('revisando');
    };
    recorderRef.current = recorder;
    setSegundos(0);
    recorder.start();
    setEtapa('gravando');
  }

  function pararGravacao() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  }

  function regravar() {
    if (urlPrevia) URL.revokeObjectURL(urlPrevia);
    setBlobGravado(null);
    setUrlPrevia(null);
    setSegundos(0);
    setEtapa('preparando');
    iniciarCamera(frontal);
  }

  function fecharGravador() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    pararCamera();
    if (urlPrevia) URL.revokeObjectURL(urlPrevia);
    setUrlPrevia(null);
    setBlobGravado(null);
    setAberto(false);
  }

  async function gravarNoCelular() {
    if (!palavra.trim()) return avisar('Atenção', 'Digite a palavra ou expressão que você vai ensinar.');
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) return avisar('Permissão necessária', 'Autorize o uso da câmera para gravar.');

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: LIMITE_SEGUNDOS,
      quality: 1,
    });
    if (resultado.canceled) return;
    const arquivo = resultado.assets[0];
    await enviar({ uri: arquivo.uri, type: arquivo.mimeType });
  }

  async function enviar(fonte) {
    setEnviando(true);
    try {
      const form = new FormData();
      form.append('id_usuario', String(idUsuario));
      form.append('palavra', palavra.trim());
      if (fonte.blob) {
        form.append('video', fonte.blob, 'video');
      } else {
        form.append('video', { uri: fonte.uri, name: 'video.mp4', type: fonte.type || 'video/mp4' });
      }
      const resposta = await fetch(`${API_URL}/ensino/videos`, { method: 'POST', body: form });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem || 'Erro ao enviar vídeo');

      setPalavra('');
      if (aberto) fecharGravador();
      avisar('Sucesso', 'Vídeo publicado para seus voluntários.');
      await carregar();
    } catch (e) {
      avisar('Erro', e.message || 'Não foi possível enviar o vídeo');
    } finally {
      setEnviando(false);
    }
  }

  function excluir(video) {
    confirmar('Excluir vídeo', `Deseja excluir o vídeo "${video.palavra}"?`, async () => {
      try {
        const resposta = await fetch(`${API_URL}/ensino/videos/${video.id_video}?id_usuario=${idUsuario}`, { method: 'DELETE' });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem);
        await carregar();
      } catch (e) {
        avisar('Erro', e.message || 'Não foi possível excluir');
      }
    });
  }

  return (
    <View style={styles.secao}>
      <Text style={styles.titulo}>Gravar vídeos de sinais</Text>
      <Text style={styles.descricao}>
        Grave o sinal de uma palavra. Os voluntários que você aceitou poderão assistir quando quiserem.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Palavra ou expressão (ex.: Obrigado)"
        value={palavra}
        onChangeText={setPalavra}
        maxLength={100}
      />

      <TouchableOpacity
        style={styles.botao}
        onPress={Platform.OS === 'web' ? abrirGravador : gravarNoCelular}
        disabled={enviando}
        accessibilityRole="button"
      >
        {enviando ? <ActivityIndicator color="#FFFFFF" /> : (
          <>
            <Ionicons name="videocam" size={20} color="#FFFFFF" />
            <Text style={styles.botaoTexto}>Gravar vídeo</Text>
          </>
        )}
      </TouchableOpacity>

      {carregando ? (
        <ActivityIndicator color="#2563EB" style={{ marginTop: 16 }} />
      ) : videos.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioTexto}>Você ainda não publicou nenhum vídeo.</Text>
        </View>
      ) : (
        videos.map((v) => (
          <View key={v.id_video} style={styles.cardVideo}>
            <View style={styles.linha}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nomeVideo}>{v.palavra}</Text>
                <Text style={styles.data}>Publicado em {v.data_publicacao}</Text>
              </View>
              <TouchableOpacity onPress={() => excluir(v)} accessibilityLabel={`Excluir vídeo ${v.palavra}`}>
                <Ionicons name="trash-outline" size={20} color="#B91C1C" />
              </TouchableOpacity>
            </View>
            <PlayerVideo uri={`${API_URL}${v.caminho}`} />
          </View>
        ))
      )}

      {Platform.OS === 'web' && (
        <Modal visible={aberto} animationType="slide" onRequestClose={fecharGravador}>
          <View style={styles.gravador}>
            <Text style={styles.gravadorTitulo}>Ensinando: {palavra}</Text>

            {etapa === 'revisando' ? (
              <video src={urlPrevia} controls playsInline style={ESTILO_VIDEO} />
            ) : (
              <video
                ref={refVideo}
                autoPlay
                muted
                playsInline
                style={{ ...ESTILO_VIDEO, transform: frontal ? 'scaleX(-1)' : 'none' }}
              />
            )}

            {etapa === 'preparando' && <Text style={styles.status}>Abrindo a câmera...</Text>}
            {etapa === 'pronto' && (
              <Text style={styles.status}>Enquadre suas mãos e seu rosto, com boa iluminação.</Text>
            )}
            {etapa === 'gravando' && (
              <Text style={[styles.status, { color: '#FCA5A5' }]}>
                ● Gravando {formatarTempo(segundos)} / {formatarTempo(LIMITE_SEGUNDOS)}
              </Text>
            )}
            {etapa === 'revisando' && <Text style={styles.status}>Assista e decida: publicar ou regravar.</Text>}

            <View style={styles.controles}>
              {etapa === 'pronto' && (
                <>
                  <TouchableOpacity style={styles.botaoClaro} onPress={alternarCamera}>
                    <Ionicons name="camera-reverse-outline" size={18} color="#111827" />
                    <Text style={styles.botaoClaroTexto}>Alternar câmera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoVermelho} onPress={iniciarGravacao}>
                    <Ionicons name="radio-button-on" size={18} color="#FFFFFF" />
                    <Text style={styles.botaoTexto}>Iniciar gravação</Text>
                  </TouchableOpacity>
                </>
              )}

              {etapa === 'gravando' && (
                <TouchableOpacity style={styles.botaoVermelho} onPress={pararGravacao}>
                  <Ionicons name="stop-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.botaoTexto}>Parar gravação</Text>
                </TouchableOpacity>
              )}

              {etapa === 'revisando' && (
                <>
                  <TouchableOpacity style={styles.botaoClaro} onPress={regravar} disabled={enviando}>
                    <Ionicons name="refresh" size={18} color="#111827" />
                    <Text style={styles.botaoClaroTexto}>Regravar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.botao}
                    onPress={() => enviar({ blob: blobGravado })}
                    disabled={enviando}
                  >
                    {enviando ? <ActivityIndicator color="#FFFFFF" /> : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.botaoTexto}>Publicar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.botaoClaro} onPress={fecharGravador} disabled={enviando}>
                <Text style={styles.botaoClaroTexto}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { paddingHorizontal: 18, marginTop: 22 },
  titulo: { color: '#111827', fontSize: 20, fontWeight: '700' },
  descricao: { color: '#6B7280', fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', marginBottom: 12 },
  botao: { flexDirection: 'row', gap: 8, minHeight: 48, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#2563EB' },
  botaoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  vazio: { marginTop: 14, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  vazioTexto: { color: '#6B7280', textAlign: 'center', fontSize: 13 },
  cardVideo: { marginTop: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', rowGap: 10 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nomeVideo: { color: '#111827', fontSize: 15, fontWeight: '700' },
  data: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  gravador: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', padding: 20, rowGap: 14 },
  gravadorTitulo: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  status: { color: '#E5E7EB', fontSize: 14, textAlign: 'center' },
  controles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  botaoClaro: { flexDirection: 'row', gap: 6, minHeight: 48, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#F3F4F6' },
  botaoClaroTexto: { color: '#111827', fontSize: 14, fontWeight: '700' },
  botaoVermelho: { flexDirection: 'row', gap: 8, minHeight: 48, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#DC2626' },
});