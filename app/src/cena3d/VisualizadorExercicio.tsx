import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Amostra, Animacao } from '../movimento/animacao';
import { RAMPA_DE_PAUSA } from '../movimento/transicoes';
import { Boneco } from './Boneco';
import { Cadeira, Chao, Plataforma } from './Cenario';
import { lerCoresDaCena } from './cores';
import { Orbita } from './Orbita';
import type { RelogioDaAnimacao } from './relogio';

/* Câmera em três-quartos, de frente e de lado: o "sentar e levantar" é um
   movimento do plano sagital (frente/trás), e uma vista só de frente
   esconderia justamente a inclinação do tronco e o avanço do quadril.
   Enquadra da cadeira até a cabeça em pé (~1,8 m acima do chão). */
const CAMERA_POSICAO: [number, number, number] = [2.45, 1.6, 2.95];
const ALVO_CAMERA: [number, number, number] = [0, 0.9, -0.12];

/* Carregado sob demanda (React.lazy) pela tela do exercício: o three.js é a
   maior dependência do app, e quem só abre o início não deveria baixá-lo.

   O relógio vem da tela, que o divide com a simulação dos sensores: a cena
   avança o tempo, os sensores leem o mesmo tempo. `versao` muda quando a tela
   troca o desvio simulado, para redesenhar mesmo com a animação pausada. */
export default function VisualizadorExercicio({
  animacao,
  nomeExercicio,
  relogio,
  versao,
}: {
  animacao: Animacao;
  nomeExercicio: string;
  relogio: React.MutableRefObject<RelogioDaAnimacao>;
  versao: number;
}) {
  const cores = useMemo(() => lerCoresDaCena(), []);
  const [pausado, setPausado] = useState(relogio.current.pausado);
  const [lento, setLento] = useState(relogio.current.velocidade < 1);
  const [fase, setFase] = useState('');

  // Só em desenvolvimento: deixa a inspeção (testes no navegador, revisão
  // visual) pular para qualquer instante do ciclo. Some do build de produção.
  if (import.meta.env.DEV) (window as unknown as { __relogioCena?: RelogioDaAnimacao }).__relogioCena = relogio.current;

  /* Pausado, o canvas só desenha sob demanda. Mas o boneco desacelera por
     RAMPA_DE_PAUSA antes de parar (M1): se a troca fosse no mesmo instante,
     a rampa ficaria sem quadros e o boneco congelaria. */
  const [sobDemanda, setSobDemanda] = useState(relogio.current.pausado);
  const temporizador = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const alternarPausa = () => {
    const r = relogio.current;
    r.pausado = !r.pausado;
    setPausado(r.pausado);
    window.clearTimeout(temporizador.current);
    if (!r.pausado) setSobDemanda(false);
    else if (r.menosMovimento) setSobDemanda(true);
    else temporizador.current = window.setTimeout(() => setSobDemanda(true), RAMPA_DE_PAUSA * 1000 + 100);
  };
  const alternarVelocidade = () => {
    relogio.current.velocidade = lento ? 1 : 0.5;
    setLento(!lento);
  };
  const aoAmostrar = (a: Amostra) => setFase(a.fase);

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative h-56 overflow-hidden rounded-cartao bg-superficie" data-cena-3d>
        <Canvas
          /* offsetSize: mede o tamanho de layout do contêiner, e não o
             tamanho visual. No desktop o app inteiro está dentro de uma
             moldura com CSS zoom, e a medida visual deixaria o canvas com o
             tamanho errado (achado da revisão da fase 1). */
          resize={{ offsetSize: true }}
          /* Pausado, só redesenha quando algo muda (girar, trocar desvio):
             poupa bateria no celular e respeita quem pediu menos movimento. */
          frameloop={sobDemanda ? 'demand' : 'always'}
          dpr={[1, 2]}
          camera={{ position: CAMERA_POSICAO, fov: 38, near: 0.05, far: 20 }}
          role="img"
          aria-label={`Animação 3D do exercício ${nomeExercicio}. Arraste para os lados para girar.`}
        >
          <hemisphereLight args={['#ffffff', '#b9b4a8', 1.4]} />
          <directionalLight position={[2.5, 4, 3]} intensity={1.6} />
          <Chao cores={cores} />
          <Plataforma cores={cores} />
          {animacao.cadeira && <Cadeira cadeira={animacao.cadeira} cores={cores} />}
          <Boneco animacao={animacao} cores={cores} relogio={relogio} aoAmostrar={aoAmostrar} versao={versao} />
          <Orbita alvo={ALVO_CAMERA} />
        </Canvas>
        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            type="button"
            onClick={alternarVelocidade}
            aria-pressed={lento}
            className="min-h-12 min-w-12 rounded-full bg-superficie/90 px-3 text-base font-bold text-texto shadow"
          >
            {lento ? '1×' : '0,5×'}
          </button>
          <button
            type="button"
            onClick={alternarPausa}
            aria-label={pausado ? 'Continuar animação' : 'Pausar animação'}
            className="min-h-12 min-w-12 rounded-full bg-superficie/90 text-lg font-bold text-texto shadow"
          >
            {pausado ? '▶' : '❚❚'}
          </button>
        </div>
      </div>
      {/* Sem aria-live: a fase muda a cada ~1 s em loop, e anunciar isso
          sem parar atrapalharia quem usa leitor de tela (revisão da fase 3).
          Os avisos de correção, que importam, são anunciados pelo
          AvisoDeCorrecao. */}
      <figcaption className="min-h-7 text-lg font-semibold text-primaria">
        {/* key: cada fase nova remonta o texto e refaz o esmaecimento. */}
        <span key={fase} className="block animate-aparecer">
          {fase}
        </span>
      </figcaption>
    </figure>
  );
}
