import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function Cadastro({ navigation }) {

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [numero, setNumero] = useState('');

  function formatarCpf(texto) {
    const numeros = texto.replace(/\D/g, '').slice(0, 11);
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function formatarNumero(texto) {
    const numeros = texto.replace(/\D/g, '').slice(0, 11);
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  async function cadastrarUsuario() {
    try {
      const resposta = await fetch('http://192.168.56.1:3000/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, email, senha, cpf, numero }),
      });

      const dados = await resposta.json();

      Alert.alert(dados.mensagem);

      setNome('');
      setEmail('');
      setSenha('');
      setCpf('');
      setNumero('');
    } catch (erro) {
      Alert.alert('Erro ao cadastrar usuário');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>SenseBridge</Text>
        <Text style={styles.subtitulo}>
          Crie sua conta para continuar
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.titulo}>Cadastro</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="CPF"
          value={cpf}
          onChangeText={(texto) => setCpf(formatarCpf(texto))}
          keyboardType="numeric"
          maxLength={14}
        />

        <TextInput
          style={styles.input}
          placeholder="Número de telefone"
          value={numero}
          onChangeText={(texto) => setNumero(formatarNumero(texto))}
          keyboardType="phone-pad"
          maxLength={15}
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
          onPress={cadastrarUsuario}
        >
          <Text style={styles.textoBotao}>
            Criar conta
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('login')}
      >
        <Text style={styles.link}>
          Já tenho uma conta
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