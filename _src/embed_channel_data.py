"""채널 대시보드용 데이터 내장 스크립트.

엑셀 파일을 base64로 인코딩해 dashboards/channel-dashboard/data.js 로 저장한다.
대시보드는 이 파일을 먼저 읽으므로, 이후 엑셀 파일이 없어도 동작한다.

사용법: python _src/embed_channel_data.py [엑셀 경로]
  경로를 생략하면 dashboards/channel-dashboard/Raw_data.xlsx → ~/Downloads/Raw_data.xlsx 순으로 찾는다.
"""
import base64
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dashboards" / "channel-dashboard" / "data.js"
CANDIDATES = [
    ROOT / "dashboards" / "channel-dashboard" / "Raw_data.xlsx",
    Path.home() / "Downloads" / "Raw_data.xlsx",
]


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else next((p for p in CANDIDATES if p.exists()), None)
    if not src or not src.exists():
        sys.exit("엑셀 파일을 찾을 수 없습니다: " + ", ".join(str(p) for p in CANDIDATES))
    enc = base64.b64encode(src.read_bytes()).decode("ascii")
    lines = [enc[i:i + 120] for i in range(0, len(enc), 120)]
    js = (
        "// 대시보드에 내장된 데이터 (_src/embed_channel_data.py 로 생성, 직접 수정하지 마세요)\n"
        "// 원본: " + src.name + " — 엑셀 파일 없이도 대시보드가 이 데이터를 바로 표시합니다.\n"
        "window.EMBEDDED_WORKBOOK = {\n"
        "  name: '" + src.name + "',\n"
        "  base64:\n"
        + " +\n".join("    '" + l + "'" for l in lines)
        + "\n};\n"
    )
    OUT.write_text(js, encoding="utf-8")
    print(f"{src} -> {OUT} ({src.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
