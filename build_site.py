# -*- coding: utf-8 -*-
import json, html, re, os

BLOCKS = json.load(open('notion_all.json', encoding='utf-8'))['block']
TOP = '5f9dc660-554a-46e7-9147-908b56ce323c'
OUTDIR = 'dashboards/dunwich-campaign'

def val(bid):
    w = BLOCKS.get(bid)
    if not w: return None
    try: return w['value']['value']
    except: return None

# ---- image map (files already in assets/) ----
IMGMAP = {}
for bid, w in BLOCKS.items():
    v = w['value']['value']
    if v.get('type') != 'image': continue
    src = v.get('properties', {}).get('source')
    if not src: continue
    ext = os.path.splitext(src[0][0].split('?')[0])[1] or '.png'
    IMGMAP[bid] = 'assets/img_%s%s' % (bid[:8], ext)

# ---- page file naming ----
def page_file(pid):
    pid = pid.replace('-', '').lower()
    return 'index.html' if pid == TOP.replace('-', '') else pid + '.html'

# ---- rich text ----
COLOR = {'gray':'c-gray','brown':'c-brown','orange':'c-orange','yellow':'c-yellow',
         'green':'c-green','blue':'c-blue','purple':'c-purple','pink':'c-pink',
         'red':'c-red','teal':'c-teal'}
def color_class(name):
    if name.endswith('_background'):
        return 'bg-' + name[:-len('_background')]
    return COLOR.get(name, '')

def href_fix(url):
    m = re.match(r'^/([0-9a-fA-F]{32})', url)
    if m:
        return page_file(m.group(1))
    return url

def rich(title):
    if not title: return ''
    out = []
    for seg in title:
        text = html.escape(seg[0]).replace('\n', '<br>')
        fmts = seg[1] if len(seg) > 1 else []
        classes, href = [], None
        bold = ital = strike = code = False
        for f in fmts:
            c = f[0]
            if c == 'b': bold = True
            elif c == 'i': ital = True
            elif c == 's': strike = True
            elif c == 'c': code = True
            elif c == 'h':
                cc = color_class(f[1])
                if cc: classes.append(cc)
            elif c == 'a': href = href_fix(f[1])
        inner = text
        if classes: inner = '<span class="%s">%s</span>' % (' '.join(classes), inner)
        if code: inner = '<code>%s</code>' % inner
        if strike: inner = '<s>%s</s>' % inner
        if ital: inner = '<em>%s</em>' % inner
        if bold: inner = '<strong>%s</strong>' % inner
        if href is not None:
            ext = href.startswith('http')
            tgt = ' target="_blank" rel="noopener"' if ext else ''
            inner = '<a href="%s"%s>%s</a>' % (html.escape(href), tgt, inner)
        out.append(inner)
    return ''.join(out)

def plain(title):
    return ''.join(seg[0] for seg in title) if title else ''

# ---- block rendering ----
def render_children(ids, as_home=False):
    out = []
    i, n = 0, len(ids)
    while i < n:
        v = val(ids[i])
        if not v:
            i += 1; continue
        t = v.get('type')
        if t in ('bulleted_list', 'numbered_list'):
            tag = 'ul' if t == 'bulleted_list' else 'ol'
            items = []
            while i < n:
                v2 = val(ids[i])
                if not v2 or v2.get('type') != t: break
                li = rich(v2.get('properties', {}).get('title'))
                kids = v2.get('content')
                if kids: li += render_children(kids)
                items.append('<li>%s</li>' % li)
                i += 1
            out.append('<%s>%s</%s>' % (tag, ''.join(items), tag))
            continue
        if t == 'page':
            # only the home page lists sub-pages, as TOC cards
            if as_home:
                title = plain(v.get('properties', {}).get('title'))
                out.append('<a class="toc-card" href="%s"><span class="toc-ico">📄</span>%s</a>'
                           % (page_file(ids[i]), html.escape(title)))
            i += 1; continue
        out.append(render_block(ids[i], v))
        kids = v.get('content')
        if kids and t not in ('page', 'alias'):
            out.append('<div class="indent">%s</div>' % render_children(kids))
        i += 1
    return ''.join(out)

ENDING_RE = re.compile(r'^\s*(결말\s*\d|아무\s*결말|아무런\s*결말)')

def render_block(bid, v):
    t = v.get('type')
    pr = v.get('properties', {})
    if t == 'text':
        txt = rich(pr.get('title'))
        if not txt.strip():
            return '<p class="spacer"></p>'
        if ENDING_RE.match(plain(pr.get('title'))):
            return '<div class="ending"><p>%s</p></div>' % txt
        return '<p>%s</p>' % txt
    if t == 'header': return '<h2 class="bk">%s</h2>' % rich(pr.get('title'))
    if t == 'sub_header': return '<h3 class="bk">%s</h3>' % rich(pr.get('title'))
    if t == 'sub_sub_header': return '<h4 class="bk">%s</h4>' % rich(pr.get('title'))
    if t == 'quote': return '<blockquote>%s</blockquote>' % rich(pr.get('title'))
    if t == 'image':
        src = IMGMAP.get(bid)
        if not src: return ''
        cap = rich(pr.get('caption')) if pr.get('caption') else ''
        figcap = '<figcaption>%s</figcaption>' % cap if cap else ''
        return '<figure><img loading="lazy" src="%s" alt="">%s</figure>' % (src, figcap)
    if t == 'divider': return '<hr>'
    if t in ('page', 'alias'): return ''
    txt = rich(pr.get('title'))
    return ('<p>%s</p>' % txt) if txt.strip() else ''

def split_title(title):
    for sep in ('：', ':'):
        if sep in title:
            a, b = title.split(sep, 1)
            return a.strip(), b.strip()
    return '', title.strip()

