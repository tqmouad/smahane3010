import ephem, math, json
obs = ephem.Observer()
obs.lat, obs.lon, obs.elevation = '32.3373', '-6.3498', 620
obs.pressure = 0
obs.date = '2002/10/30 17:00:00'   # Morocco UTC+0 that day
SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
ELEM = ["Fire","Earth","Air","Water"]
MODE = ["Cardinal","Fixed","Mutable"]
bodies = [("Sun",ephem.Sun),("Moon",ephem.Moon),("Mercury",ephem.Mercury),("Venus",ephem.Venus),("Mars",ephem.Mars),
          ("Jupiter",ephem.Jupiter),("Saturn",ephem.Saturn),("Uranus",ephem.Uranus),("Neptune",ephem.Neptune),("Pluto",ephem.Pluto)]
def lon_of(cls, d):
    b = cls(d)
    e = ephem.Ecliptic(b, epoch=d)
    return math.degrees(e.lon) % 360
out = {"bodies":[], }
d0 = obs.date
for name, cls in bodies:
    l0 = lon_of(cls, d0)
    l1 = lon_of(cls, ephem.Date(d0+1))
    diff = (l1 - l0 + 540) % 360 - 180
    out["bodies"].append({"name":name,"lon":round(l0,2),"sign":SIGNS[int(l0//30)],"deg":round(l0%30,1),"retro": diff<0 and name not in("Sun","Moon")})
# angles
lst = float(obs.sidereal_time())  # radians
ramc = lst
eps = math.radians(23.4392911 - 0.0130042*((float(d0)+15019.5-51544.5)/36525.0 ) ) if False else math.radians(23.4392911)
# obliquity of date (approx, 2002): 23.4392911 - 46.815"*T
T = (float(d0)+36525.0-36525.0 - 36525.0*0)  # placeholder
jd = float(d0) + 2415020.0
Tc = (jd-2451545.0)/36525.0
eps = math.radians(23.4392911 - 0.0130042*Tc)
lat = math.radians(32.3373)
asc = math.degrees(math.atan2(math.cos(ramc), -(math.sin(ramc)*math.cos(eps)+math.tan(lat)*math.sin(eps)))) % 360
mc = math.degrees(math.atan2(math.sin(ramc), math.cos(ramc)*math.cos(eps))) % 360
out["asc"]={"lon":round(asc,2),"sign":SIGNS[int(asc//30)],"deg":round(asc%30,1)}
out["mc"]={"lon":round(mc,2),"sign":SIGNS[int(mc//30)],"deg":round(mc%30,1)}
# whole-sign houses: house 1 = sign of ascendant
h1 = int(asc//30)
for b in out["bodies"]:
    b["house"] = ((int(b["lon"]//30) - h1) % 12) + 1
# counts: 10 bodies + Ascendant
pts = [b["lon"] for b in out["bodies"]] + [asc]
el=[0]*4; mo=[0]*3
for l in pts:
    s=int(l//30); el[s%4]+=1; mo[s%3]+=1
out["elements"]=dict(zip(ELEM,el)); out["modes"]=dict(zip(MODE,mo))
print(json.dumps(out,indent=1))
json.dump(out,open('/tmp/work/chart.json','w'))
