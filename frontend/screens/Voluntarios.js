import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Voluntarios({ navigation }) {

  const dias = [
    { label: 'Seg', numero: 13 },
    { label: 'Ter', numero: 14 },
    { label: 'Qua', numero: 15 },
    { label: 'Qui', numero: 16 },
    { label: 'Sex', numero: 17 },
  ];

  const horarios = [
    { hora: '09:00', disponivel: true },
    { hora: '10:00', disponivel: true },
    { hora: '11:00', disponivel: false },
    { hora: '13:00', disponivel: true },
    { hora: '14:00', disponivel: true },
    { hora: '15:00', disponivel: false },
    { hora: '16:00', disponivel: true },
    { hora: '17:00', disponivel: true },
  ];

  const voluntarios = [
    { id: 1, nome: 'João Silva', nota: 4.9, especialidade: 'Libras', emoji: '🧑‍🦱' },
    { id: 2, nome: 'Maria Santos', nota: 5, especialidade: 'Leitura', emoji: '👩‍🦰' },
    { id: 3, nome: 'Pedro Costa', nota: 4.8, especialidade: 'Geral', emoji: '🧑‍🦰' },
  ];

  const [diaSelecionado, setDiaSelecionado] = useState(15);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [voluntarioSelecionado, setVoluntarioSelecionado] = useState(2);

  function confirmarAgendamento() {
    if (!horarioSelecionado) {
      return;
    }
    navigation.navigate('PedirAjuda');
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Cabeçalho azul */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitulo}>Agendar Assistência</Text>
        <Text style={styles.headerSubtitulo}>Escolha o melhor horário para você</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>

        {/* Navegação de mês */}
        <View style={styles.mesLinha}>
          <Text style={styles.mesTexto}>Outubro 2025</Text>
          <View style={styles.setas}>
            <TouchableOpacity style={styles.setaBotao}>
              <Ionicons name="chevron-back" size={18} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.setaBotao}>
              <Ionicons name="chevron-forward" size={18} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dias da semana */}
        <View style={styles.diasLinha}>
          {dias.map((dia) => {
            const selecionado = dia.numero === diaSelecionado;
            return (
              <TouchableOpacity
                key={dia.numero}
                style={[styles.diaCard, selecionado && styles.diaCardSelecionado]}
                onPress={() => {
                  setDiaSelecionado(dia.numero);
                  setHorarioSelecionado(null);
                }}
              >
                <Text style={[styles.diaLabel, selecionado && styles.diaTextoSelecionado]}>
                  {dia.label}
                </Text>
                <Text style={[styles.diaNumero, selecionado && styles.diaTextoSelecionado]}>
                  {dia.numero}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Horários disponíveis */}
        <Text style={styles.secaoTitulo}>Horários disponíveis</Text>
        <View style={styles.horariosGrid}>
          {horarios.map((item) => {
            const selecionado = item.hora === horarioSelecionado;
            return (
              <TouchableOpacity
                key={item.hora}
                disabled={!item.disponivel}
                style={[
                  styles.horarioCard,
                  !item.disponivel && styles.horarioIndisponivel,
                  selecionado && styles.horarioSelecionado,
                ]}
                onPress={() => setHorarioSelecionado(item.hora)}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={!item.disponivel ? '#D1D5DB' : selecionado ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.horarioTexto,
                    !item.disponivel && styles.horarioTextoIndisponivel,
                    selecionado && styles.horarioTextoSelecionado,
                  ]}
                >
                  {item.hora}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Voluntários disponíveis */}
        <Text style={styles.secaoTitulo}>Voluntários disponíveis</Text>
        <View style={styles.voluntariosLista}>
          {voluntarios.map((v) => {
            const selecionado = v.id === voluntarioSelecionado;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.voluntarioCard, selecionado && styles.voluntarioCardSelecionado]}
                onPress={() => setVoluntarioSelecionado(v.id)}
              >
                <View style={styles.voluntarioAvatar}>
                  <Text style={{ fontSize: 22 }}>{v.emoji}</Text>
                </View>

                <View style={styles.voluntarioInfo}>
                  <View style={styles.voluntarioNomeLinha}>
                    <Text style={styles.voluntarioNome}>{v.nome}</Text>
                    <View style={styles.notaBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.notaTexto}>{v.nota}</Text>
                    </View>
                  </View>
                  <Text style={styles.voluntarioEspecialidade}>
                    Especialidade: {v.especialidade}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.videoBotao}
                  onPress={() => navigation.navigate('PedirAjuda')}
                >
                  <Ionicons name="videocam" size={18} color="#2563EB" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* Botão de confirmar */}
      <View style={styles.rodape}>
        <TouchableOpacity
          style={[styles.botaoConfirmar, !horarioSelecionado && styles.botaoDesabilitado]}
          disabled={!horarioSelecionado}
          onPress={confirmarAgendamento}
        >
          <Text style={styles.botaoConfirmarTexto}>
            {horarioSelecionado ? `Confirmar às ${horarioSelecionado}` : 'Selecione um horário'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTitulo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },

  headerSubtitulo: {
    color: '#DBEAFE',
    fontSize: 14,
    marginTop: 6,
  },

  conteudo: {
    padding: 20,
    paddingBottom: 40,
  },

  mesLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  mesTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },

  setas: {
    flexDirection: 'row',
    gap: 8,
  },

  setaBotao: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  diasLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  diaCard: {
    width: 58,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  diaCardSelecionado: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  diaLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },

  diaNumero: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  diaTextoSelecionado: {
    color: '#FFFFFF',
  },

  secaoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  horarioCard: {
    width: '23.5%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  horarioIndisponivel: {
    backgroundColor: '#F3F4F6',
  },

  horarioSelecionado: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  horarioTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },

  horarioTextoIndisponivel: {
    color: '#D1D5DB',
  },

  horarioTextoSelecionado: {
    color: '#FFFFFF',
  },

  voluntariosLista: {
    gap: 12,
  },

  voluntarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },

  voluntarioCardSelecionado: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },

  voluntarioAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  voluntarioInfo: {
    flex: 1,
  },

  voluntarioNomeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  voluntarioNome: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  notaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },

  notaTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },

  voluntarioEspecialidade: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  videoBotao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  rodape: {
    padding: 20,
    backgroundColor: '#F5F7FA',
  },

  botaoConfirmar: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },

  botaoDesabilitado: {
    backgroundColor: '#93C5FD',
  },

  botaoConfirmarTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});