# ---- assemble pages ----
top = val(TOP)
chapter_ids = [c for c in top['content'] if val(c) and val(c).get('type') == 'page']
SITE_TITLE = plain(top.get('properties', {}).get('title'))

# nav entries: (file, label)
nav_entries = [('index.html', '안내 · 목차')]
for cid in chapter_ids:
    nav_entries.append((page_file(cid), plain(val(cid).get('properties', {}).get('title'))))

def nav_html(current_file):
    lis = []
    for f, label in nav_entries:
        cls = ' class="active"' if f == current_file else ''
        lis.append('<li><a href="%s"%s>%s</a></li>' % (f, cls, html.escape(label)))
    return '\n'.join(lis)

# ---- campaign flow graph (branching next destinations) ----
chap_title = {c: plain(val(c).get('properties', {}).get('title')) for c in chapter_ids}
chap_by_hex = {c.replace('-', '').lower(): c for c in chapter_ids}
FLOW_KW = ('이어집니다', '진행합니다', '진행할 수 있습니다', '진행하십시오', '진행됩니다')

def collect_flow_links(ids, out):
    for i in ids:
        v = val(i)
        if not v: continue
        title = v.get('properties', {}).get('title')
        if title and any(k in plain(title) for k in FLOW_KW):
            for seg in title:
                if len(seg) > 1:
                    for f in seg[1]:
                        if f[0] == 'a':
                            m = re.match(r'^/([0-9a-f]{32})', f[1])
                            if m and m.group(1) in chap_by_hex:
                                cid = chap_by_hex[m.group(1)]
                                if cid not in out: out.append(cid)
        if v.get('content'): collect_flow_links(v['content'], out)

next_map = {}
for c in chapter_ids:
    nx = []
    collect_flow_links(val(c).get('content', []), nx)
    next_map[c] = [x for x in nx if x != c]
prev_map = {c: [] for c in chapter_ids}
for c in chapter_ids:
    for tgt in next_map[c]:
        if c not in prev_map[tgt]:
            prev_map[tgt].append(c)

def lin_prev(c):
    i = chapter_ids.index(c); return [chapter_ids[i-1]] if i > 0 else []
def lin_next(c):
    i = chapter_ids.index(c); return [chapter_ids[i+1]] if i < len(chapter_ids)-1 else []

HOME = ('index.html', '목차')

def nav_col(label, items, side):
    if not items:
        return '<div class="pn-col pn-%s pn-empty"></div>' % side
    branch = ' <span class="pn-branch">(결과에 따라)</span>' if len(items) > 1 else ''
    btns = ''.join('<a class="pn" href="%s"><b>%s</b></a>' % (f, html.escape(t)) for f, t in items)
    return '<div class="pn-col pn-%s"><span class="pn-label">%s%s</span>%s</div>' % (side, label, branch, btns)

def chapter_pagenav(c):
    prevs = prev_map[c] or lin_prev(c)
    prev_items = [(page_file(x), chap_title[x]) for x in prevs] or [HOME]
    next_items = [(page_file(x), chap_title[x]) for x in (next_map[c] or lin_next(c))]
    return ('<nav class="page-nav">%s%s</nav>'
            % (nav_col('← 이전', prev_items, 'prev'), nav_col('다음 →', next_items, 'next')))

def home_pagenav():
    first = chapter_ids[0]
    nxt = [(page_file(first), chap_title[first])]
    return '<nav class="page-nav">%s%s</nav>' % (nav_col('', [], 'prev'), nav_col('다음 →', nxt, 'next'))

TEMPLATE = open('template.html', encoding='utf-8').read()
CSS = open('site.css', encoding='utf-8').read()
JS = open('site.js', encoding='utf-8').read()

def write_page(filename, title, header, body, pagenav_html):
    out = (TEMPLATE
           .replace('__TITLE__', html.escape(title))
           .replace('__CSS__', CSS)
           .replace('__NAV__', nav_html(filename))
           .replace('__HEADER__', header)
           .replace('__BODY__', body)
           .replace('__PAGENAV__', pagenav_html)
           .replace('__JS__', JS))
    open(os.path.join(OUTDIR, filename), 'w', encoding='utf-8').write(out)

os.makedirs(OUTDIR, exist_ok=True)

# --- home page ---
HOME_HEADER = """<header class="hero">
    <div class="hero-tag">THE DUNWICH LEGACY · CHALLENGE MODE</div>
    <h1 class="hero-title">던위치의 유산<br><span>도전 모드</span></h1>
    <p class="hero-desc">아컴호러 카드게임 캠페인 안내서</p>
    <p class="hero-scroll">아래로 스크롤 ↓</p>
  </header>"""
intro_ids = [c for c in top['content'] if val(c) and val(c).get('type') != 'alias']
home_body = render_children(intro_ids, as_home=True)
write_page('index.html', SITE_TITLE, HOME_HEADER, home_body, home_pagenav())

# --- chapter pages ---
for cid in chapter_ids:
    v = val(cid)
    title = plain(v.get('properties', {}).get('title'))
    kicker, main = split_title(title)
    kick = '<span class="ph-kicker">%s</span>' % html.escape(kicker) if kicker else '<span class="ph-kicker">✦ ✦ ✦</span>'
    header = ('<header class="page-head"><div class="ph-inner">'
              '<a class="ph-home" href="index.html">← 목차</a>%s'
              '<h1 class="ph-title">%s</h1></div></header>') % (kick, html.escape(main))
    body = render_children(v.get('content', []))
    write_page(page_file(cid), '%s · %s' % (title, SITE_TITLE), header, body, chapter_pagenav(cid))

print('wrote', 1 + len(chapter_ids), 'pages to', OUTDIR)
