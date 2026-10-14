# DWG → GLB (modelos 3D do Gabriel)

Converte os sólidos 3D dos desenhos do Gabriel (AutoCAD 2018, `AC1032`) em
malhas `.glb` para as cenas do app. Não precisa de AutoCAD.

## Por que não há uma biblioteca pronta

O AutoCAD 2013+ guarda a geometria dos `3DSOLID` (formato ASM/ACIS binário,
"SAB") na seção `AcDs` do arquivo, e não dentro do objeto. Nenhuma biblioteca
em JavaScript ou Python que testamos entrega esses bytes, e o `ezdxf` só
monta malha de faces planas. Então o caminho é:

1. **LibreDWG** (`dwgread`) lê o DWG e, com o patch `libredwg-acds.patch`,
   grava a seção `AcDs` descompactada (`ACDS_OUT=arquivo.acds`) e aceita a
   seção maior que o limite de 320 páginas (o banquinho tem 9,6 MB).
2. `acdsmap.py` acha o SAB de cada sólido pelo handle da entidade (a tabela de
   20 bytes por sólido no início do segmento `_data_`).
3. `sabraw.py` + `brep.py` leem o B-rep (faces, laços, arestas, curvas reta,
   elipse e NURBS) e triangulam planos, cones/cilindros e toros.
4. `assemble.py` percorre `*Model_Space` e os `INSERT` (blocos aninhados) para
   achar a matriz de cada peça.
5. `banquinho_para_glb.py` escolhe as peças do banquinho e grava o `.glb`.

## Como rodar

```bash
git clone https://github.com/LibreDWG/libredwg && cd libredwg
git submodule update --init jsmn && git apply ../tools/dwg-para-glb/libredwg-acds.patch
mkdir build && cd build && cmake .. -DCMAKE_BUILD_TYPE=Release && make dwgread
ACDS_OUT=banq.acds ./dwgread -O json -o banq.json banquinho_retratil.dwg
pip install ezdxf trimesh numpy mapbox-earcut
python3 ../../tools/dwg-para-glb/banquinho_para_glb.py banq.json banq.acds banquinho.glb
```

`view.py` desenha uma prévia em PNG (matplotlib) para conferir uma malha antes
de levar para o app.

## Escala

O desenho está em milímetros e em **escala 1:10**: o assento mede 45 mm no
desenho e 0,45 m de verdade. O `ESCALA = 0.01` do conversor faz essa conta.
A escala foi confirmada contra o app (altura do assento ~0,53 m e fundo da
cadeira de 0,42 m); ver `app/src/cena3d/banquinho.ts`.

## Limites conhecidos

- Superfícies `spline-surface` (raras) não são triangulizadas; a face é
  ignorada e fica registrada no log.
- Faces periódicas com um laço só e sem cone (ex.: cilindro de uma face só)
  não são suportadas.
- Os desenhos são folhas de peças em vista explodida, não montagens prontas:
  quem monta é o script de cada produto (`banquinho_para_glb.py`).
