import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, avisar } from '../utils/ensino';

const AVATARES = ['👩', '👨', '🧑', '👧', '👦', '👵', '👴', '🧕', '👩‍🦰', '👨‍🦱', '👩‍🦳', '🧑‍🦲'];
const INTERESSES = ['Libras', 'Legendas', 'Leitura labial', 'Acessibilidade', 'Conversação', 'Tecnologia assistiva'];

export default function EditarPerfil({ visible, onClose, perfil, onSalvo }) {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id_usuario;

  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [interesses, setInteresses] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [trocando, setTrocando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setBio(perfil?.bio || '');
    setAvatar(perfil?.avatar || null);
    setInteresses(perfil?.interesses ? perfil.interesses.split(',') : []);
    setSenhaAtual(''); setNovaSenha(''); setConfirmar('');
  }, [visible, perfil]);

  function alternar(item) {
    setInteresses((l) => (l.includes(item) ? l.filter((i) => i !== item) : [...l, item]));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const resposta = await fetch(`${API_URL}/perfil/${idUsuario}/personalizacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, avatar, interesses }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem);
      onSalvo?.();
      onClose();
    } catch (e) {
      avisar('Erro', e.message || 'Não foi possível salvar');
    } finally {
      setSalvando(false);
    }
  }

  async function trocarSenha() {
    if (!senhaAtual || !novaSenha) return avisar('Atenção', 'Preencha a senha atual e a nova senha.');
    if (novaSenha !== confirmar) return avisar('Atenção', 'A confirmação não é igual à nova senha.');
    setTrocando(true);
    try {
      const resposta = await fetch(`${API_URL}/perfil/${idUsuario}/senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem);
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('');
      avisar('Sucesso', dados.mensagem);
    } catch (e) {
      avisar('Erro', e.message || 'Não foi possível alterar a senha');
    } finally {
      setTrocando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.tela}>
        <View style={styles.topo}>
          <Text style={styles.titulo}>Editar perfil</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar">
            <Ionicons name="close" size={26} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
          <Text style={styles.rotulo}>Avatar</Text>
          <View style={styles.chips}>
            {AVATARES.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.avatar, avatar === a && styles.avatarAtivo]}
                onPress={() => setAvatar(a)}
                accessibilityState={{ selected: avatar === a }}
              >
                <Text style={{ fontSize: 28 }}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.rotulo}>Sobre você</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            multiline
            maxLength={300}
            placeholder="Conte um pouco sobre você"
            value={bio}
            onChangeText={setBio}
          />
          <Text style={styles.contador}>{bio.length}/300</Text>

          <Text style={styles.rotulo}>Interesses</Text>
          <View style={styles.chips}>
            {INTERESSES.map((i) => {
              const ativo = interesses.includes(i);
              return (
                <TouchableOpacity key={i} style={[styles.chip, ativo && styles.chipAtivo]} onPress={() => alternar(i)}>
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{i}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.botao} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.botaoTexto}>Salvar alterações</Text>}
          </TouchableOpacity>

          <View style={styles.divisor} />

          <Text style={styles.titulo}>Alterar senha</Text>
          <TextInput style={styles.input} secureTextEntry placeholder="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} />
          <TextInput style={[styles.input, { marginTop: 10 }]} secureTextEntry placeholder="Nova senha (mín. 6 caracteres)" value={novaSenha} onChangeText={setNovaSenha} />
          <TextInput style={[styles.input, { marginTop: 10 }]} secureTextEntry placeholder="Confirmar nova senha" value={confirmar} onChangeText={setConfirmar} />

          <TouchableOpacity style={[styles.botao, { backgroundColor: '#1D4ED8' }]} onPress={trocarSenha} disabled={trocando}>
            {trocando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.botaoTexto}>Alterar senha</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F5F7FA' },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  titulo: { color: '#111827', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  rotulo: { color: '#111827', fontWeight: '700', fontSize: 14, marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  contador: { color: '#6B7280', fontSize: 12, textAlign: 'right', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E5E7EB' },
  avatarAtivo: { borderColor: '#2563EB', backgroundColor: '#DBEAFE' },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  chipAtivo: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipTexto: { color: '#374151', fontSize: 13, fontWeight: '600' },
  chipTextoAtivo: { color: '#FFFFFF' },
  botao: { minHeight: 48, marginTop: 22, borderRadius: 14, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  divisor: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 28 },
});