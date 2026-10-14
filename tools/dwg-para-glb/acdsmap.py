import re,struct
SIG=b'ASM BinaryFile4'
END=b'\x0e\x03ASM\r\x04data'
def handle_blobs(raw):
    segs=[m.start() for m in re.finditer(rb'\xac\xd5_data_',raw)]
    segs.append(len(raw))
    out={}
    for a,b in zip(segs,segs[1:]):
        for h,v in _handle_blobs(raw[a:b]).items(): out.setdefault(h,v)
    if not out: out=_handle_blobs(raw)
    return out
def _handle_blobs(raw):
    """-> {handle:int -> sab bytes}"""
    ents=[]
    for m in re.finditer(rb'\x14\x00\x00\x00\x01\x00\x00\x00(.{8})(.{4})',raw,re.S):
        h=struct.unpack('<Q',m.group(1))[0]; off=struct.unpack('<I',m.group(2))[0]
        ents.append((h,off,m.start()))
    asm=[m.start() for m in re.finditer(SIG,raw)]
    asmset=set(asm)
    best=None
    # calibrate base using the many candidate entries
    from collections import Counter
    cnt=Counter()
    for h,off,pos in ents:
        for a in asm[:6]:
            cnt[a-4-off]+=1
    if not cnt: return {}
    base,_=cnt.most_common(1)[0]
    out={}
    for h,off,pos in ents:
        p=base+off+4
        if p in asmset:
            nxt=[a for a in asm if a>p]
            e=raw.find(END,p,(nxt[0] if nxt else len(raw)))
            if e<0: continue
            out.setdefault(h,raw[p:e+len(END)])
    return out
if __name__=='__main__':
    import sys
    r=open(sys.argv[1],'rb').read()
    m=handle_blobs(r)
    print(len(m),[hex(h) for h in list(m)[:12]])
