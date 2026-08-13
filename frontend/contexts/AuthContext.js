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

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}