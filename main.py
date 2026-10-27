from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="몽글마음 | 나만의 작은 쉼", page_icon="🌱", layout="wide", initial_sidebar_state="collapsed")
ROOT = Path(__file__).parent
VILLAGE = ROOT / "components" / "village"

st.markdown("""
<style>
#MainMenu,footer,header{visibility:hidden}
.stApp{background:#FBF8FD}
.block-container{max-width:1600px;padding-top:1rem;padding-bottom:.8rem}
.mongle-intro{text-align:center;margin:0 auto 12px;max-width:780px}
.mongle-intro h1{font-size:clamp(1.8rem,3vw,2.5rem);letter-spacing:-1.5px;color:#493e57;margin-bottom:5px}
.mongle-intro p{font-size:14px;color:#8d8298;margin-top:0}
</style>
<div class="mongle-intro"><h1>🌱 몽글마음</h1><p>마음이 지친 날, 나만의 속도로 쉬어 가는 작은 마을</p></div>
""", unsafe_allow_html=True)

html = (VILLAGE / "index.html").read_text(encoding="utf-8")
css = (VILLAGE / "style.css").read_text(encoding="utf-8")
js = (VILLAGE / "game.js").read_text(encoding="utf-8")
page = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>{css}</style></head>
<body style="margin:0;background:transparent">{html}
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js"}}}}</script>
<script type="module">{js}</script></body></html>"""
components.html(page, height=1050, scrolling=False)
st.caption("몽글마음은 일상 속 휴식과 자기 이해를 돕기 위한 게임입니다. 의료적 진단이나 치료를 대신하지 않아요.")
