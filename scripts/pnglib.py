import zlib, struct

def read_png(path):
    d=open(path,'rb').read()
    i=8; idat=b''; w=h=bd=ct=None; plte=None; trns=None
    while i<len(d):
        ln=struct.unpack('>I',d[i:i+4])[0]; typ=d[i+4:i+8]; data=d[i+8:i+8+ln]
        if typ==b'IHDR': w,h,bd,ct,_,_,_=struct.unpack('>IIBBBBB',data)
        elif typ==b'IDAT': idat+=data
        elif typ==b'PLTE': plte=data
        elif typ==b'tRNS': trns=data
        elif typ==b'IEND': break
        i+=12+ln
    raw=zlib.decompress(idat)
    ch={0:1,2:3,3:1,4:2,6:4}[ct]
    stride=w*ch
    out=bytearray(w*h*ch); prev=bytearray(stride); pos=0
    for y in range(h):
        f=raw[pos]; pos+=1
        line=bytearray(raw[pos:pos+stride]); pos+=stride
        for x in range(stride):
            a=line[x-ch] if x>=ch else 0
            b=prev[x]; c=prev[x-ch] if x>=ch else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                p=a+b-c; pa=abs(p-a); pb=abs(p-b); pc=abs(p-c)
                pr=a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
                line[x]=(line[x]+pr)&255
        out[y*stride:(y+1)*stride]=line
        prev=line
    # normalise to RGBA
    rgba=bytearray(w*h*4)
    for p in range(w*h):
        o=p*ch
        if ct==6: r,g,b,a=out[o],out[o+1],out[o+2],out[o+3]
        elif ct==2: r,g,b,a=out[o],out[o+1],out[o+2],255
        elif ct==4: r=g=b=out[o]; a=out[o+1]
        elif ct==0: r=g=b=out[o]; a=255
        else:
            idx=out[o]; r,g,b=plte[idx*3],plte[idx*3+1],plte[idx*3+2]
            a=trns[idx] if (trns and idx<len(trns)) else 255
        rgba[p*4:p*4+4]=bytes((r,g,b,a))
    return w,h,bytes(rgba)

def write_png(path,w,h,rgba):
    raw=bytearray()
    for y in range(h):
        raw.append(0); raw+=rgba[y*w*4:(y+1)*w*4]
    def chunk(t,d):
        c=struct.pack('>I',len(d))+t+d
        return c+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    png=b'\x89PNG\r\n\x1a\n'
    png+=chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))
    png+=chunk(b'IDAT',zlib.compress(bytes(raw),9))
    png+=chunk(b'IEND',b'')
    open(path,'wb').write(png)
