import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const CHAVE = 'leitura_ao_passar_mouse';
const SO_ICONE = /[\uE000-\uF8FF]/g;

function textoDe(elemento) {
  const rotulo = elemento.getAttribute('aria-label');
  if (rotulo && rotulo.trim()) return rotulo.trim();

  if (elemento.tagName === 'INPUT' || elemento.tagName === 'TEXTAREA') {
    return (elemento.placeholder || '').trim();
  }

  const proprio = Array.from(elemento.childNodes)
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent)
    .join(' ')
    .replace(SO_ICONE, '')
    .trim();
  if (proprio) return proprio;

  const interno = (elemento.innerText || '').replace(SO_ICONE, '').trim();
  return interno.length <= 120 ? interno : '';
}

function encontrarTexto(alvo) {
  let el = alvo;
  for (let i = 0; i < 4 && el && el !== document.body; i += 1) {
    const texto = textoDe(el);
    if (texto) return texto;
    el = el.parentElement;
  }
  return '';
}

export default function LeitorDePagina() {
  const [ativo, setAtivo] = useState(false);
  const ultimoTexto = useRef('');
  const temporizador = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      setAtivo(window.localStorage.getItem(CHAVE) === '1');
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !window.speechSynthesis) return undefined;
    if (!ativo) {
      window.speechSynthesis.cancel();
      return undefined;
    }

    function falar(texto) {
      if (!texto || texto === ultimoTexto.current) return;
      ultimoTexto.current = texto;
      window.speechSynthesis.cancel();
      const fala = new SpeechSynthesisUtterance(texto);
      fala.lang = 'pt-BR';
      window.speechSynthesis.speak(fala);
    }

    function aoPassar(e) {
      if (e.target.closest && e.target.closest('[data-leitor]')) return;
      const texto = encontrarTexto(e.target);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => falar(texto), 300);
    }

    function aoFocar(e) {
      if (e.target.closest && e.target.closest('[data-leitor]')) return;
      falar(encontrarTexto(e.target));
    }

    function aoSairDaTela() {
      ultimoTexto.current = '';
    }

    document.addEventListener('mouseover', aoPassar);
    document.addEventListener('focusin', aoFocar);  
    document.addEventListener('mouseleave', aoSairDaTela);

    return () => {
      document.removeEventListener('mouseover', aoPassar);
      document.removeEventListener('focusin', aoFocar);
      document.removeEventListener('mouseleave', aoSairDaTela);
      clearTimeout(temporizador.current);
      window.speechSynthesis.cancel();
    };
  }, [ativo]);

  if (Platform.OS !== 'web' || !window.speechSynthesis) return null;

  function alternar() {
    const novo = !ativo;
    ultimoTexto.current = '';
    setAtivo(novo);
    try {
      window.localStorage.setItem(CHAVE, novo ? '1' : '0');
    } catch (e) {}

    if (novo) {
      const aviso = new SpeechSynthesisUtterance('Leitura ao passar o mouse ligada');
      aviso.lang = 'pt-BR';
      window.speechSynthesis.speak(aviso);
    }
  }

  return (
    <button
      type="button"
      data-leitor="true"
      onClick={alternar}
      aria-pressed={ativo}
      aria-label={
        ativo
          ? 'Desligar leitura ao passar o mouse'
          : 'Ligar leitura ao passar o mouse'
      }
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 9999,
        minHeight: 48,
        padding: '0 18px',
        border: 'none',
        borderRadius: 24,
        background: ativo ? '#059669' : '#2563EB',
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}
    >
      {ativo ? '🔊 Leitura: ligada' : '🔇 Leitura: desligada'}
    </button>
  );
}