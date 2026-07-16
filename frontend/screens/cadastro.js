import { useState } from 'react';

import{ View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Alert } from 'react-native';

export default function Cadastro({navigation}) {

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    async function cadastrarUsuario() {
      Alert.alert("teste");
        try {
            const resposta = await fetch('http://172.20.91.6:3000/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nome, email, senha }),
            });
            
            const dados = await resposta.json();

            Alert.alert(dados.mensagem);
        
            setNome('');
            setEmail('');
            setSenha('');
    } catch (erro) {
        Alert.alert('Erro ao cadastrar usuário');
    }
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