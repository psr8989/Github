# AGENTS.md

이 저장소는 **GitHub Pages로 배포되는 정적 사이트 모음**입니다.
`https://psr8989.github.io/Github/` 아래에 여러 인터랙티브 페이지를 게시합니다.

---

## 1. 배포되는 사이트

| 경로 | 내용 |
|------|------|
| `index.html` | 랜딩 페이지 — 대시보드들을 한 페이지에서 모아 보여주는 포털 |
| `README.md` | 사이트 안내(대시보드 목록) |
| `dashboards/` | **모든 대시보드는 이 폴더 안에 둡니다.** 새 대시보드도 여기에 하위 폴더로 추가하세요. |
| `dashboards/campaign-dashboard/index.html` | 캠페인 반응 예측 ML 대시보드 |
| `dashboards/3d-calculator/index.html` | 3D 디자인 웹 계산기 |
| `dashboards/dunwich-campaign/` | "던위치의 유산(도전 모드)" 캠페인 안내서 (`build_site.py`가 생성한 HTML + `assets/` 이미지) |

> **새 대시보드 추가 규칙**: `dashboards/<이름>/` 하위 폴더로 만들고, 루트 `index.html`(랜딩)과 `README.md`에도 카드를 추가해 목록을 맞춰 두세요.
> `dashboards/dunwich-campaign/`의 `.html`은 **생성물**입니다. 직접 수정하지 말고 빌드 파이프라인(아래)을 통해 다시 생성하세요.

---

## 2. 빌드 입력 / 소스 — `_src/` 폴더 (배포 안 됨 · 작업용)

> `_`로 시작해 GitHub Pages가 게시하지 않습니다. 사이트로 노출되지 않는 작업 파일은 여기에 둡니다.

**dunwich-campaign 빌드 파이프라인**

```
_src/notion_all.json  ─┐
_src/template.html     ├─►  python _src/build_site.py  ─►  dashboards/dunwich-campaign/*.html
_src/site.css          │
_src/site.js          ─┘
```

| 파일 | 역할 |
|------|------|
| `_src/build_site.py` | Notion 데이터 → HTML 생성기 (경로는 스크립트 위치 기준으로 자동 해석) |
| `_src/notion_all.json` (~1.1M) | Notion 원본 데이터(빌드 입력) |
| `_src/template.html`, `_src/site.css`, `_src/site.js` | 빌드용 템플릿/스타일/스크립트 |
| `_src/머신러닝_과제.ipynb` | `campaign-dashboard`의 원본 노트북 |

빌드: `python _src/build_site.py` (저장소 어디서 실행해도 됨 → `dashboards/dunwich-campaign/`에 출력)
