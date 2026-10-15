import re
from collections import Counter
from ezdxf.acis.sab import Decoder
def blobs(path):
    d=open(path,'rb').read()
    st=[m.start() for m in re.finditer(b'ASM BinaryFile4',d)]+[len(d)]
    pat=b'\x0e\x03ASM\r\x04data'
    for i in range(len(st)-1):
        b=d[st[i]:st[i+1]]
        e=b.rfind(pat)
        yield b[:e+len(pat)]
def records(blob):
    dec=Decoder(blob); h=dec.read_header()
    return h, list(dec.read_records())
if __name__=='__main__':
    import sys
    for i,b in enumerate(blobs(sys.argv[1])):
        h,r=records(b)
        c=Counter()
        for rec in r:
            name=''.join(str(t.value) if t.tag in (0x0d,0x0e) else '' for t in rec[:4])
            c[name]+=1
        print(i,len(r),dict(c))
