import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CartaoDoAtleta, IdDoAtleta } from './dadosDaDemo';
import { MARGEM, type Paleta, limitar, useEntradaESaida } from './Sobreposicoes';

/* Sobreposições do vídeo "LucasEDiego": o cabeçalho e o cartão de dados de
   cada atleta (em cima, acima da cena) e o quadro de comparação. Os números
   chegam prontos em `CartaoDoAtleta` (dadosDaDemo.ts); aqui só se escreve.

   Layout (1080×1920) durante o exercício: nome e selo de velocidade no topo,
   cartão do atleta logo abaixo (até ~y 560), a cena de ~560 a ~1420 (a câmera
   foi afastada para isso, ver ENQUADRAMENTO_DOS_ATLETAS), a fase e os
   cartões de tempo e carga no rodapé, como no vídeo "Bulgaro". */

export const TOPO_DO_CARTAO_DO_ATLETA = 176;

export function CabecalhoDoAtleta({ paleta, cartao, duracao }: { paleta: Paleta; cartao: CartaoDoAtleta; duracao: number }) {
  const estilo = useEntradaESaida(duracao);
  return (
    <div style={{ position: 'absolute', top: 52, left: MARGEM, right: MARGEM, ...estilo }}>
      <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, color: paleta.texto, letterSpacing: -1 }}>
        {cartao.nome}, {cartao.idade} anos
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, marginTop: 6, color: paleta.acento }}>{cartao.acompanhamento}</div>
    </div>
  );
}

