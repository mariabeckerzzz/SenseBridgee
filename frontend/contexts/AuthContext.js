import { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarUsuario() {
      const dados = await AsyncStorage.getItem('@usuario');
      if (dados) setUsuario(JSON.parse(dados));
      setCarregando(false);
    }
    carregarUsuario();
  }, []);

  async function login(dadosUsuario) {
    setUsuario(dadosUsuario);
    await AsyncStorage.setItem('@usuario', JSON.stringify(dadosUsuario));
  }

  async function logout() {
    setUsuario(null);
    await AsyncStorage.removeItem('@usuario');
  }

  // NOVA FUNÇÃO: atualiza os dados do usuário logado (usada após editar o perfil)
  async function atualizarUsuario(novosDados) {
    const usuarioAtualizado = { ...usuario, ...novosDados };
    setUsuario(usuarioAtualizado);
    await AsyncStorage.setItem('@usuario', JSON.stringify(usuarioAtualizado));
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, atualizarUsuario, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}