import numpy as np, math, json
from loadjson import load
from acdsmap import handle_blobs
from brep import Brep
def H(x): return x[-1] if isinstance(x,list) else x
def ecs(ext):
    Az=np.array(ext,float); Az/=np.linalg.norm(Az)
    if abs(Az[0])<1/64 and abs(Az[1])<1/64: Ax=np.cross([0,1,0],Az)
    else: Ax=np.cross([0,0,1],Az)
    Ax/=np.linalg.norm(Ax); Ay=np.cross(Az,Ax)
    M=np.eye(4); M[:3,0]=Ax; M[:3,1]=Ay; M[:3,2]=Az; return M
def insert_matrix(ins,base):
    ext=ins.get('extrusion',[0,0,1]); rot=ins.get('rotation',0.0) or 0.0
    sc=ins.get('scale',[1,1,1]); ip=ins['ins_pt']
    T=np.eye(4); T[:3,3]=ip
    R=np.eye(4); c,s=math.cos(rot),math.sin(rot); R[:2,:2]=[[c,-s],[s,c]]
    S=np.diag([sc[0],sc[1],sc[2],1.0])
    B=np.eye(4); B[:3,3]=-np.array(base)
    return T@ecs(ext)@R@S@B
def parts(jsonpath, acdspath, flip=False, rootname='*Model_Space', log=None):
    d=load(jsonpath); objs=d['OBJECTS']
    byh={H(o['handle']):o for o in objs if 'handle' in o}
    blocks={H(o['handle']):o for o in objs if o.get('object')=='BLOCK_HEADER'}
    layers={H(o['handle']):o.get('name') for o in objs if o.get('object')=='LAYER'}
    blobs=handle_blobs(open(acdspath,'rb').read())
    root=[b for b in blocks.values() if b['name']==rootname][0]
    cache={}; out=[]; log=log if log is not None else []
    def walk(block,M,path):
        for eh in block.get('entities') or []:
            e=byh.get(H(eh))
            if not e: continue
            k=e.get('entity')
            if k=='INSERT':
                bh=blocks.get(H(e['block_header']))
                if not bh or e.get('invisible'): continue
                walk(bh, M@insert_matrix(e,bh.get('base_pt',[0,0,0])), path+[bh['name']])
            elif k=='3DSOLID':
                h=H(e['handle'])
                if h not in blobs: log.append(f'no blob {h}'); continue
                if h not in cache:
                    l=[]; m=Brep(blobs[h],flip_faces=flip,log=l).mesh(); cache[h]=(m,l)
                m,l=cache[h]
                if l: log.append((h,l[:2]))
                if m is None: continue
                out.append(dict(handle=h,layer=layers.get(H(e['layer'])),path=path,M=M,mesh=m,color=e.get('color')))
    walk(root,np.eye(4),[])
    return out,log
def apply(M,P): return (M@np.append(P.T,np.ones((1,len(P))),0))[:3].T
