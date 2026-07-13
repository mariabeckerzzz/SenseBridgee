import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PedirAjuda({ navigation }) {

  const [segundos, setSegundos] = useState(0);
  const [micAtivo, setMicAtivo] = useState(true);
  const [videoAtivo, setVideoAtivo] = useState(true);
  const [somAtivo, setSomAtivo] = useState(true);
  const [legendasAtivas, setLegendasAtivas] = useState(true);
  const [librasAtivo, setLibrasAtivo] = useState(true);

  // Cronômetro da chamada
  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundos((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  function formatarTempo(totalSegundos) {
    const minutos = Math.floor(totalSegundos / 60).toString().padStart(2, '0');
    const segs = (totalSegundos % 60).toString().padStart(2, '0');
    return `${minutos}:${segs}`;
  }

  function encerrarChamada() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={encerrarChamada}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.timer}>
          <View style={styles.pontoGravando} />
          <Text style={styles.timerTexto}>{formatarTempo(segundos)}</Text>
        </View>

        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Área central com avatares */}
      <View style={styles.areaCentral}>
        <View style={styles.avatarGrande}>
          <Ionicons name="person" size={60} color="#93C5FD" />
        </View>

        <View style={styles.avatarPequeno}>
          <Ionicons name="person" size={36} color="#1D4ED8" />
        </View>
      </View>

      {/* Card de status */}
      <View style={styles.statusCard}>
        <View style={styles.statusLinha}>
          <View style={styles.pontoOnline} />
          <Text style={styles.statusTitulo}>Conectado com João Silva</Text>
        </View>
        <Text style={styles.statusSubtitulo}>Especialista em Libras • 4.9 ⭐</Text>
      </View>

      {/* Botões de controle */}
      <View style={styles.controles}>
        <TouchableOpacity
          style={[styles.botaoRedondo, !videoAtivo && styles.botaoInativo]}
          onPress={() => setVideoAtivo(!videoAtivo)}
        >
          <Ionicons name={videoAtivo ? 'videocam' : 'videocam-off'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botaoRedondo, !micAtivo && styles.botaoInativo]}
          onPress={() => setMicAtivo(!micAtivo)}
        >
          <Ionicons name={micAtivo ? 'mic' : 'mic-off'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoDesligar}
          onPress={encerrarChamada}
        >
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botaoRedondo, !somAtivo && styles.botaoInativo]}
          onPress={() => setSomAtivo(!somAtivo)}
        >
          <Ionicons name={somAtivo ? 'volume-high' : 'volume-mute'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoRedondo}>
          <Ionicons name="chatbubble" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Toggles inferiores */}
      <View style={styles.tags}>
        <TouchableOpacity
          style={[styles.tag, legendasAtivas && styles.tagAtiva]}
          onPress={() => setLegendasAtivas(!legendasAtivas)}
        >
          <Text style={styles.tagTexto}>
            Legendas {legendasAtivas ? 'ativadas' : 'desativadas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tag, librasAtivo && styles.tagAtiva]}
          onPress={() => setLibrasAtivo(!librasAtivo)}
        >
          <Text style={styles.tagTexto}>
            Libras {librasAtivo ? 'habilitado' : 'desabilitado'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  pontoGravando: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },

  timerTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },

  areaCentral: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarGrande: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarPequeno: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 100,
    height: 130,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },

  statusLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  pontoOnline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },

  statusTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  statusSubtitulo: {
    fontSize: 14,
    color: '#2563EB',
    marginLeft: 18,
  },

  controles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },

  botaoRedondo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  botaoInativo: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  botaoDesligar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },

  tags: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },

  tag: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  tagAtiva: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  tagTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});