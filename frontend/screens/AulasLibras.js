import { useLayoutEffect, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { IMAGENS_ALFABETO } from '../assets/libras/alfabeto';
import { IMAGENS_NUMEROS } from '../assets/libras/numeros';
import { VIDEOS_CUMPRIMENTOS } from '../assets/libras/cumprimentos';
import { VIDEOS_COTIDIANO } from '../assets/libras/cotidiano';

import { useAuth } from '../contexts/AuthContext';
import EnsinarLibras from './EnsinarLibras';
import ProfessoresLibras from './ProfessoresLibras';

const CATEGORIAS = [
  { id: 'alfabeto', titulo: 'Alfabeto' },
  { id: 'numeros', titulo: 'Números' },
  { id: 'cumprimentos', titulo: 'Cumprimentos' },
  { id: 'cotidiano', titulo: 'Cotidiano' },
];

function criarConteudos(nomes, descricao, imagens = {}) {
  return nomes.map((nome) => ({
    id: nome,
    nome,
    descricao,
    imagem: imagens[nome] || null,
    videoUrl: null,
  }));
}

function comGifs(lista, gifs = {}) {
  return lista.map((item) => ({
    ...item,
    imagem: gifs[item.id] || null,
    videoUrl: null,
  }));
}

const CONTEUDOS = {
  alfabeto: criarConteudos(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    'Sinal da letra no alfabeto manual de Libras.',
    IMAGENS_ALFABETO
  ),

  numeros: criarConteudos(
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    'Sinal do número em Libras.',
    IMAGENS_NUMEROS
  ),

  cumprimentos: comGifs(
    [
      { id: 'ola', nome: 'Olá', descricao: 'Cumprimento.' },
      { id: 'bom-dia', nome: 'Bom dia', descricao: 'Cumprimento usado pela manhã.' },
      { id: 'boa-tarde', nome: 'Boa tarde', descricao: 'Cumprimento usado à tarde.' },
      { id: 'boa-noite', nome: 'Boa noite', descricao: 'Cumprimento usado à noite.' },
      { id: 'tchau', nome: 'Tchau', descricao: 'Despedida.' },
    ],
    VIDEOS_CUMPRIMENTOS
  ),

  cotidiano: comGifs(
    [
      { id: 'obrigado', nome: 'Obrigado', descricao: 'Agradecimento.' },
      { id: 'por-favor', nome: 'Por favor', descricao: 'Expressão de cortesia.' },
      { id: 'desculpa', nome: 'Desculpa', descricao: 'Pedido de desculpas.' },
      { id: 'sim', nome: 'Sim', descricao: 'Resposta afirmativa.' },
      { id: 'nao', nome: 'Não', descricao: 'Resposta negativa.' },
      { id: 'agua', nome: 'Água', descricao: 'Palavra do cotidiano.' },
      { id: 'comida', nome: 'Comida', descricao: 'Palavra do cotidiano.' },
      { id: 'ajuda', nome: 'Ajuda', descricao: 'Pedido ou oferta de ajuda.' },
      { id: 'familia', nome: 'Família', descricao: 'Palavra do cotidiano.' },
    ],
    VIDEOS_COTIDIANO
  ),
};

function videoValido(url) {
  return typeof url === 'string' && /^https?:\/\/\S+$/i.test(url);
}

function AprenderLibras() {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('alfabeto');
  const conteudos = CONTEUDOS[categoriaSelecionada] || [];
  const mostrarAvisoVideo = !['cumprimentos', 'cotidiano'].includes(categoriaSelecionada);

  async function abrirVideo(url) {
    if (!videoValido(url)) return;

    try {
      const podeAbrir = await Linking.canOpenURL(url);
      if (podeAbrir) {
        await Linking.openURL(url);
      }
    } catch {
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudoTela}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Aprender Libras</Text>
        <Text style={styles.subtitulo}>
          Explore conteúdos básicos e aprenda no seu ritmo.
        </Text>
      </View>

      <View style={styles.secao}>
        <Text style={styles.tituloSecao}>Aprender Libras</Text>
        <Text style={styles.descricaoSecao}>
          Escolha uma categoria para ver os conteúdos.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaCategorias}
          accessibilityLabel="Categorias de aprendizagem"
        >
          {CATEGORIAS.map((categoria) => {
            const selecionada = categoria.id === categoriaSelecionada;

            return (
              <TouchableOpacity
                key={categoria.id}
                style={[
                  styles.botaoCategoria,
                  selecionada && styles.botaoCategoriaSelecionado,
                ]}
                onPress={() => setCategoriaSelecionada(categoria.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: selecionada }}
                accessibilityLabel={`Categoria ${categoria.titulo}`}
              >
                <Text
                  style={[
                    styles.textoCategoria,
                    selecionada && styles.textoCategoriaSelecionado,
                  ]}
                >
                  {categoria.titulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.gradeCards}>
          {conteudos.map((item) => {
            const temVideo = videoValido(item.videoUrl);

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.areaImagem}>
                  {item.imagem ? (
                    <Image
                      source={item.imagem}
                      style={styles.imagem}
                      resizeMode="contain"
                      accessibilityLabel={`Imagem do sinal: ${item.nome}`}
                    />
                  ) : (
                    <View
                      style={styles.placeholderImagem}
                      accessibilityLabel={`Imagem do sinal ${item.nome} ainda não disponível`}
                    >
                      <Ionicons
                        name="image-outline"
                        size={28}
                        color="#6B7280"
                      />
                      <Text style={styles.textoImagemAusente}>
                        Imagem ainda não disponível
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.nomeSinal}>{item.nome}</Text>
                <Text style={styles.descricaoSinal}>{item.descricao}</Text>

                {temVideo ? (
                  <TouchableOpacity
                    style={styles.botaoVideo}
                    onPress={() => abrirVideo(item.videoUrl)}
                    accessibilityRole="button"
                    accessibilityLabel={`Assistir vídeo do sinal ${item.nome}`}
                  >
                    <Ionicons name="play-circle-outline" size={19} color="#FFFFFF" />
                    <Text style={styles.textoBotaoVideo}>Assistir vídeo</Text>
                  </TouchableOpacity>
                ) : mostrarAvisoVideo ? (
                  <View style={styles.videoIndisponivel}>
                    <Ionicons
                      name="videocam-outline"
                      size={18}
                      color="#6B7280"
                    />
                    <Text style={styles.textoVideoIndisponivel}>
                      Vídeo ainda não disponível
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <Text style={styles.notaEducativa}>
          Os sinais podem variar conforme o contexto e a região. Consulte materiais
          produzidos ou revisados por pessoas fluentes em Libras.
        </Text>
      </View>

    </ScrollView>
  );
}
function AreaVoluntario() {
  const [aba, setAba] = useState('conteudos');

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
        {[
          { id: 'conteudos', titulo: 'Conteúdos' },
          { id: 'professores', titulo: 'Professores' },
        ].map((t) => {
          const ativa = aba === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setAba(t.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativa }}
              style={[
                styles.botaoCategoria,
                { flex: 1, alignItems: 'center' },
                ativa && styles.botaoCategoriaSelecionado,
              ]}
            >
              <Text style={[styles.textoCategoria, ativa && styles.textoCategoriaSelecionado]}>
                {t.titulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {aba === 'conteudos' ? <AprenderLibras /> : <ProfessoresLibras />}
    </View>
  );
}


function obterPerfil(usuario) {
  const bruto =
    usuario?.tipo_usuario ??
    usuario?.tipo ??
    usuario?.tipoUsuario ??
    usuario?.perfil ??
    usuario?.role ??
    '';
  return String(bruto).toLowerCase();
}

export default function AulasLibras({ navigation }) {
  const { usuario } = useAuth();
  const perfil = obterPerfil(usuario);

  const ehPcd = perfil.includes('pcd') || perfil.includes('deficien');
  const ehVoluntario = perfil.includes('volunt');

  // Muda o título do cabeçalho conforme o perfil (sem mexer no StackNavigator)
  useLayoutEffect(() => {
    navigation?.setOptions?.({
      title: ehPcd ? 'Ensinar Libras' : ehVoluntario ? 'Aprender Libras' : 'Libras',
    });
  }, [navigation, ehPcd, ehVoluntario]);

  if (ehPcd) return <EnsinarLibras />;
if (ehVoluntario) return <AreaVoluntario />;

  return (
    <View style={styles.perfilIndefinido}>
      <Text style={styles.textoEstadoVazio}>
        Não foi possível identificar o seu tipo de usuário para exibir esta funcionalidade.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  perfilIndefinido: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  conteudoTela: {
    paddingBottom: 28,
  },
  cabecalho: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 26,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitulo: {
    color: '#DBEAFE',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  secao: {
    paddingHorizontal: 18,
    marginTop: 22,
  },
  tituloSecao: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  descricaoSecao: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  listaCategorias: {
    paddingVertical: 16,
    paddingRight: 8,
    gap: 8,
  },
  botaoCategoria: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  botaoCategoriaSelecionado: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  textoCategoria: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  textoCategoriaSelecionado: {
    color: '#FFFFFF',
  },
  gradeCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48.5%',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  areaImagem: {
    height: 128,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  placeholderImagem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  textoImagemAusente: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 7,
  },
  nomeSinal: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  descricaoSinal: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    minHeight: 34,
  },
  botaoVideo: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  textoBotaoVideo: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  videoIndisponivel: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  textoVideoIndisponivel: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
  },
  notaEducativa: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },
  secaoVoluntarios: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  estadoVazio: {
    alignItems: 'center',
    padding: 20,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  textoEstadoVazio: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 9,
  },
  cardVoluntario: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  avatarVoluntario: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 21,
    backgroundColor: '#DBEAFE',
  },
  dadosVoluntario: {
    flex: 1,
  },
  nomeVoluntario: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  descricaoVoluntario: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
  },
});