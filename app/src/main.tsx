import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/inter';
import './styles/global.css';
import { APP_NAME } from './config/app';
import { ProvedorDoApp, pintarComPreferenciasSalvas } from './estado/ContextoApp';
import { criarRoteador } from './rotas';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Elemento #raiz ausente no index.html');

// Título inicial; cada tela depois define o seu (hooks/useTituloDaTela.ts).
document.title = `${APP_NAME} · protótipo`;
pintarComPreferenciasSalvas();

createRoot(raiz).render(
  <StrictMode>
    {/* reducedMotion="user": as animações em JS do Motion obedecem ao
        "reduzir movimento" do sistema, como o CSS já obedece. */}
    <MotionConfig reducedMotion="user">
      <ProvedorDoApp>
        <RouterProvider router={criarRoteador()} />
      </ProvedorDoApp>
    </MotionConfig>
  </StrictMode>,
);
