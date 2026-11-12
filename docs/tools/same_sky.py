import ephem, math, json
BODIES=[("Sun",ephem.Sun),("Mercury",ephem.Mercury),("Venus",ephem.Venus),("Mars",ephem.Mars),("Jupiter",ephem.Jupiter),("Saturn",ephem.Saturn),("Uranus",ephem.Uranus),("Neptune",ephem.Neptune)]
def lons(date):
    out=[]
    for n,c in BODIES:
        b=c(date); out.append(math.degrees(ephem.Ecliptic(b,epoch=date).lon)%360)
    return out
her=lons('2002/10/30 17:00:00')
people=[
 ("Pablo Picasso","painter","1881/10/25","25 October 1881"),
 ("Vincent van Gogh","painter","1853/03/30","30 March 1853"),
 ("Frida Kahlo","painter","1907/07/06","6 July 1907"),
 ("Marie Curie","scientist","1867/11/07","7 November 1867"),
 ("Hayao Miyazaki","film artist","1941/01/05","5 January 1941"),
 ("Akira Toriyama","manga artist","1955/04/05","5 April 1955"),
 ("Achraf Hakimi","footballer","1998/11/04","4 November 1998"),
 ("Billie Eilish","singer","2001/12/18","18 December 2001"),
]
res=[]
for n,job,d,label in people:
    L=lons(d+' 12:00:00')
    ds=[abs((a-b+180)%360-180) for a,b in zip(her,L)]
    score=100*(1-sum(ds)/len(ds)/180)
    close=sorted(zip([b[0] for b in BODIES],ds),key=lambda x:x[1])[:2]
    res.append((score,n,job,label,[(a,round(b,1)) for a,b in close]))
res.sort(reverse=True)
for r in res: print(round(r[0],1),r[1:])
json.dump([{"name":r[1],"job":r[2],"born":r[3],"score":round(r[0]),"top":r[4]} for r in res],open('/tmp/work/same_sky.json','w'),indent=1)
