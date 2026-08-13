import { useState } from 'react';

import { View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Login({ navigation }) {

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const { login } = useAuth();

    async function fazerLogin() {
        try {
            const resposta = await fetch('http://172.20.91.19:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha }),
            });

            const dados = await resposta.json();
            console.log(dados);

            if (dados.sucesso) {
              await login({ nome: dados.data.nome, email: dados.data.email });
          
              Alert.alert('Sucesso', 'Login realizado com sucesso');
              navigation.navigate('telaInicial');
          } else {
              Alert.alert('Erro', dados.mensagem || 'Email ou senha incorretos');
          }

        } catch (erro) {
            Alert.alert('Erro', 'Falha ao fazer login');
            console.log(erro);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Text style={styles.logo}>SenseBridge</Text>
                <Text style={styles.subtitulo}>
                    Entre na sua conta para continuar
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.titulo}>Login</Text>

                <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={styles.botao}
                    onPress={fazerLogin}
                >
                    <Text style={styles.textoBotao}>
                        Entrar
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                onPress={() => navigation.navigate('Cadastro')}
            >
                <Text style={styles.link}>
                    Não tenho conta
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 24,
    justifyContent: 'center'
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 40
  },

  logo: {
    fontSize: 34,
    fontWeight: '700',
    color: '#2563EB'
  },

  subtitulo: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 15
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },

  titulo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24
  },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    fontSize: 16
  },

  botao: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8
  },

  textoBotao: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  },

  link: {
    textAlign: 'center',
    marginTop: 24,
    color: '#2563EB',
    fontWeight: '600'
  }
});