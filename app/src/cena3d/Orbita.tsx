import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { regiaoDoDesvio } from '../movimento/desvios';
import { enquadramento } from '../movimento/enquadramento';
import { fatorDeAproximacao } from '../movimento/transicoes';
import type { RelogioDaAnimacao } from './relogio';

/* Arrastar para girar o boneco (manual, seção 6.1). Usa o OrbitControls do
   próprio three.js em vez do pacote drei: é o único controle de que o app
   precisa, e isso evita ~200 KB de dependência no celular.
   Sem zoom por pinça nem arrasto lateral: o idoso que esbarra na tela não
   deve "perder" o boneco de vista.

   Close-up no erro (auditoria visual, V8): quando o app pede atenção ou
   para, a câmera mira a região a corrigir e chega até 25% mais perto, em
   ~0,6 s; na execução certa, volta ao corpo inteiro. O giro do usuário é
   preservado (só mudam a altura da mira e a distância). Desligado com
   movimento reduzido. */

const TAXA_DA_CAMERA = 3.5; // 1/s: ~0,6 s para chegar perto do novo enquadramento

export function Orbita({ alvo, relogio }: { alvo: [number, number, number]; relogio?: React.MutableRefObject<RelogioDaAnimacao> }) {
  const { camera, gl, invalidate } = useThree();
  const controles = useRef<OrbitControls | null>(null);
  const distanciaBase = useRef(1);
  const deslocamento = useRef(new Vector3());

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.target.set(...alvo);
    c.enableDamping = true;
    c.enablePan = false;
    c.enableZoom = false;
    c.minPolarAngle = Math.PI * 0.2;
    c.maxPolarAngle = Math.PI * 0.49; // nunca abaixo do chão
    /* O OrbitControls põe touch-action: none no canvas, o que prende a
       rolagem da página quando o dedo começa em cima do 3D. Com pan-y, o
       gesto vertical rola a tela e o horizontal gira o boneco. */
    gl.domElement.style.touchAction = 'pan-y';
    c.update();
    distanciaBase.current = camera.position.distanceTo(c.target);
    controles.current = c;
    /* Pausada, a cena só desenha sob demanda: cada giro (e cada passo do
       amortecimento e do close-up, que também mudam a câmera) pede o
       próximo quadro (revisão da fase 8). */
    const aoMudar = () => invalidate();
    c.addEventListener('change', aoMudar);
    return () => {
      c.removeEventListener('change', aoMudar);
      c.dispose();
    };
  }, [camera, gl, alvo, invalidate]);

  useFrame((_, delta) => {
    const c = controles.current;
    if (!c) return;
    const r = relogio?.current;
    if (r && !r.menosMovimento && r.sensores) {
      const desejado = enquadramento(regiaoDoDesvio(r.desvio), r.sensores.estado);
      const alturaDesejada = desejado.distancia === 1 ? alvo[1] : desejado.alturaDoAlvo;
      const fator = fatorDeAproximacao(Math.min(delta, 0.1), TAXA_DA_CAMERA);
      c.target.y += (alturaDesejada - c.target.y) * fator;
      const offset = deslocamento.current.copy(camera.position).sub(c.target);
      const atual = offset.length();
      offset.setLength(atual + (distanciaBase.current * desejado.distancia - atual) * fator);
      camera.position.copy(c.target).add(offset);
    }
    c.update();
  });
  return null;
}
