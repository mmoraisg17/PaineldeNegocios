import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Color, type Mesh, type MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { type Amostra, type Animacao, amostrar } from '../movimento/animacao';
import { CORPO } from '../movimento/cenario';
import { type Esqueleto, montarEsqueleto } from '../movimento/corpo';
import { type RegiaoDoCorpo, aplicarDesvioNaPose, regiaoDoDesvio } from '../movimento/desvios';
import type { Vec3 } from '../movimento/vetor';
import type { CoresDaCena } from './cores';
import { RAMPA_DE_PAUSA, TAXA_DO_DESTAQUE, aproximar, fatorDeAproximacao } from '../movimento/transicoes';
import type { RelogioDaAnimacao } from './relogio';

/* Boneco low-poly feito de cilindros e esferas. Nada de modelo externo: os
   exercícios com a nossa plataforma não existem em bibliotecas de animação,
   o arquivo fica leve para o celular e não há licença de terceiros (PRD,
   decisão "Animação").

   A cada quadro o esqueleto é recalculado pelo motor (src/movimento) e os
   meshes são movidos por ref, sem re-render do React: são ~20 objetos a
   60 fps, e passar isso por estado travaria celulares mais simples. */

type Segmento = { de: (e: Esqueleto) => Vec3; ate: (e: Esqueleto) => Vec3; raio: number; cor: keyof CoresDaCena; regiao: RegiaoDoCorpo };
type Junta = { em: (e: Esqueleto) => Vec3; raio: number; cor: keyof CoresDaCena; regiao: RegiaoDoCorpo };

const lado = (l: 'esquerdo' | 'direito') => (e: Esqueleto) => e.lados[l];
const L = lado('esquerdo');
const R = lado('direito');

const SEGMENTOS: Segmento[] = [
  ...[L, R].flatMap((s): Segmento[] => [
    { de: (e) => s(e).calcanhar, ate: (e) => s(e).ponta, raio: 0.038, cor: 'sapato', regiao: 'pernas' },
    { de: (e) => s(e).tornozelo, ate: (e) => s(e).joelho, raio: 0.048, cor: 'calca', regiao: 'pernas' },
    { de: (e) => s(e).joelho, ate: (e) => s(e).quadril, raio: 0.062, cor: 'calca', regiao: 'pernas' },
    { de: (e) => s(e).ombro, ate: (e) => s(e).cotovelo, raio: 0.042, cor: 'camisa', regiao: 'bracos' },
    { de: (e) => s(e).cotovelo, ate: (e) => s(e).mao, raio: 0.034, cor: 'pele', regiao: 'bracos' },
  ]),
  { de: (e) => e.lados.esquerdo.quadril, ate: (e) => e.lados.direito.quadril, raio: 0.075, cor: 'calca', regiao: 'pernas' },
  { de: (e) => e.pelve, ate: (e) => e.pescoco, raio: 0.115, cor: 'camisa', regiao: 'tronco' },
  { de: (e) => e.lados.esquerdo.ombro, ate: (e) => e.lados.direito.ombro, raio: 0.06, cor: 'camisa', regiao: 'tronco' },
  { de: (e) => e.pescoco, ate: (e) => e.cabeca, raio: 0.04, cor: 'pele', regiao: 'tronco' },
];

const JUNTAS: Junta[] = [
  ...[L, R].flatMap((s): Junta[] => [
    { em: (e) => s(e).joelho, raio: 0.052, cor: 'calca', regiao: 'pernas' },
    { em: (e) => s(e).tornozelo, raio: 0.04, cor: 'sapato', regiao: 'pernas' },
    { em: (e) => s(e).ombro, raio: 0.06, cor: 'camisa', regiao: 'bracos' },
    { em: (e) => s(e).cotovelo, raio: 0.04, cor: 'camisa', regiao: 'bracos' },
    { em: (e) => s(e).mao, raio: 0.042, cor: 'pele', regiao: 'bracos' },
  ]),
  { em: (e) => e.cabeca, raio: CORPO.raioCabeca, cor: 'pele', regiao: 'tronco' },
];

/* Tempo que a cor leva para assentar no destaque (≈ 99% com TAXA_DO_DESTAQUE). */
const DURACAO_DA_COR = 0.4;
/* Delta máximo da transição de cor: com a cena pausada (frameloop "demand"),
   o primeiro quadro depois de um tempo parado traz um delta enorme, e a cor
   pularia direto para o fim. */
const DELTA_MAXIMO_DA_COR = 1 / 30;
/* Mesmo cuidado na rampa de pausa: ao retomar depois de um tempo parado, o
   primeiro delta é grande e a velocidade saltaria em vez de subir. */
const DELTA_MAXIMO_DA_RAMPA = 1 / 30;

const CIMA = new Vector3(0, 1, 0);
const tmpA = new Vector3();
const tmpB = new Vector3();
const tmpQ = new Quaternion();

/* Cilindro de altura 1 esticado entre dois pontos. */
function posicionarSegmento(mesh: Mesh, de: Vec3, ate: Vec3) {
  tmpA.set(de.x, de.y, de.z);
  tmpB.set(ate.x, ate.y, ate.z);
  const comprimento = tmpA.distanceTo(tmpB);
  mesh.position.copy(tmpA).add(tmpB).multiplyScalar(0.5);
  tmpB.sub(tmpA).normalize();
  mesh.quaternion.copy(tmpQ.setFromUnitVectors(CIMA, tmpB));
  mesh.scale.set(1, Math.max(comprimento, 1e-4), 1);
}

