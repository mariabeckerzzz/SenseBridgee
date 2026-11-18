import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Cadastro from '../screens/cadastro';
import Login from '../screens/login';
import PedirAjuda from '../screens/PedirAjuda';
import Voluntarios from '../screens/Voluntarios';
import AulasLibras from '../screens/AulasLibras';
import DisponibilidadeVoluntario from '../screens/DisponibilidadeVoluntario';
import MinhasSolicitacoes from '../screens/MinhasSolicitacoes';
import TelaInicial from '../screens/telaInicial';
import Perfil from '../screens/Perfil';
import SolicitacoesVoluntario from '../screens/SolicitacoesVoluntario';
import Mensagens from '../screens/Mensagens';
import Agenda from '../screens/Agenda';
import VLibras from '../components/VLibras';
import LeitorDePagina from '../components/LeitorDePagina';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Cadastro" component={Cadastro} />
          <Stack.Screen name="login" component={Login} />
          <Stack.Screen name="telaInicial" component={TelaInicial} />
          <Stack.Screen name="PedirAjuda" component={PedirAjuda} />
          <Stack.Screen name="Perfil" component={Perfil} />
          <Stack.Screen name="Voluntarios" component={Voluntarios} />
          <Stack.Screen name="AulasLibras" component={AulasLibras} />
          <Stack.Screen name="DisponibilidadeVoluntario" component={DisponibilidadeVoluntario} />
          <Stack.Screen name="MinhasSolicitacoes" component={MinhasSolicitacoes} />
          <Stack.Screen name="SolicitacoesVoluntario" component={SolicitacoesVoluntario} />
          <Stack.Screen name="Mensagens" component={Mensagens} />
          <Stack.Screen name="Agenda" component={Agenda} />
        </Stack.Navigator>
      </NavigationContainer>

      <VLibras />
            <LeitorDePagina />

    </>
  );
}