const Chip = ({ paleta, cheio, children }: { paleta: Paleta; cheio: boolean; children: ReactNode }) => (
  <span
    style={{
      fontSize: 24,
      fontWeight: 700,
      padding: '6px 16px',
      borderRadius: 999,
      color: cheio ? paleta.sobreAcento : paleta.texto,
      background: cheio ? paleta.acento : '#ffffff1c',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

function Medida({ paleta, rotulo, valor, unidade }: { paleta: Paleta; rotulo: string; valor: string; unidade?: string }) {
  return (
    <div style={{ borderRadius: 18, background: '#ffffff0d', padding: '10px 14px' }}>
      <div style={{ fontSize: 21, fontWeight: 600, color: paleta.suave, whiteSpace: 'nowrap' }}>{rotulo}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
        <span style={{ fontSize: 44, fontWeight: 800, color: paleta.texto, fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>{valor}</span>
        {unidade && <span style={{ fontSize: 20, fontWeight: 600, color: paleta.suave }}>{unidade}</span>}
      </div>
    </div>
  );
}

/* Textos do cartão a partir dos dados (o teste confere estas frases). */
export function textosDoCartao(cartao: CartaoDoAtleta) {
  const { ajustadoPor, nivelDoBulgaro, nivelFixado, treinosPorSemana, treinos } = cartao;
  return {
    quemAjusta: ajustadoPor ? `Ajustado por ${ajustadoPor}` : 'Rotina do app',
    nivel: `búlgaro ${nivelFixado ? 'fixo ' : ''}no nível ${nivelDoBulgaro}`,
    frequencia: `${treinosPorSemana} ${treinosPorSemana === 1 ? 'treino' : 'treinos'} por semana`,
    treinosFeitos: `${treinos.feitos} de ${treinos.previstos} treinos`,
    periodo: `nas últimas ${treinos.semanas} semanas`,
    recado: cartao.recado ? `“${cartao.recado.texto}”` : undefined,
  };
}

/* Cartão de dados do atleta: rotina (quem ajusta, nível, frequência), as
   médias dos últimos treinos como no relatório do profissional, os treinos
   feitos como na tela Progresso e, se houver, o recado do profissional. */
export function CartaoDoAtletaNaTela({ paleta, cartao, duracao }: { paleta: Paleta; cartao: CartaoDoAtleta; duracao: number }) {
  const estilo = useEntradaESaida(duracao);
  const textos = textosDoCartao(cartao);
  const { medias, treinos } = cartao;
  return (
    <div
      style={{
        position: 'absolute',
        top: TOPO_DO_CARTAO_DO_ATLETA,
        left: MARGEM,
        right: MARGEM,
        boxSizing: 'border-box',
        padding: '16px 26px 16px 30px',
        borderRadius: 28,
        background: '#1d1d2bdd',
        borderLeft: `10px solid ${paleta.acento}`,
        ...estilo,
      }}
    >
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Chip paleta={paleta} cheio>
          {textos.quemAjusta}
        </Chip>
        <Chip paleta={paleta} cheio={false}>
          {textos.nivel}
        </Chip>
        <Chip paleta={paleta} cheio={false}>
          {textos.frequencia}
        </Chip>
      </div>
      <div style={{ fontSize: 21, fontWeight: 600, color: paleta.suave, marginTop: 10 }}>Média dos últimos {cartao.treinosNoResumo} treinos</div>
      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 1.15fr 1.25fr', gap: 10, marginTop: 8 }}>
        <Medida paleta={paleta} rotulo="Nota" valor={String(medias.nota)} unidade="de 100" />
        <Medida paleta={paleta} rotulo="Simetria" valor={`${medias.simetria}%`} />
        <Medida paleta={paleta} rotulo="Estabilidade" valor={`${medias.estabilidade}%`} />
        <Medida paleta={paleta} rotulo="Apoio nas barras" valor={`${medias.apoio}%`} unidade="do peso" />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 10 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: paleta.acento }}>{textos.treinosFeitos}</span>
        <span style={{ fontSize: 24, fontWeight: 600, color: paleta.suave }}>{textos.periodo}</span>
      </div>
      <div style={{ position: 'relative', height: 12, marginTop: 8, borderRadius: 6, background: '#ffffff1f' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${treinos.porcentagem}%`, borderRadius: 6, background: paleta.acento }} />
      </div>
      {textos.recado && cartao.recado && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '2px solid #ffffff1a' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: paleta.acento }}>Recado de {cartao.recado.de}</div>
          <div style={{ fontSize: 27, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.22, color: paleta.texto, marginTop: 4 }}>{textos.recado}</div>
        </div>
      )}
    </div>
  );
}

/* ---- Comparação lado a lado ---- */

type LinhaDaComparacao = {
  readonly titulo: string;
  /* Explicação curta ao lado do título (vale para os dois: mesma regra). */
  readonly nota: (cartao: CartaoDoAtleta) => string;
  /* 0 a 100 (todas as medidas são porcentagens; mesma escala nas quatro). */
  readonly valor: (cartao: CartaoDoAtleta) => number;
  readonly texto: (cartao: CartaoDoAtleta) => string;
};

export const LINHAS_DA_COMPARACAO: readonly LinhaDaComparacao[] = [
  { titulo: 'Simetria', nota: (c) => `média dos últimos ${c.treinosNoResumo} treinos`, valor: (c) => c.medias.simetria, texto: (c) => `${c.medias.simetria}%` },
  { titulo: 'Estabilidade', nota: (c) => `média dos últimos ${c.treinosNoResumo} treinos`, valor: (c) => c.medias.estabilidade, texto: (c) => `${c.medias.estabilidade}%` },
  {
    titulo: 'Apoio nas barras',
    nota: () => 'parte do peso nas mãos: quanto menos, mais firme',
    valor: (c) => c.medias.apoio,
    texto: (c) => `${c.medias.apoio}% do peso`,
  },
  {
    titulo: 'Treinos feitos',
    nota: (c) => `nas últimas ${c.treinos.semanas} semanas, contra os combinados`,
    valor: (c) => c.treinos.porcentagem,
    texto: (c) => `${c.treinos.feitos} de ${c.treinos.previstos}`,
  },
];

export function Comparacao({
  paletas,
  cartoes,
  duracao,
}: {
  paletas: Record<IdDoAtleta, Paleta>;
  cartoes: Record<IdDoAtleta, CartaoDoAtleta>;
  duracao: number;
}) {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const geral = paletas.lucas;
  const sumir = interpolate(quadro, [duracao - 8, duracao], [1, 0], limitar);
  const entrada = (atraso: number) => spring({ frame: quadro - atraso, fps, config: { damping: 200 }, durationInFrames: 20 });
  const surgir = (atraso: number): CSSProperties => {
    const e = entrada(atraso);
    return { opacity: e, transform: `translateY(${(1 - e) * 30}px)` };
  };
  const nomes = (['lucas', 'diego'] as const).map((id) => ({ id, cartao: cartoes[id], paleta: paletas[id] }));

  return (
    <AbsoluteFill style={{ backgroundColor: geral.fundo, opacity: sumir }}>
      <div style={{ position: 'absolute', top: 120, left: MARGEM, right: MARGEM, ...surgir(0) }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: geral.suave }}>Búlgaro explosivo · contas de demonstração</div>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, marginTop: 8 }}>
          <span style={{ color: paletas.lucas.acento }}>{cartoes.lucas.nome}</span>
          <span style={{ color: geral.suave }}> × </span>
          <span style={{ color: paletas.diego.acento }}>{cartoes.diego.nome}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
          {nomes.map(({ id, cartao, paleta }) => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, fontWeight: 600, color: geral.texto }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: paleta.acento }} />
              {cartao.nome}, {cartao.idade} anos · {cartao.acompanhamento.charAt(0).toLowerCase() + cartao.acompanhamento.slice(1)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 540, left: MARGEM, right: MARGEM, display: 'flex', flexDirection: 'column', gap: 76 }}>
        {LINHAS_DA_COMPARACAO.map((linha, posicao) => {
          const atraso = 8 + posicao * 6;
          const crescer = entrada(atraso + 4);
          return (
            <div key={linha.titulo} style={surgir(atraso)}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: geral.texto }}>{linha.titulo}</span>
                <span style={{ fontSize: 23, fontWeight: 500, color: geral.suave }}>{linha.nota(cartoes.lucas)}</span>
              </div>
              {nomes.map(({ id, cartao, paleta }) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
                  <span style={{ width: 110, fontSize: 30, fontWeight: 700, color: paleta.acento }}>{cartao.nome}</span>
                  <div style={{ position: 'relative', flex: 1, height: 36, borderRadius: 18, background: '#ffffff17' }}>
                    {/* Mínimo de 2% de largura: com 1% a barra viraria um ponto
                        e pareceria "sem dado"; o número ao lado é o que vale. */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${Math.max(linha.valor(cartao), 2) * crescer}%`,
                        borderRadius: 18,
                        background: paleta.acento,
                      }}
                    />
                  </div>
                  <span
                    style={{ width: 250, whiteSpace: 'nowrap', textAlign: 'right', fontSize: 36, fontWeight: 800, color: geral.texto, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {linha.texto(cartao)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 110, left: MARGEM, right: MARGEM, fontSize: 26, fontWeight: 500, lineHeight: 1.35, color: geral.suave, ...surgir(36) }}>
        {nomes.map(({ id, cartao }) => (
          <div key={id}>
            {cartao.nome}: {textosDoCartao(cartao).frequencia} ({cartao.ajustadoPor ? `ajuste de ${cartao.ajustadoPor}` : 'rotina do app'})
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}
