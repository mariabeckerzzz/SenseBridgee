import { useState} from 'react';

import { View, Text, TouchableOpacity, 
    StyleSheet, ScrollView} from 'react-native';

export default function listaUsuarios(){
    const [usuarios, setUsuarios] = useState([]);

    async function buscarUsuarios() {
        try {
            const resposta = await fetch(
                'http://localhost:3000/usuarios'
            );
            const dados = await resposta.json();
            setUsuarios(dados);
        } catch (erro) {
            alert('Erro ao buscar usuários ', erro);
        }
        
}
return(
    <View style={styles.container}>
        <TouchableOpacity
            style={styles.botao}
            onPress={buscarUsuarios}
            >
                <Text style={styles.textoBotao}>
                    Buscar Usuários
                </Text>    
        </TouchableOpacity>

        <ScrollView style={styles.lista}>
            {usuarios.map((usuario) => (
                <View key={usuario.id} style={styles.usuario}>
                    <Text style={styles.nome}>{usuario.nome}</Text>
                    <Text style={styles.email}>{usuario.email}</Text>
                </View>
            ))}
        </ScrollView>

    </View>


);


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20
    },
    botao: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 5,
        marginBottom: 20
    },
    textoBotao: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold'
    }

});
