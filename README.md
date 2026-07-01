# 📊 데이터 분석 & 머신러닝 대시보드 모음

GitHub Pages를 통해 배포된 인터랙티브 대시보드 목록입니다.  
아래 링크를 클릭하면 바로 확인할 수 있습니다.

## 🏠 전체 보기 (랜딩 페이지)

**👉 [https://psr8989.github.io/Github/](https://psr8989.github.io/Github/)** — 모든 대시보드를 한 페이지에서 모아 봅니다.

---

## 🗂️ 대시보드 목록

### 0. 🗓️ 달력 할 일 (CalendarTask)

> 월간 달력 + 할 일 관리 — 브라우저 로컬 저장, 오프라인 동작, 휴대폰에 앱으로 설치(PWA) 가능

**👉 [https://psr8989.github.io/Github/dashboards/calendar-task/](https://psr8989.github.io/Github/dashboards/calendar-task/)**

| 항목 | 내용 |
|------|------|
| **달력** | 월간 보기, 이전/다음 달·오늘 이동, 날짜별 할 일 점(우선순위·완료) 표시 |
| **할 일** | 추가·완료 체크·삭제, 우선순위(높음/보통/낮음), 완료/우선순위 자동 정렬 |
| **저장** | 브라우저 localStorage (서버 불필요), JSON 내보내기/가져오기로 백업·기기 이전 |
| **앱** | PWA — 휴대폰 홈 화면에 설치, 오프라인에서도 실행 |
| **동기화** | 현재는 JSON 파일로 수동 이전. 실시간 기기 간 동기화는 추후 클라우드 연동 예정 |

---

### 1. 🌌 미래형 라이브 배경 & 날씨 대시보드

> 움직이는 네온 파티클 배경 위에 시계 · 이번 주 날씨 · 온도 · 자외선 지수를 표시하는 인터랙티브 바탕화면

**👉 [https://psr8989.github.io/Github/dashboards/futuristic-wallpaper/](https://psr8989.github.io/Github/dashboards/futuristic-wallpaper/)**

| 항목 | 내용 |
|------|------|
| **배경** | Canvas 파티클 네트워크 + 흐르는 원근 네온 그리드 (실시간 애니메이션) |
| **시계** | 실시간 시·분·초, 날짜·요일 표시 |
| **현재 날씨** | 기온 · 체감온도 · 습도 · 풍속 · 자외선 지수(색상 단계) |
| **주간 예보** | 7일간 날씨 아이콘 · 최고/최저 기온 · UV 지수 |
| **데이터** | Open-Meteo (API 키 불필요), 브라우저 위치 사용·거부 시 서울 기본값 |

---

### 2. 📊 캠페인 반응 예측 머신러닝 대시보드

> `_src/머신러닝_과제.ipynb` 실행 결과 기반 — 마케팅 캠페인 수락 여부 이진 분류

**👉 [https://psr8989.github.io/Github/dashboards/campaign-dashboard/](https://psr8989.github.io/Github/dashboards/campaign-dashboard/)**

| 항목 | 내용 |
|------|------|
| **데이터** | 훈련 1,344건 / 테스트 896건 / 원본 특성 27개 |
| **문제 유형** | 이진 분류 (캠페인 수락 여부 0/1) |
| **평가 지표** | ROC-AUC |
| **교차검증** | RepeatedStratifiedKFold (5-Fold × 3 Repeat = 15폴드) |
| **하이퍼파라미터** | Optuna TPE 30 Trials 자동 탐색 |
| **모델** | LGBM / XGBoost / CatBoost / 앙상블 블렌딩 |

**노트북 실제 결과:**
- LGBM 기본 OOF AUC: **0.90649** → Optuna 튜닝 후: **0.90951**
- 앙상블 최종 OOF AUC: **0.91250** (최고 성능)

---

### 3. 🧮 3D 계산기

> 입체적인 3D 버튼 디자인의 웹 계산기 — 사칙연산·퍼센트·부호 전환 및 키보드 입력 지원

**👉 [https://psr8989.github.io/Github/dashboards/3d-calculator/](https://psr8989.github.io/Github/dashboards/3d-calculator/)**

| 항목 | 내용 |
|------|------|
| **기능** | 사칙연산(+ − × ÷), 부호 전환(±), 퍼센트(%), 전체 지우기(AC) |
| **디자인** | 입체 3D 버튼, 누름 애니메이션, LCD 스타일 디스플레이 |
| **편의** | 천 단위 콤마 자동 표시, 연산 기록, 0 나누기 오류 처리 |
| **키보드** | 숫자·연산자, Enter(=), Esc(AC), Backspace(삭제) 지원 |

---

### 4. 🕯️ 던위치의 유산(도전 모드) 캠페인 안내서

> 아컴호러 카드게임 캠페인 안내서 — Notion 원문을 읽기 좋게 재구성한 정적 사이트

**👉 [https://psr8989.github.io/Github/dashboards/dunwich-campaign/](https://psr8989.github.io/Github/dashboards/dunwich-campaign/)**

| 항목 | 내용 |
|------|------|
| **구성** | 서막 · 시나리오 I-A ~ VII · 막간 I·II · 디자이너 후기 · FAQ · 업적 목록 (16개 챕터) |
| **디자인** | 다크 + 골드 러브크래프트풍 테마, 명조 제목 / 고딕 본문, 가독성 중심 타이포 |
| **탐색** | 고정 사이드바 목차, 스크롤 위치 자동 하이라이트(scrollspy), 맨 위로 버튼 |
| **반응형** | 모바일 햄버거 메뉴, 이미지 로컬 번들로 외부 의존 없는 자체 완결형 |

---

## 📁 폴더 구조

```
Github/
├── index.html                  ← 랜딩 페이지 (대시보드 포털)
├── dashboards/
│   ├── calendar-task/
│   │   └── index.html          ← 달력 할 일 앱 (PWA, manifest.json·sw.js·icon.svg 포함)
│   ├── futuristic-wallpaper/
│   │   └── index.html          ← 미래형 라이브 배경 & 날씨 대시보드
│   ├── campaign-dashboard/
│   │   └── index.html          ← 캠페인 반응 예측 ML 대시보드 (노트북 기반)
│   ├── 3d-calculator/
│   │   └── index.html          ← 3D 디자인 웹 계산기
│   └── dunwich-campaign/
│       ├── index.html          ← 던위치의 유산 캠페인 안내서 (재디자인)
│       └── assets/             ← 안내서 이미지 번들
├── _src/                       ← 빌드 입력·소스 (게시 안 됨): build_site.py, notion_all.json, 노트북 등
└── README.md                   ← 이 파일 (대시보드 안내)
```

---

## ⚠️ 면책 고지

주식 관련 자료는 투자 참고용이며, 투자 손실에 대한 책임은 투자자 본인에게 있습니다.  
데이터 출처: KRX, Bloomberg, 각 증권사 리포트 참조 | 기준일: 2025.05.23