export function Boneco({
  animacao,
  cores,
  relogio,
  aoAmostrar,
}: {
  animacao: Animacao;
  cores: CoresDaCena;
  relogio: React.MutableRefObject<RelogioDaAnimacao>;
  aoAmostrar?: (amostra: Amostra) => void;
  /* Muda quando a tela troca o desvio simulado. Só existe para o React
     reconciliar este componente e o R3F desenhar um quadro novo quando a
     animação está pausada (frameloop "demand"). */
  versao?: number;
}) {
  const segmentos = useRef<(Mesh | null)[]>([]);
  const juntas = useRef<(Mesh | null)[]>([]);
  const ultimaFase = useRef(-1);
  const ultimaRegiao = useRef<RegiaoDoCorpo | null>(null);
  const corEmTransicao = useRef(0); // segundos restantes do fade do destaque
  // Velocidade com que o tempo anda de fato: segue relogio.velocidade (ou 0
  // pausado) por uma rampa, para o boneco desacelerar e acelerar (M1).
  const velocidadeEfetiva = useRef(relogio.current.pausado ? 0 : relogio.current.velocidade);
  const inicial = useMemo(() => montarEsqueleto(amostrar(animacao, 0).pose), [animacao]);
  const corDestaque = useMemo(() => new Color(cores.destaque), [cores]);
  const corOriginal = useMemo(() => Object.fromEntries(Object.entries(cores).map(([k, v]) => [k, new Color(v)])), [cores]);

  // Trocar de exercício recomeça o ciclo e a legenda da fase.
  useEffect(() => {
    ultimaFase.current = -1;
    relogio.current.tempo = 0;
  }, [animacao, relogio]);

  /* Pinta de destaque a região que o app pede para corrigir (pernas na
     assimetria, braços no apoio demais…). `fator` 1 troca direto; menor que 1
     aproxima a cor um pouco a cada quadro, para o destaque "acender" em
     ~200 ms em vez de piscar (auditoria, A3). */
  const pintar = (regiao: RegiaoDoCorpo | null, fator: number) => {
    const aplicar = (mesh: Mesh | null, item: { regiao: RegiaoDoCorpo; cor: keyof CoresDaCena }) => {
      const material = mesh?.material as MeshStandardMaterial | undefined;
      const alvo = item.regiao === regiao ? corDestaque : (corOriginal[item.cor] ?? corDestaque);
      if (fator >= 1) material?.color.copy(alvo);
      else material?.color.lerp(alvo, fator);
    };
    SEGMENTOS.forEach((s, i) => aplicar(segmentos.current[i] ?? null, s));
    JUNTAS.forEach((j, i) => aplicar(juntas.current[i] ?? null, j));
  };

  useFrame((estado, delta) => {
    const r = relogio.current;
    const alvo = r.pausado ? 0 : r.velocidade;
    velocidadeEfetiva.current = r.menosMovimento
      ? alvo
      : aproximar(velocidadeEfetiva.current, alvo, Math.min(delta, DELTA_MAXIMO_DA_RAMPA), 1 / RAMPA_DE_PAUSA);
    // delta limitado: ao voltar de outra aba o delta é enorme e o boneco "pularia".
    r.tempo += Math.min(delta, 0.1) * velocidadeEfetiva.current;
    // Pausada, a cena só desenha sob demanda: segue pedindo quadros até parar.
    if (r.pausado && velocidadeEfetiva.current > 0) estado.invalidate();
    const amostra = amostrar(animacao, r.tempo);
    const esqueleto = montarEsqueleto(aplicarDesvioNaPose(amostra.pose, r.desvio, r.tempo));
    const regiao = regiaoDoDesvio(r.desvio);
    if (regiao !== ultimaRegiao.current) {
      ultimaRegiao.current = regiao;
      corEmTransicao.current = r.menosMovimento ? 0 : DURACAO_DA_COR;
      if (r.menosMovimento) pintar(regiao, 1);
    }
    if (corEmTransicao.current > 0) {
      const passo = Math.min(delta, DELTA_MAXIMO_DA_COR);
      corEmTransicao.current -= passo;
      pintar(regiao, corEmTransicao.current > 0 ? fatorDeAproximacao(passo, TAXA_DO_DESTAQUE) : 1);
      // Pausada, a cena só desenha sob demanda: pede o próximo quadro até a cor assentar.
      if (corEmTransicao.current > 0) estado.invalidate();
    }
    SEGMENTOS.forEach((s, i) => {
      const mesh = segmentos.current[i];
      if (mesh) posicionarSegmento(mesh, s.de(esqueleto), s.ate(esqueleto));
    });
    JUNTAS.forEach((j, i) => {
      const p = j.em(esqueleto);
      juntas.current[i]?.position.set(p.x, p.y, p.z);
    });
    if (amostra.indiceFase !== ultimaFase.current) {
      ultimaFase.current = amostra.indiceFase;
      aoAmostrar?.(amostra);
    }
  });

  return (
    <group>
      {SEGMENTOS.map((s, i) => (
        <mesh
          key={`s${i}`}
          ref={(m) => {
            segmentos.current[i] = m;
            if (m) posicionarSegmento(m, s.de(inicial), s.ate(inicial));
          }}
        >
          <cylinderGeometry args={[s.raio, s.raio, 1, 14]} />
          <meshStandardMaterial color={cores[s.cor]} roughness={0.75} />
        </mesh>
      ))}
      {JUNTAS.map((j, i) => {
        const p = j.em(inicial);
        return (
          <mesh key={`j${i}`} ref={(m) => void (juntas.current[i] = m)} position={[p.x, p.y, p.z]}>
            <sphereGeometry args={[j.raio, 18, 14]} />
            <meshStandardMaterial color={cores[j.cor]} roughness={0.75} />
          </mesh>
        );
      })}
    </group>
  );
}
