import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* Arrastar para girar o boneco (manual, seção 6.1). Usa o OrbitControls do
   próprio three.js em vez do pacote drei: é o único controle de que o app
   precisa, e isso evita ~200 KB de dependência no celular.
   Sem zoom por pinça nem arrasto lateral: o idoso que esbarra na tela não
   deve "perder" o boneco de vista. */
export function Orbita({ alvo }: { alvo: [number, number, number] }) {
  const { camera, gl } = useThree();
  const controles = useRef<OrbitControls | null>(null);

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
    controles.current = c;
    return () => c.dispose();
  }, [camera, gl, alvo]);

  useFrame(() => controles.current?.update());
  return null;
}
