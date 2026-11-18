import { useEffect } from 'react';
import { Platform } from 'react-native';

const URL_WIDGET = 'https://vlibras.gov.br/app';

export default function VLibras() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (document.querySelector('[vw]')) return; 

    const caixa = document.createElement('div');
    caixa.setAttribute('vw', '');
    caixa.className = 'enabled';
    caixa.innerHTML = `
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>`;
    document.body.appendChild(caixa);

    const script = document.createElement('script');
    script.src = `${URL_WIDGET}/vlibras-plugin.js`;
    script.async = true;
    script.onload = () => {
      try {
        new window.VLibras.Widget(URL_WIDGET);
      } catch (e) {
        console.log('Não foi possível iniciar o VLibras', e);
      }
    };
    document.body.appendChild(script);
  }, []);

  return null;
}