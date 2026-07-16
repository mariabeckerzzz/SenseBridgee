import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Cadastro from '../screens/cadastro';
import Login from '../screens/login';
import PedirAjuda from '../screens/PedirAjuda';
import Voluntarios from '../screens/Voluntarios';
import TelaInicial from '../screens/telaInicial';
import Perfil from '../screens/Perfil';



const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

      <Stack.Screen
  name="Cadastro"
  component={Cadastro}
/>

<Stack.Screen
  name="login"
  component={Login}
/>

<Stack.Screen
  name="telaInicial"
  component={TelaInicial}
/>

<Stack.Screen
  name="PedirAjuda"
  component={PedirAjuda}
/>

<Stack.Screen
  name="Perfil"
  component={Perfil}
/>

<Stack.Screen
  name="Voluntarios"
  component={Voluntarios}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
