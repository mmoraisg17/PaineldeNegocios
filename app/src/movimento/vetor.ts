/* Vetor 3D mínimo, imutável. O motor de movimento é TypeScript puro (sem
   three.js) para poder ser testado com fatos medidos: posição de pés, alturas,
   ângulos. A cena 3D só desenha o que este módulo calcula.

   Convenção do mundo, em metros: Y para cima, o praticante olha para +Z,
   X positivo é a esquerda dele, a origem é o chão no centro da plataforma. */
export type Vec3 = { readonly x: number; readonly y: number; readonly z: number };

export const vec = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const soma = (a: Vec3, b: Vec3): Vec3 => vec(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a: Vec3, b: Vec3): Vec3 => vec(a.x - b.x, a.y - b.y, a.z - b.z);
export const escala = (a: Vec3, k: number): Vec3 => vec(a.x * k, a.y * k, a.z * k);
export const ponto = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const comprimento = (a: Vec3): number => Math.sqrt(ponto(a, a));
export const distancia = (a: Vec3, b: Vec3): number => comprimento(sub(a, b));
export const misturar = (a: Vec3, b: Vec3, t: number): Vec3 => soma(a, escala(sub(b, a), t));

export function normalizar(a: Vec3): Vec3 {
  const c = comprimento(a);
  return c < 1e-9 ? vec(0, 1, 0) : escala(a, 1 / c);
}

export const graus = (rad: number): number => (rad * 180) / Math.PI;
export const radianos = (deg: number): number => (deg * Math.PI) / 180;

/* Ângulo entre dois vetores, em graus. */
export function anguloEntre(a: Vec3, b: Vec3): number {
  const cos = ponto(normalizar(a), normalizar(b));
  return graus(Math.acos(Math.min(1, Math.max(-1, cos))));
}
