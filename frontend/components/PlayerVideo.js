import { Linking, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlayerVideo({ uri }) {
  if (Platform.OS === 'web') {
    return (
      <video
        src={uri}
        controls
        playsInline
        preload="metadata"
        style={{ width: '100%', maxHeight: 360, borderRadius: 12, backgroundColor: '#000' }}
      />
    );
  }

  return (
    <TouchableOpacity style={styles.botao} onPress={() => Linking.openURL(uri)} accessibilityRole="button">
      <Ionicons name="play-circle-outline" size={20} color="#FFFFFF" />
      <Text style={styles.texto}>Assistir vídeo</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: { flexDirection: 'row', gap: 8, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#2563EB' },
  texto: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});