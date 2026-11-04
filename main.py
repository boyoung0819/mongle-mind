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
</style>
""", unsafe_allow_html=True)
html = (VILLAGE / "index.html").read_text(encoding="utf-8")
css = (VILLAGE / "style.css").read_text(encoding="utf-8")
js = (VILLAGE / "game.js").read_text(encoding="utf-8")
page = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>{css}</style></head>
<body style="margin:0;background:transparent">{html}
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js"}}}}</script>
<script type="module">{js}</script></body></html>"""
components.html(page, height=1250, scrolling=True)
st.caption("몽글마음은 일상 속 휴식과 자기 이해를 돕기 위한 게임입니다. 의료적 진단이나 치료를 대신하지 않아요.")
