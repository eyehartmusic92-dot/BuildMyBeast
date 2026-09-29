"""Generate curated member pages and keep their sitemap entries in sync."""
import html,json,re
from pathlib import Path
from urllib.parse import urlencode
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://buildmybeast.com'
def esc(value):return html.escape(str(value),quote=True)
def layout(path,title,description,body,image=None):
    url=ORIGIN+'/'+path
    image=image or ORIGIN+'/BuildMyBeast.png'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} | BuildMyBeast</title><meta name="description" content="{esc(description)}"><link rel="canonical" href="{esc(url)}"><meta property="og:type" content="article"><meta property="og:site_name" content="BuildMyBeast"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{esc(url)}"><meta property="og:image" content="{esc(image)}"><meta property="og:image:alt" content="{esc(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{esc(image)}"><link rel="stylesheet" href="/site.css"><script async src="https://www.googletagmanager.com/gtag/js?id=G-Z5NXD2D67Y"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}gtag('js',new Date());gtag('config','G-Z5NXD2D67Y');</script></head><body><a class="skip-link" href="#content">Skip to content</a><nav><div class="wrap nav"><a class="logo" href="/">BUILD<i>MY</i>BEAST</a><a href="/#builder">Build Planner</a><a href="/builds/">Member Builds</a><a href="/guides/">Build Guides</a></div></nav><main id="content" class="wrap">{body}</main><footer><div class="wrap"><a href="/#about">About, Privacy &amp; Affiliate Disclosure</a> · <a href="mailto:contact@buildmybeast.com">Contact BuildMyBeast</a></div></footer><script src="/page.js"></script></body></html>'''
def planner_link(row):
    p=row.get('planner',{})
    if not p:return '/#builder'
    q={key:str(p[key]) for key in ['type','make','model','year','style','budget'] if p.get(key)}
    q.update({'u_'+key:str(value) for key,value in p.get('upgrades',{}).items()})
    q.update(utm_source='beast_gallery',utm_medium='member_build',utm_campaign=row['slug'])
    return '/?'+urlencode(q)+'#builder'
def generate():
    rows=json.loads((ROOT/'gallery/approved.json').read_text())
    cards=[]
    paths=[]
    for row in rows:
        slug=row.get('slug','')
        if not re.fullmatch(r'[a-z0-9-]{1,60}',slug):continue
        title=row['title']+' · '+row['vehicle']
        path='builds/'+slug+'.html'
        description=row.get('description') or row['vehicle']+' with '+row.get('mods','')
        photo=row['imageUrl'].replace('/image/upload/','/image/upload/f_auto,q_auto,w_1400/')
        social=row['imageUrl'].replace('/image/upload/','/image/upload/c_pad,b_black,w_1200,h_630,q_auto,f_jpg/')
        extra=''.join('<img class="photo" loading="lazy" src="'+esc(url.replace('/image/upload/','/image/upload/f_auto,q_auto,w_1400/'))+'" alt="'+esc(title+' additional view')+'">' for url in row.get('photos',[])[:5] if isinstance(url,str) and url.startswith('https://res.cloudinary.com/yfpthneq/image/upload/'))
        credit='<p class="mini">Owner credit: '+esc(row['ownerName'])+'</p>' if row.get('ownerName') else ''
        mods=''.join('<li>'+esc(x.strip())+'</li>' for x in row.get('mods','').split(',') if x.strip())
        body=f'''<div class="ey">Approved member build · {esc(row['category'])}</div><h1>{esc(row['title'])}</h1><p><strong>{esc(row['vehicle'])}</strong></p><img class="photo" src="{esc(photo)}" alt="{esc(title)}" decoding="async"><p>{esc(description)}</p>{credit}{extra}<h2>Owner-submitted modifications</h2><ul>{mods}</ul><div class="actions"><button class="btn ghost" data-share type="button">Share This Build</button><button class="btn ghost" data-copy type="button">Copy Build Link</button><a class="btn" data-event="member_build_to_planner" href="{esc(planner_link(row))}">Plan a Similar Build →</a><a class="btn ghost" href="/#submitBuild">Submit Your Own Build →</a></div><p class="mini">To request a photo or project update, email contact@buildmybeast.com with this build link. Updates are reviewed before publication.</p><p class="mini">The modifications are the submitted build description. The planner loads suggested upgrade categories and estimates; it does not identify the exact products shown or certify their fitment.</p><div class="card"><h2>Keep this project moving</h2><p>Compare upgrade choices in My Garage and record real quotes in the free project workbook.</p><div class="actions"><a class="btn ghost" href="/resources/build-workbook.html">Free Build Workbook</a><a class="btn ghost" href="/#buildAlerts">Get Free Build Alerts</a></div></div>'''
        (ROOT/path).parent.mkdir(parents=True,exist_ok=True)
        (ROOT/path).write_text(layout(path,title,description,body,social))
        paths.append(path)
        cards.append(f'<article class="card"><img class="thumb" src="{esc(photo.replace("w_1400","w_600"))}" alt="{esc(title)}" loading="lazy" decoding="async"><h2>{esc(row["title"])}</h2><p>{esc(row["vehicle"])}</p><p>{esc(row.get("mods",""))}</p><a class="btn" href="/{esc(path)}">Explore This Build →</a></article>')
    (ROOT/'builds/index.html').write_text(layout('builds/','Real Member Builds','Explore approved member vehicles, modifications, and similar-build planning links.','<div class="ey">Community inspiration</div><h1>Real builds. Real inspiration.</h1><p>Explore featured member projects, then plan your own direction.</p><div class="grid">'+''.join(cards)+'</div><div class="actions"><a class="btn ghost" href="/#gallery">See All Recently Approved Builds →</a><a class="btn" href="/#submitBuild">Submit Your Build →</a></div>'))
    sitemap=ROOT/'sitemap.xml'
    existing=re.findall(r'<loc>(.*?)</loc>',sitemap.read_text())
    urls=list(dict.fromkeys(existing+[ORIGIN+'/'+p for p in paths]+[ORIGIN+'/builds/',ORIGIN+'/partners/',ORIGIN+'/resources/build-workbook.html']))
    urls += [ORIGIN+'/guides/'+p.name for p in (ROOT/'guides').glob('*.html') if ORIGIN+'/guides/'+p.name not in urls and p.name!='index.html']
    sitemap.write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+esc(url)+'</loc></url>\n' for url in urls)+'</urlset>\n')
if __name__=='__main__':generate()
