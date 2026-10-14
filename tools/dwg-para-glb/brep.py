"""ASM/ACIS SAB B-rep -> triangle mesh (plane, cone/cylinder, torus faces)."""
import math, numpy as np, mapbox_earcut as earcut
from sabraw import records

TAU = 2*math.pi
# Resolução da malha (rad): passo máximo ao amostrar arcos e ao subdividir faces curvas.
PASSO_ARESTA = math.pi/32
PASSO_REFINO = math.pi/10
def V(x): return np.array(x, float)
def unit(v):
    n = np.linalg.norm(v); return v/n if n > 1e-12 else v

class Brep:
    def __init__(self, blob, flip_faces=False, log=None):
        self.h, self.R = records(blob)
        self.name = [r[0].value for r in self.R]
        self.log = log if log is not None else []
        self.flip_faces = flip_faces
        self._edge_cache = {}
        self.T = np.eye(4)
        for i, n in enumerate(self.name):
            if n == 'transform':
                t = self.R[i]
                rot = np.array([t[3].value, t[4].value, t[5].value])  # rows
                tr = V(t[6].value); sc = t[7].value
                M = np.eye(4); M[:3, :3] = rot.T * sc if False else rot.T*sc
                M[:3, 3] = tr; self.T = M
    # -- helpers
    def ptr(self, rec, k):
        t = rec[k]; return t.value if t.tag == 0x0c else -1
    def tok(self, i): return self.R[i]
    def point_of_vertex(self, vi):
        v = self.R[vi]; p = self.R[self.ptr(v, 6)]; return V(p[4].value)
    # -- curves
    def edge_points(self, ei):
        if ei in self._edge_cache: return self._edge_cache[ei]
        e = self.R[ei]
        v0 = self.ptr(e, 4); v1 = self.ptr(e, 6)
        p0 = self.point_of_vertex(v0); p1 = self.point_of_vertex(v1)
        t0 = e[5].value; t1 = e[7].value
        ci = self.ptr(e, 9)
        pts = [p0, p1]
        if ci >= 0:
            c = self.R[ci]; cn = c[0].value
            if cn == 'ellipse-curve':
                C = V(c[4].value); N = unit(V(c[5].value)); A = V(c[6].value); ratio = c[7].value
                B = np.cross(N, A)*ratio
                n = max(2, int(math.ceil(abs(t1-t0)/PASSO_ARESTA)))
                ts = np.linspace(t0, t1, n+1)
                pts = [C + A*math.cos(t) + B*math.sin(t) for t in ts]
                if np.linalg.norm(pts[0]-p0) > np.linalg.norm(pts[0]-p1) + 1e-6 and np.linalg.norm(pts[-1]-p1) > 1e-6:
                    pts = pts[::-1]
            elif cn == 'intcurve-curve':
                try:
                    pts = self.nurbs_edge(c, t0, t1, p0, p1)
                except Exception as ex:
                    self.log.append(f'intcurve fail {ex}')
        self._edge_cache[ei] = pts
        return pts
    def nurbs_edge(self, c, t0, t1, p0, p1):
        toks = list(c)
        k = next(i for i, t in enumerate(toks) if t.tag == 0x0d and t.value == 'nubs')
        deg = toks[k+1].value
        i = k+3  # skip deg, 0x15
        nk = toks[i].value; i += 1
        knots = []; mults = []
        for _ in range(nk):
            knots.append(toks[i].value); mults.append(toks[i+1].value); i += 2
        floats = []
        while toks[i].tag == 0x06:
            floats.append(toks[i].value); i += 1
        U = []
        for j, (kv, m) in enumerate(zip(knots, mults)):
            U += [kv]*m
        U = [U[0]] + U + [U[-1]]
        ncp = len(U)-deg-1
        cps = np.array(floats[:3*ncp]).reshape(-1, 3)
        def ev(t):
            t = min(max(t, U[deg]), U[ncp])
            kspan = max(j for j in range(deg, ncp) if U[j] <= t) if t < U[ncp] else ncp-1
            d = [cps[j+kspan-deg].copy() for j in range(deg+1)]
            for r in range(1, deg+1):
                for j in range(deg, r-1, -1):
                    den = U[j+1+kspan-r]-U[j+kspan-deg]
                    a = (t-U[j+kspan-deg])/den if den > 1e-14 else 0
                    d[j] = (1-a)*d[j-1]+a*d[j]
            return d[deg]
        lo, hi = (t0, t1)
        n = 24
        pts = [ev(lo+(hi-lo)*s/n) for s in range(n+1)]
        if np.linalg.norm(pts[0]-p0) > np.linalg.norm(pts[0]-p1): pts = pts[::-1]
        pts[0] = p0; pts[-1] = p1
        return pts
    # -- loops
    def loop_polyline(self, li):
        L = self.R[li]; first = self.ptr(L, 5); ce = first; pts = []
        guard = 0
        while True:
            c = self.R[ce]; ei = self.ptr(c, 7); rev = c[8].value
            ep = list(self.edge_points(ei))
            if rev: ep = ep[::-1]
            if pts and np.linalg.norm(pts[-1]-ep[0]) < 1e-7: ep = ep[1:]
            pts += ep
            ce = self.ptr(c, 4); guard += 1
            if ce == first or ce < 0 or guard > 5000: break
        if len(pts) > 1 and np.linalg.norm(pts[0]-pts[-1]) < 1e-7: pts = pts[:-1]
        return np.array(pts)
    # -- faces
    def faces(self):
        for i, n in enumerate(self.name):
            if n == 'face': yield i
    def face_loops(self, fi):
        f = self.R[fi]; li = self.ptr(f, 5); out = []
        while li >= 0:
            out.append(li); li = self.ptr(self.R[li], 4)
        return out
    def mesh_face(self, fi):
        f = self.R[fi]
        si = self.ptr(f, 8); s = self.R[si]; sn = s[0].value
        reversed_ = bool(f[9].value) ^ self.flip_faces
        loops = [self.loop_polyline(l) for l in self.face_loops(fi)]
        loops = [l for l in loops if len(l) >= 3]
        if not loops: return None
        if sn == 'plane-surface':
            O = V(s[4].value); N = unit(V(s[5].value)); U = unit(V(s[6].value)); W = np.cross(N, U)
            uv = [np.c_[(l-O)@U, (l-O)@W] for l in loops]
            verts, tris = self.earcut_polys(uv)
            if verts is None: return None
            P = O + np.outer(verts[:, 0], U) + np.outer(verts[:, 1], W)
            nrm = np.tile(N, (len(P), 1))
            return self.finish(P, nrm, tris, reversed_)
        if sn in ('cone-surface', 'torus-surface'):
            return self.mesh_periodic(s, sn, loops, reversed_)
        self.log.append(f'unsupported surface {sn}')
        return None
    def earcut_polys(self, uvs):
        # outer = largest abs area
        def area(p): x, y = p[:, 0], p[:, 1]; return 0.5*np.sum(x*np.roll(y, -1)-np.roll(x, -1)*y)
        order = sorted(range(len(uvs)), key=lambda k: -abs(area(uvs[k])))
        rings = [uvs[k] for k in order]
        verts = np.vstack(rings).astype(float)
        ends = np.cumsum([len(r) for r in rings]).astype(np.uint32)
        tri = earcut.triangulate_float64(verts, ends)
        return verts, np.array(tri).reshape(-1, 3)
    def finish(self, P, nrm, tris, reversed_):
        if reversed_: nrm = -nrm
        # orient triangles to normal
        a, b, c = P[tris[:, 0]], P[tris[:, 1]], P[tris[:, 2]]
        gn = np.cross(b-a, c-a)
        avg = nrm[tris[:, 0]]+nrm[tris[:, 1]]+nrm[tris[:, 2]]
        flip = np.einsum('ij,ij->i', gn, avg) < 0
        tris = tris.copy(); tris[flip] = tris[flip][:, ::-1]
        ok = np.linalg.norm(gn, axis=1) > 1e-12
        return P, nrm, tris[ok]
    # -- periodic surfaces
    def mesh_periodic(self, s, sn, loops, reversed_):
        C = V(s[4].value); A = unit(V(s[5].value))
        if sn == 'cone-surface':
            Mv = V(s[6].value); r0 = np.linalg.norm(Mv); X = unit(Mv); Y = np.cross(A, X)
            ratio = s[7].value
            sinr = s[10].value; cosr = s[11].value
            tanr = sinr/cosr if abs(cosr) > 1e-12 else 0.0
            # auto-pick sign of tan using boundary samples
            allp = np.vstack(loops); rel = allp-C; h = rel@A
            rho = np.linalg.norm(rel-np.outer(h, A), axis=1)
            e1 = np.abs(rho-(r0+h*tanr)).max(); e2 = np.abs(rho-(r0-h*tanr)).max()
            if e2 < e1: tanr = -tanr
            def ev(u, v):
                r = r0+v*tanr
                rad = np.outer(np.cos(u), X)+np.outer(np.sin(u), Y)
                P = C+rad*r[:, None]+np.outer(v, A)
                n = rad - np.outer(np.full(len(u), tanr), A)  # outward normal ~ radial - tan*axis
                n = n/np.linalg.norm(n, axis=1)[:, None]
                return P, n
            def inv(p):
                rel = p-C; h = rel@A; q = rel-np.outer(h, A)
                u = np.arctan2(q@Y, q@X); return np.c_[u, h]
            periodic = (True, False)
        else:
            R_ = s[6].value; r_ = s[7].value; X = unit(V(s[8].value)); Y = np.cross(A, X)
            def ev(u, v):
                rad = np.outer(np.cos(u), X)+np.outer(np.sin(u), Y)
                P = C+rad*(R_+r_*np.cos(v))[:, None]+np.outer(r_*np.sin(v), A)
                n = rad*np.cos(v)[:, None]+np.outer(np.sin(v), A)
                return P, n
            def inv(p):
                rel = p-C; h = rel@A; q = rel-np.outer(h, A)
                u = np.arctan2(q@Y, q@X); rho = np.linalg.norm(q, axis=1)
                v = np.arctan2(h, rho-R_); return np.c_[u, v]
            periodic = (True, True)
        uvs = []; wind = []
        for l in loops:
            uv = inv(l); w = [0, 0]
            for ax in range(2):
                if not periodic[ax]: continue
                x = uv[:, ax].copy()
                d = np.diff(np.r_[x, x[0]]); d = (d+math.pi) % TAU-math.pi
                xs = x[0]+np.r_[0, np.cumsum(d[:-1])]
                w[ax] = int(round(d.sum()/TAU))
                uv[:, ax] = xs
            uvs.append(uv); wind.append(w)
        if all(w == [0, 0] for w in wind):
            # shift holes to sit inside outer
            def area(p): x, y = p[:, 0], p[:, 1]; return 0.5*np.sum(x*np.roll(y, -1)-np.roll(x, -1)*y)
            order = sorted(range(len(uvs)), key=lambda k: -abs(area(uvs[k])))
            outer = uvs[order[0]]
            def inside(pt, poly):
                x, y = pt; c = False; n = len(poly)
                for i in range(n):
                    x1, y1 = poly[i]; x2, y2 = poly[(i+1) % n]
                    if (y1 > y) != (y2 > y) and x < (x2-x1)*(y-y1)/(y2-y1)+x1: c = not c
                return c
            rings = [outer]
            for k in order[1:]:
                h = uvs[k]; best = h
                for du in (0, TAU, -TAU):
                    for dv in ((0, TAU, -TAU) if periodic[1] else (0,)):
                        cand = h+np.array([du, dv])
                        if inside(cand.mean(0), outer): best = cand
                rings.append(best)
            verts, tris = self.earcut_polys(rings)
            return self.refine_eval(verts, tris, ev, reversed_, periodic)
        # band between two winding loops
        wu = [k for k, w in enumerate(wind) if w[0] != 0 and w[1] == 0]
        wv = [k for k, w in enumerate(wind) if w[1] != 0 and w[0] == 0]
        if len(wu) == 2:
            return self.mesh_band([uvs[k] for k in wu], ev, reversed_)
        if len(wv) == 2:
            sw = [uvs[k][:, ::-1].copy() for k in wv]
            return self.mesh_band(sw, lambda a, b: ev(b, a), reversed_)
        if len(wu) == 1 and sn == 'cone-surface' and abs(tanr) > 1e-9:
            vapex = -r0/tanr
            uv = uvs[wu[0]]
            apex = uv.copy(); apex[:, 1] = vapex
            return self.mesh_band([uv, apex], ev, reversed_)
        self.log.append(f'periodic face winding unsupported {wind} ({sn})')
        return None
    def mesh_band(self, loops, ev, reversed_):
        funcs = []; us = set()
        for uv in loops:
            u = uv[:, 0]; v = uv[:, 1]
            if u[-1] < u[0] or (u[-1]-u[0] < 0): pass
            # make ascending cyclic
            if (np.r_[u, u[0]+ (TAU if True else 0)] if False else None) is None: pass
            tot = (np.diff(np.r_[u, u[0]]) + math.pi) % TAU - math.pi
            if tot.sum() < 0:
                u = u[::-1]; v = v[::-1]
            um = np.mod(u, TAU); order = np.argsort(um)
            ums = um[order]; vs = v[order]
            funcs.append((ums, vs)); us.update(ums.tolist())
        us = sorted(set(np.round(list(us)+list(np.linspace(0, TAU, 49)[:-1]), 9)))
        us = np.array(us+[us[0]+TAU])
        def vf(ums, vs, uu):
            x = np.r_[ums-TAU, ums, ums+TAU]; y = np.r_[vs, vs, vs]
            return np.interp(np.mod(uu, TAU)+0.0, ums, vs, period=TAU)
        vA = vf(*funcs[0], us); vB = vf(*funcs[1], us)
        n = len(us)
        uu = np.r_[us, us]; vv = np.r_[vA, vB]
        P, N = ev(uu, vv)
        tris = []
        for i in range(n-1):
            a, b, c, d = i, i+1, n+i, n+i+1
            tris += [[a, b, c], [b, d, c]]
        return self.finish(P, N, np.array(tris), reversed_)
    def refine_eval(self, verts, tris, ev, reversed_, periodic):
        # subdivide long triangles in uv
        V_ = [tuple(v) for v in verts]; T = [tuple(t) for t in tris]
        cache = {}
        def mid(a, b):
            key = (min(a, b), max(a, b))
            if key in cache: return cache[key]
            V_.append(tuple((np.array(V_[a])+np.array(V_[b]))/2)); cache[key] = len(V_)-1; return cache[key]
        for _ in range(4):
            nt = []; changed = False
            for a, b, c in T:
                pa, pb, pc = np.array(V_[a]), np.array(V_[b]), np.array(V_[c])
                lens = [abs(pa[0]-pb[0]), abs(pb[0]-pc[0]), abs(pc[0]-pa[0])]
                lensv = [abs(pa[1]-pb[1]), abs(pb[1]-pc[1]), abs(pc[1]-pa[1])]
                if max(lens) > PASSO_REFINO or (periodic[1] and max(lensv) > PASSO_REFINO):
                    ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
                    nt += [(a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)]; changed = True
                else: nt.append((a, b, c))
            T = nt
            if not changed: break
        Vn = np.array(V_)
        P, N = ev(Vn[:, 0], Vn[:, 1])
        return self.finish(P, N, np.array(T), reversed_)
    def mesh(self):
        Ps = []; Ns = []; Ts = []; off = 0
        for fi in self.faces():
            try: r = self.mesh_face(fi)
            except Exception as ex:
                import traceback; self.log.append(f'face {fi} EXC {ex!r}'); r = None
            if r is None: continue
            P, N, T = r
            Ps.append(P); Ns.append(N); Ts.append(T+off); off += len(P)
        if not Ps: return None
        P = np.vstack(Ps); N = np.vstack(Ns); T = np.vstack(Ts)
        h = np.append(P.T, np.ones((1, len(P))), 0)
        P = (self.T@h)[:3].T
        N = N@self.T[:3, :3].T
        return P, N, T

def volume(P, T):
    a, b, c = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    return np.einsum('ij,ij->i', a, np.cross(b, c)).sum()/6
