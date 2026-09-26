# Channel Dashboard — 디자인 가이드

이 폴더의 대시보드(`index.html` · `style.css` · `app.js`)와 **같은 디자인의 대시보드를 다른 환경에서 다시 만들기 위한 명세서**입니다.
이 문서만 읽어도 같은 모양을 재현할 수 있도록 디자인 값, 컴포넌트 규칙, 전체 CSS, 차트 코드를 모두 담았습니다.

- 라이브 페이지: https://psr8989.github.io/Github/dashboards/channel-dashboard/
  (엑셀 파일을 선택해야 화면이 채워집니다. 데이터 없이 열면 파일 선택 창만 보입니다.)
- 데이터 소스는 무엇이든 괜찮습니다(엑셀, CSV, JSON, API). 이 문서가 다루는 것은 **디자인과 화면 동작**입니다.

> **AI에게 요청할 때 예시**
> "이 README의 디자인 가이드대로 대시보드를 만들어 줘. 디자인 토큰, 컴포넌트 규칙, 부록의 CSS와 차트 코드를 그대로 따르고, 데이터는 [우리 데이터 소스]에서 읽어 줘."

---

## 1. 화면 구성

위에서 아래로 네 영역이 한 화면에 이어집니다. 모든 영역은 반투명 유리 느낌의 둥근 카드(`.panel`)입니다.

```
┌──────────────────────────────────────────────────────────────┐
│                                                  [↺] [⇪]     │ ← 오른쪽 위 아이콘 버튼 (필터 초기화, 파일 열기)
│        CHANNEL  [ Seller | Vis | Output | ETC | Rate | RAW ]  │ ← 가운데 정렬, 한 덩어리 탭
│  ──────────────────────────────────────────────────────────  │
│  FILTER  Period_Index (Week)(Month)(quarter)                 │ ← 가운데 정렬, 한 줄
│          Period [전체        ▾]   Cate0* (전체)(A)(B)(C)     │
└──────────────────────────────────────────────────────────────┘
┌ 데이터 테이블 (Seller) ──────────────────────────────────────┐
│ PERIOD            202601   202602   202603 ...               │ ← 가공 시트는 "행=지표, 열=기간" 레이아웃
│ Orderable Sellers 12,340   12,610   12,980                   │
│ Active Seller      5,120    5,090    5,470                   │
└──────────────────────────────────────────────────────────────┘
┌ 그래프 (Seller) ─────────────────────────────────────────────┐
│ ┌ Orderable Sellers ──────┐ ┌ Active Seller ─────────┐       │ ← 지표별 카드, 2열 그리드(좁으면 1열)
│ │  12,340 12,610 12,980   │ │  5,120  5,090  5,470   │       │ ← 모든 막대 위에 값 표시
│ │   ▇▇     ▇▇     ▇▇      │ │   ▇▇     ▇▇     ▇▇     │       │
│ └─────────────────────────┘ └────────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

- 페이지 제목이나 "데이터 소스: …" 같은 머리글은 **두지 않습니다**. 첫 화면은 바로 컨트롤 카드부터 시작합니다.
- "시트 ○○ | ○행 · ○개 열 | 값 기준 …" 같은 상태 표시 줄도 **두지 않습니다**. 계산 불가처럼 경고가 있을 때만 노란 알림을 띄웁니다.
- 표 전용 채널(RAW Data)에서는 그래프 카드를 **통째로 숨깁니다**. "그래프가 없습니다" 같은 빈 안내 문구도 넣지 않습니다.
- 표의 보기 방식 전환 버튼("정리된 표 / 시트 레이아웃")은 **두지 않습니다**.

---

## 2. 디자인 토큰

**다크 톤 전용**입니다. 라이트 모드는 만들지 않습니다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | `#090b10` | 페이지 배경 (그 위에 은은한 빛 2개를 얹음) |
| `--surface` | `rgba(255,255,255,.035)` | 카드 배경 (반투명 + `backdrop-filter: blur(14px)`) |
| `--surface-solid` | `#12151d` | 드롭다운 메뉴, 모달 등 불투명해야 하는 면 |
| `--surface-2` | `rgba(255,255,255,.06)` | 칩, 드롭다운 버튼, 아이콘 버튼 배경 |
| `--border` | `rgba(255,255,255,.08)` | 기본 테두리 |
| `--border-strong` | `rgba(255,255,255,.16)` | 호버 테두리, 메뉴 테두리 |
| `--text` | `#eef1f7` | 본문, 값 |
| `--text-2` | `#a7aec0` | 보조 텍스트, 필터 이름 |
| `--muted` | `#6b7386` | 축 눈금, 표 헤더, 라벨 |
| `--grid` | `rgba(255,255,255,.06)` | 격자선, 표 행 구분선 |
| `--accent` | `#6b8cff` | 포커스, 체크박스 |
| `--accent-2` | `#38d6f0` | 정렬 화살표, `*` 표시 |
| `--accent-grad` | `linear-gradient(135deg, #6366f1 0%, #3b82f6 55%, #22d3ee 100%)` | **선택 상태**(탭, 칩의 '전체', 버튼) |
| `--accent-soft` | `rgba(107,140,255,.16)` | 선택된 칩/드롭다운 배경, 배지 |
| `--hover-row` | `rgba(107,140,255,.07)` | 표 행, 메뉴 항목 호버 |
| `--radius` | `16px` | 큰 카드 모서리 |

**페이지 배경:** 짙은 남색 위에 왼쪽 위 보라 빛, 오른쪽 위 청록 빛을 둡니다.

```css
background:
  radial-gradient(900px 500px at 8% -10%, rgba(99,102,241,.18), transparent 60%),
  radial-gradient(800px 480px at 100% 0%, rgba(34,211,238,.10), transparent 60%),
  #090b10;
background-attachment: fixed;
```

**모서리 반경:** 큰 카드 16px, 그래프 카드와 표 테두리 12~14px, 드롭다운 버튼 10px, 아이콘 버튼 9px, 탭 9px, 칩은 알약형(999px), 막대 끝 4px.

**글꼴:** Pretendard Variable. 불러오지 못하면 맑은 고딕으로 대체됩니다.
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
```
본문 14px, `line-height: 1.5`. 숫자에는 `font-variant-numeric: tabular-nums`를 적용해 자릿수를 정렬합니다.

---

## 3. 컴포넌트 규칙

### 3-1. 카드(`.panel`)
- 반투명 배경, 1px 테두리, 반경 16px, 안쪽 여백 18px 20px.
- 그림자: `0 1px 0 rgba(255,255,255,.04) inset, 0 10px 30px rgba(0,0,0,.25)`.
- 카드 제목은 16px 굵게, 옆에 현재 채널명을 **배지**로 붙입니다(예: `데이터 테이블 [Seller]`).
- 컨트롤 카드에는 `z-index: 5`를 줍니다. 드롭다운 메뉴가 아래 카드에 가려지지 않게 하기 위해서입니다.

### 3-2. Channel 탭
- 탭 전체를 어두운 트레이(`rgba(0,0,0,.35)`, 반경 12px, 안쪽 여백 4px)로 감싼 **세그먼트형**입니다.
- 선택되지 않은 탭: 투명 배경, `--text-2` 색. 호버하면 흰 글자에 옅은 배경.
- 선택된 탭: `--accent-grad` 배경, 흰 글자, `box-shadow: 0 4px 14px rgba(59,130,246,.35)`.
- 탭 아래에 "시트: ○○" 같은 부제는 달지 않고, 필요하면 `title` 툴팁으로만 보여줍니다.
- 왼쪽에 작은 대문자 라벨 `CHANNEL`(11px, 자간 0.12em, `--muted`)을 둡니다.

### 3-3. 필터 줄
- 가운데 정렬, 필터 그룹 사이 간격 26px. 왼쪽에 작은 대문자 라벨 `FILTER`를 둡니다.
- 각 그룹은 `이름` + `컨트롤` 형태입니다. 이름은 12.5px, `--text-2`.
- 필터마다 컨트롤 종류를 다르게 씁니다.

| 필터 | 컨트롤 | 규칙 |
|---|---|---|
| **Period_Index** | 칩, **단일 선택** | '전체' 없음. 항상 하나만 선택되고 기본값은 **Month**. 칩은 항상 누를 수 있음. 바꾸면 새 기준에 없는 다른 필터 선택값(예: Week에만 있는 기간)을 자동으로 해제 |
| **Period** | **체크박스 드롭다운**, 다중 선택 | 버튼에는 `전체` / `202603` / `3개 선택`처럼 표시. 메뉴 맨 위에 '전체', 현재 조건에 없는 값은 흐리게 비활성화. 체크해도 메뉴가 닫히지 않고, 바깥 클릭이나 Esc로 닫힘 |
| **Cate0** | 칩, 다중 선택 | 맨 앞 '전체' 칩(선택 시 그라데이션). 값 칩은 켜면 `--accent-soft` 배경과 파란 테두리 |

- **칩:** 알약형, 안쪽 여백 4px 12px, 12.5px 글자. 기본은 `--surface-2` 배경. 선택되면 `--accent-soft` 배경, `rgba(107,140,255,.55)` 테두리, 흰 굵은 글자. 비활성은 `opacity .3`.
- **드롭다운 버튼:** 최소 폭 128px, 반경 10px, 오른쪽에 `▾`. 값이 선택되면 칩의 선택 상태와 같은 색.
- **드롭다운 메뉴:** 버튼 아래 가운데 정렬, `--surface-solid` 배경, 반경 12px, 최대 높이 300px에 스크롤, 그림자 `0 18px 40px rgba(0,0,0,.55)`.
- 설명이 필요한 필터는 이름 뒤에 청록 `*`를 붙이고, 설명은 `title` 툴팁에만 넣습니다. 필터 아래에 긴 안내 문구를 두지 않습니다.
- 필터 사이의 논리: 같은 필터 안의 여러 값은 **OR**, 서로 다른 필터끼리는 **AND**입니다.

### 3-4. 아이콘 버튼(카드 오른쪽 위)
- 30×30px, 반경 9px, `--surface-2` 배경, 1px 테두리, 15px 선 아이콘(stroke 2).
- 필터 초기화(↺)와 파일 열기(⇪) 두 개. 텍스트 버튼을 쓰지 않아야 가운데 정렬이 깨지지 않습니다.
- 초기화하면 기본값(Period_Index = Month, 나머지는 전체)으로 돌아갑니다.

### 3-5. 데이터 테이블
- 테두리 1px, 반경 12px, 배경 `rgba(0,0,0,.18)`, 최대 높이 440px에 스크롤, 헤더 고정.
- 헤더: 배경 `#141824`, 11.5px **대문자**, 자간 0.05em, `--muted` 색.
- 셀: 안쪽 여백 10px 14px, 행 구분선 `--grid`, 숫자는 오른쪽 정렬, 빈 값은 `–`(흐린 색).
- 행 호버 시 `--hover-row` 배경.
- **가공 지표 테이블은 시트 레이아웃**입니다. 행은 지표, 열은 기간이고, 첫 열(지표명)은 가로 스크롤 시 고정합니다. 단일 선택 필터(Period_Index)는 이미 하나로 정해져 있으므로 행으로 보여주지 않습니다.
- 원본 데이터(RAW) 테이블은 일반 표입니다. 열 제목을 누르면 오름차순 → 내림차순 → 해제 순으로 정렬됩니다.
- 숫자 표기: 정수는 `12,340`, 소수는 소수점 둘째 자리까지 `28,526.08`.

### 3-6. 그래프 카드
- 지표 하나당 카드 하나. `grid-template-columns: repeat(auto-fit, minmax(min(100%, 560px), 1fr))`이라 넓으면 2열, 좁으면 1열입니다.
- 카드: 반경 14px, 1px 테두리, 위에서 아래로 옅어지는 배경 `linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01))`.
- 제목(15px 굵게) 아래 부제는 **필터로 값이 재계산됐을 때만** `Cate0: Softline`처럼 짧게 표시합니다. 평소에는 부제 없이 10px 여백만 둡니다.
- 그래프 한 개에는 축이 하나뿐입니다. 이중 축은 쓰지 않습니다.

### 3-7. 툴팁
- 마우스를 따라다니고 화면 밖으로 나가면 반대편으로 뒤집습니다.
- 배경 `rgba(18,21,29,.92)` + blur, 1px `--border-strong`, 반경 10px.
- 내용은 세 줄입니다: `Period_Index Month · Period 202603` / 지표명 / **값(전체 숫자, 16px 굵게)**.

---

## 4. 막대그래프 규칙

| 항목 | 규칙 |
|---|---|
| 막대 색 | 세로 그라데이션 `#7aa2ff` → `#4f6bff` (SVG `linearGradient id="barGrad"`, 부록 A 참고) |
| 막대 모양 | 값 쪽 모서리만 반경 4px로 둥글게, 기준선 쪽은 직각. 폭은 칸의 72%이고 최대 40px |
| 격자 | 점선 `stroke-dasharray: 3 4`, 색 `--grid`. 눈금은 약 4개로 깔끔한 값(1·2·5 배수) |
| 기준선 | 0 위치에 `rgba(255,255,255,.22)` 1px 선 |
| y축 눈금 | 축약 표기: `1.2만`, `45억` (`Intl.NumberFormat('ko-KR', {notation:'compact', maximumFractionDigits:1})`) |
| x축 라벨 | 기간 값. 겹치면 n개마다 하나씩만 표시 |
| **값 라벨** | **모든 막대에 표시**. 막대 폭에 들어가면 막대 위에 가로로, 들어가지 않으면(예: Week 18개) **세로로 세워** 막대 끝에서 위로 씀. 세로일 때는 위쪽 여백을 가장 긴 라벨 길이만큼 늘림 |
| 값 라벨 숫자 형식 | 10만 미만은 전체 숫자(`28,526`, 소수는 `29.94`). 10만 이상은 유효숫자 3자리 축약(`11.7억`, `46.7만`) |
| 호버 | 막대보다 넓은 칸 전체가 호버 영역. 호버한 막대 외에는 `opacity .3`, 호버한 막대에는 `drop-shadow(0 0 8px rgba(91,140,255,.6))` 빛 |
| 그룹 분리 | 합산 단위가 다른 그룹(Week/Month/quarter)이 함께 보이면 한 축에 섞지 않고 그룹마다 패널과 축을 나눔. 그룹이 하나면 그룹 라벨은 생략 |

---

## 5. 반응형 (640px 이하)
- 카드 안쪽 여백 14px.
- 컨트롤 카드는 위쪽 여백 48px(오른쪽 위 아이콘과 겹치지 않도록). `CHANNEL`/`FILTER` 라벨은 한 줄을 통째로 쓰고 가운데 정렬.
- 탭과 칩은 줄바꿈되고, 그래프는 1열, 표는 가로 스크롤.
- 페이지 좌우 여백 16px, 가로 스크롤이 생기지 않아야 합니다.

---

## 부록 A. HTML 골격

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>채널 데이터 대시보드</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="page">
  <!-- 1. Channel · 2. Filters -->
  <section class="panel controls">
    <div class="corner">
      <button type="button" id="resetFilters" class="icon-btn" title="필터 초기화" aria-label="필터 초기화">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/></svg>
      </button>
      <label class="icon-btn" for="fileInput" title="파일 열기" aria-label="파일 열기">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>
      </label>
      <input type="file" id="fileInput" hidden>
    </div>
    <div class="crow">
      <span class="clabel">Channel</span>
      <nav id="channelTabs" class="tabs" role="tablist" aria-label="Channel">
        <!-- <button class="tab" role="tab" aria-selected="true">Seller</button> ... -->
      </nav>
    </div>
    <div class="crow">
      <span class="clabel">Filter</span>
      <div id="filters" class="filters">
        <!-- 단일 선택 칩 -->
        <!-- <div class="fgroup"><span class="fname">Period_Index</span>
               <div class="chips"><button class="chip">Week</button><button class="chip on">Month</button>...</div></div> -->
        <!-- 체크박스 드롭다운 -->
        <!-- <div class="fgroup"><span class="fname">Period</span>
               <div class="dd"><button class="dd-btn" aria-expanded="false"><span>전체</span><span class="caret">▾</span></button>
                 <div class="dd-menu" hidden>
                   <label class="dd-item all"><input type="checkbox" checked> 전체</label>
                   <label class="dd-item"><input type="checkbox"> 202601</label>
                   <label class="dd-item dis"><input type="checkbox" disabled> 202606</label>
                 </div></div></div> -->
        <!-- 다중 선택 칩 -->
        <!-- <div class="fgroup"><span class="fname" title="설명">Cate0<sup>*</sup></span>
               <div class="chips"><button class="chip all on">전체</button><button class="chip">Softline</button>...</div></div> -->
      </div>
    </div>
  </section>

  <div id="context" class="context" aria-live="polite"></div> <!-- 경고가 있을 때만 채움 -->

  <!-- 3. Table -->
  <section class="panel">
    <div class="panel-head">
      <div class="panel-label">데이터 테이블 <span class="badge">Seller</span></div>
    </div>
    <div class="table-wrap"><!-- <table> --></div>
  </section>

  <!-- 4. Charts (표 전용 채널에서는 hidden) -->
  <section class="panel" id="chartSection">
    <div class="panel-head">
      <div class="panel-label">그래프 <span class="badge">Seller</span></div>
    </div>
    <div id="charts" class="charts">
      <!-- <div class="chart-card"><h3>지표명</h3><div class="sub-gap"></div>
             <div class="panels"><div class="cpanel" style="flex:5 1 0"><svg>…</svg></div></div></div> -->
    </div>
  </section>
</div>

<!-- 막대 그라데이션 (페이지에 한 번만) -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7aa2ff"/>
      <stop offset="100%" stop-color="#4f6bff"/>
    </linearGradient>
  </defs>
</svg>
<div id="tooltip" class="tooltip" role="status" hidden></div>
</body>
</html>
```

---

## 부록 B. 전체 CSS (`style.css`)

현재 대시보드에서 쓰는 스타일 전체입니다. 그대로 복사해 쓰면 같은 모양이 됩니다.

```css
:root {
  color-scheme: dark;
  --bg: #090b10;
  --surface: rgba(255, 255, 255, 0.035);
  --surface-solid: #12151d;
  --surface-2: rgba(255, 255, 255, 0.06);
  --border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  --text: #eef1f7;
  --text-2: #a7aec0;
  --muted: #6b7386;
  --grid: rgba(255, 255, 255, 0.06);
  --accent: #6b8cff;
  --accent-2: #38d6f0;
  --accent-grad: linear-gradient(135deg, #6366f1 0%, #3b82f6 55%, #22d3ee 100%);
  --accent-soft: rgba(107, 140, 255, 0.16);
  --series-1: #5b8cff;
  --hover-row: rgba(107, 140, 255, 0.07);
  --radius: 16px;
}

* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  min-height: 100vh;
  background:
    radial-gradient(900px 500px at 8% -10%, rgba(99, 102, 241, 0.18), transparent 60%),
    radial-gradient(800px 480px at 100% 0%, rgba(34, 211, 238, 0.10), transparent 60%),
    var(--bg);
  background-attachment: fixed;
  color: var(--text);
  font-family: "Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.page { max-width: 1400px; margin: 0 auto; padding: 24px 16px 56px; display: flex; flex-direction: column; gap: 16px; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px; border: none;
  background: var(--accent-grad); color: #fff; font: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.icon-btn {
  width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px; border: 1px solid var(--border); background: var(--surface-2);
  color: var(--text-2); cursor: pointer; padding: 0; transition: color .15s, border-color .15s, background .15s;
}
.icon-btn:hover { color: var(--text); border-color: var(--border-strong); background: rgba(255,255,255,.1); }
.icon-btn svg { width: 15px; height: 15px; }

/* Panels */
.panel {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  min-width: 0;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 10px 30px rgba(0,0,0,.25);
}
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.panel-label { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 700; letter-spacing: -0.01em; }
.panel-label .badge {
  font-size: 0.72rem; font-weight: 600; padding: 2px 9px; border-radius: 999px;
  background: var(--accent-soft); color: #b9c8ff; border: 1px solid rgba(107,140,255,.3);
}

/* Controls: Channel + Filters (centered) */
.controls { z-index: 5; padding: 16px 56px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.corner { position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; }
.crow { display: flex; align-items: center; justify-content: center; gap: 8px 12px; flex-wrap: wrap; width: 100%; }
.crow + .crow { border-top: 1px solid var(--grid); padding-top: 12px; }
.clabel { font-size: 0.68rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; }

.tabs {
  display: inline-flex; gap: 2px; flex-wrap: wrap; justify-content: center;
  padding: 4px; border-radius: 12px; background: rgba(0,0,0,.35); border: 1px solid var(--border);
}
.tab {
  padding: 6px 16px; border-radius: 9px; border: none; background: transparent;
  color: var(--text-2); font: inherit; font-size: 0.84rem; font-weight: 600; cursor: pointer;
  transition: color .15s, background .15s;
}
.tab:hover:not(:disabled) { color: var(--text); background: rgba(255,255,255,.06); }
.tab[aria-selected="true"] { background: var(--accent-grad); color: #fff; box-shadow: 0 4px 14px rgba(59,130,246,.35); }
.tab:disabled { opacity: .35; cursor: not-allowed; }

.filters { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px 26px; }
.fgroup { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
.fname { font-weight: 600; font-size: 0.78rem; color: var(--text-2); cursor: default; }
.fname sup { color: var(--accent-2); }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip {
  padding: 4px 12px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--surface-2); color: var(--text-2); font: inherit; font-size: 0.78rem; cursor: pointer;
  font-variant-numeric: tabular-nums; transition: color .15s, border-color .15s, background .15s;
}
.chip:hover:not(:disabled) { color: var(--text); border-color: var(--border-strong); }
.chip.on { background: var(--accent-soft); border-color: rgba(107,140,255,.55); color: #fff; font-weight: 600; }
.chip.all.on { background: var(--accent-grad); border-color: transparent; }
.chip:disabled { opacity: .3; cursor: not-allowed; }

/* Dropdown (multi-select) */
.dd { position: relative; }
.dd-btn {
  display: inline-flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 128px;
  padding: 4px 10px 4px 12px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--surface-2); color: var(--text); font: inherit; font-size: 0.78rem; cursor: pointer;
  font-variant-numeric: tabular-nums; transition: border-color .15s;
}
.dd-btn:hover:not(:disabled), .dd-btn[aria-expanded="true"] { border-color: rgba(107,140,255,.6); }
.dd-btn.on { background: var(--accent-soft); border-color: rgba(107,140,255,.55); font-weight: 600; }
.dd-btn:disabled { opacity: .3; cursor: not-allowed; }
.dd-btn .caret { color: var(--muted); font-size: 0.7rem; }
.dd-menu {
  position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%); z-index: 30;
  min-width: 170px; max-height: 300px; overflow: auto;
  background: var(--surface-solid); border: 1px solid var(--border-strong); border-radius: 12px; padding: 6px;
  box-shadow: 0 18px 40px rgba(0,0,0,.55);
}
.dd-menu[hidden] { display: none; }
.dd-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; color: var(--text); cursor: pointer; font-variant-numeric: tabular-nums; }
.dd-item:hover { background: var(--hover-row); }
.dd-item.all { border-bottom: 1px solid var(--grid); border-radius: 8px 8px 0 0; margin-bottom: 4px; font-weight: 600; }
.dd-item.dis { opacity: .35; cursor: not-allowed; }
.dd-item input { accent-color: var(--accent); margin: 0; }

.context:empty { display: none; }
.context { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; font-size: 0.8rem; }
.context .warn { color: #ffd58a; background: rgba(250,178,25,.08); border: 1px solid rgba(250,178,25,.25); border-radius: 8px; padding: 4px 10px; }

/* Table */
.table-wrap { max-height: 440px; overflow: auto; border: 1px solid var(--border); border-radius: 12px; background: rgba(0,0,0,.18); }
.table-wrap::-webkit-scrollbar { width: 10px; height: 10px; }
.table-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
table { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 0.83rem; font-variant-numeric: tabular-nums; }
th, td { padding: 10px 14px; border-bottom: 1px solid var(--grid); white-space: nowrap; text-align: left; }
th {
  position: sticky; top: 0; z-index: 1; background: #141824; color: var(--muted);
  font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  cursor: pointer; user-select: none;
}
th:hover { color: var(--text); }
th .arrow { color: var(--accent-2); margin-left: 4px; }
td { color: var(--text); }
td.num, th.num { text-align: right; }
td.dim { font-weight: 600; }
td.null { color: var(--muted); }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: var(--hover-row); }
th.rowhead, td.rowhead { position: sticky; left: 0; background: #10131b; z-index: 1; font-weight: 600; }
th.rowhead { background: #141824; z-index: 2; }
tr.hdr td { background: rgba(255,255,255,.03); color: var(--text-2); font-weight: 600; }
.empty { padding: 36px; text-align: center; color: var(--muted); }

/* Charts */
.charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 560px), 1fr)); gap: 14px; }
.chart-card {
  border: 1px solid var(--border); border-radius: 14px; padding: 16px 16px 10px; min-width: 0;
  background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01));
}
.chart-card h3 { margin: 0; font-size: 0.95rem; font-weight: 700; letter-spacing: -0.01em; }
.chart-card .sub { font-size: 0.74rem; color: var(--muted); margin: 3px 0 12px; }
.chart-card .sub-gap { height: 10px; }
.panels { display: flex; flex-wrap: wrap; gap: 6px 14px; }
.cpanel { min-width: 130px; }
.cpanel .ptitle { display: inline-block; font-size: 0.7rem; font-weight: 600; color: var(--text-2); padding: 1px 8px; margin-left: 4px; border-radius: 6px; background: var(--surface-2); }
.cpanel svg { display: block; width: 100%; height: auto; overflow: visible; }
.axis text { fill: var(--muted); font-size: 10.5px; font-variant-numeric: tabular-nums; }
.gridline { stroke: var(--grid); stroke-width: 1; stroke-dasharray: 3 4; }
.baseline { stroke: rgba(255,255,255,.22); stroke-width: 1; }
.bar { fill: url(#barGrad); transition: opacity .15s, filter .15s; }
.dimmed .bar { opacity: .3; }
.dimmed .bar.hot { opacity: 1; filter: drop-shadow(0 0 8px rgba(91,140,255,.6)); }
.vlabel { fill: var(--text); font-size: 10.5px; font-weight: 700; font-variant-numeric: tabular-nums; }
.hit { fill: transparent; cursor: crosshair; }

.tooltip {
  position: fixed; z-index: 50; pointer-events: none;
  background: rgba(18, 21, 29, 0.92); color: var(--text); border: 1px solid var(--border-strong);
  border-radius: 10px; padding: 8px 12px; font-size: 0.8rem;
  box-shadow: 0 12px 30px rgba(0,0,0,.5); backdrop-filter: blur(8px);
  font-variant-numeric: tabular-nums; max-width: 280px;
}
.tooltip .tt-k { color: var(--text-2); font-size: 0.72rem; }
.tooltip .tt-v { font-weight: 700; font-size: 1rem; margin-top: 2px; }

/* 파일 선택 모달 (데이터를 파일로 받을 때만 필요) */
.dropzone { position: fixed; inset: 0; background: rgba(4,6,10,.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 40; }
.dropzone[hidden] { display: none; }
.dz-box { background: var(--surface-solid); border: 1px dashed rgba(107,140,255,.55); border-radius: 18px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,.5); }
.dz-box h2 { margin: 0 0 8px; font-size: 1.15rem; }
.dz-box p { color: var(--text-2); font-size: 0.88rem; }
.dz-err { color: #ff8a8a; font-size: 0.8rem; }
code { background: var(--surface-2); padding: 1px 6px; border-radius: 5px; font-size: 0.85em; }

@media (max-width: 640px) {
  .panel { padding: 14px; }
  .panel.controls { padding: 48px 12px 14px; }
  .clabel { width: 100%; text-align: center; }
}
```

---

## 부록 C. 막대그래프 코드 (라이브러리 없이 SVG로 그림)

차트 라이브러리를 쓰지 않고 SVG로 직접 그립니다. `drawPanel(div, panel, metric)`에 넘기는 `panel`의 모양은 다음과 같습니다.
`{ group: 'Month', points: [{ label: '202601', value: 12340, keys: { Period_Index: 'Month', Period: '202601' } }, ...] }`

```js
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── 숫자 형식 ──
const nfInt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const nfDec = new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nfCompact = new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 });
const nfSig3 = new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumSignificantDigits: 3 });

// 표·툴팁: 전체 숫자
function fmtFull(v) {
  if (v === null || v === undefined || !isFinite(v)) return '–';
  return Number.isInteger(v) ? nfInt.format(v) : nfDec.format(v);
}
// y축 눈금: 축약
function fmtCompact(v) {
  if (v === null || !isFinite(v)) return '–';
  if (Math.abs(v) < 1000) return Number.isInteger(v) ? String(v) : nfDec.format(v);
  return nfCompact.format(v);
}
// 막대 값 라벨: 10만 미만은 전체 숫자, 이상은 유효숫자 3자리 (예: 45.7억)
function fmtBar(v) {
  if (v === null || v === undefined || !isFinite(v)) return '';
  const a = Math.abs(v);
  if (a >= 100000) return nfSig3.format(v);
  if (Number.isInteger(v) || a >= 1000) return nfInt.format(v);
  return nfDec.format(v);
}

// ── 축 눈금 (1·2·5 배수로 약 count개) ──
function niceTicks(lo, hi, count) {
  if (lo === hi) { hi = lo === 0 ? 1 : lo + Math.abs(lo) * 0.1; }
  const span = hi - lo;
  const step0 = Math.pow(10, Math.floor(Math.log10(span / count)));
  const err = span / count / step0;
  const step = step0 * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
  const t0 = Math.floor(lo / step) * step, t1 = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let t = t0; t <= t1 + step / 2; t += step) ticks.push(Math.round(t / step) * step);
  return ticks;
}

const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// 값 쪽 모서리만 둥근 막대 경로 (y0 = 기준선, y1 = 값 끝)
function barPath(x, y0, y1, w, r) {
  const up = y1 < y0;
  const h = Math.abs(y0 - y1);
  r = Math.min(r, w / 2, h);
  if (h === 0) return '';
  if (up) return 'M' + x + ',' + y0 + 'V' + (y1 + r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 + r) + 'V' + y0 + 'Z';
  return 'M' + x + ',' + y0 + 'V' + (y1 - r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 - r) + 'V' + y0 + 'Z';
}

function drawPanel(div, panel, metric) {
  const W = Math.max(div.clientWidth || 300, 120);
  const pts = panel.points;
  // 모든 막대에 값 표시: 막대 폭에 들어가면 가로, 아니면 세로로 세움
  const labels = pts.map((p) => fmtBar(p.value));
  const textW = (s) => s.length * 6.1 + 2;
  const maxTW = Math.max(0, ...labels.map(textW));
  const band0 = (W - 52) / Math.max(pts.length, 1);
  const vertical = maxTW > band0 - 4;
  const m = { t: vertical ? maxTW + 10 : 20, r: 6, b: 26, l: 46 };
  const H = 190 + m.t;
  const vals = pts.map((p) => p.value).filter((v) => v !== null && isFinite(v));
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const ticks = niceTicks(lo, hi || (lo < 0 ? 0 : 1), 4);
  const y0d = ticks[0], y1d = ticks[ticks.length - 1];
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const y = (v) => m.t + ih - ((v - y0d) / (y1d - y0d || 1)) * ih;
  const band = iw / pts.length;
  const bw = Math.max(2, Math.min(band - 2, band * 0.72, 40));
  const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': metric + ' 막대그래프' });

  // 격자 + y축 눈금
  const gAxis = svgEl('g', { class: 'axis' }, svg);
  ticks.forEach((t) => {
    const ty = y(t);
    svgEl('line', { class: 'gridline', x1: m.l, x2: W - m.r, y1: ty, y2: ty }, gAxis);
    svgEl('text', { x: m.l - 6, y: ty + 3.5, 'text-anchor': 'end' }, gAxis).textContent = fmtCompact(t);
  });
  const base = y(0);
  svgEl('line', { class: 'baseline', x1: m.l, x2: W - m.r, y1: base, y2: base }, svg);

  // x 라벨은 겹치면 n개마다 하나씩
  const maxLen = Math.max(...pts.map((p) => String(p.label).length));
  const step = Math.max(1, Math.ceil((maxLen * 6.2 + 8) / band));
  const gBars = svgEl('g', {}, svg);
  const bars = [];
  pts.forEach((p, i) => {
    const cx = m.l + band * i + band / 2;
    let bar = null;
    if (p.value !== null && isFinite(p.value)) {
      bar = svgEl('path', { class: 'bar', d: barPath(cx - bw / 2, base, y(p.value), bw, 4) }, gBars);
    }
    bars.push(bar);
    if (i % step === 0 || (i === pts.length - 1 && pts.length <= 3)) {
      svgEl('text', { x: cx, y: H - m.b + 15, 'text-anchor': 'middle' }, gAxis).textContent = p.label;
    }
    if (p.value !== null && isFinite(p.value)) {
      const pos = p.value >= 0;
      const ve = y(p.value);
      const t = vertical
        ? svgEl('text', { class: 'vlabel', x: cx + 3.5, y: pos ? ve - 5 : ve + 5, 'text-anchor': pos ? 'start' : 'end',
            transform: 'rotate(-90 ' + (cx + 3.5) + ' ' + (pos ? ve - 5 : ve + 5) + ')' }, svg)
        : svgEl('text', { class: 'vlabel', x: cx, y: pos ? ve - 6 : ve + 13, 'text-anchor': 'middle' }, svg);
      t.textContent = labels[i];
    }
  });

  // 호버 영역 (막대보다 넓게) + 툴팁
  const gHit = svgEl('g', {}, svg);
  pts.forEach((p, i) => {
    const hit = svgEl('rect', { class: 'hit', x: m.l + band * i, y: m.t, width: band, height: ih }, gHit);
    hit.addEventListener('mousemove', (e) => {
      gBars.classList.add('dimmed');
      bars.forEach((b, j) => b && b.classList.toggle('hot', j === i));
      const keys = Object.entries(p.keys).map(([k, v]) => esc(k) + ' ' + esc(v)).join(' · ');
      showTip(e, '<div class="tt-k">' + keys + '</div><div class="tt-k">' + esc(metric) + '</div><div class="tt-v">' + fmtFull(p.value) + '</div>');
    });
    hit.addEventListener('mouseleave', () => { gBars.classList.remove('dimmed'); hideTip(); });
  });
  div.appendChild(svg);
}

function showTip(e, html) {
  const tip = document.getElementById('tooltip');
  tip.innerHTML = html;
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  let x = e.clientX + 14, y = e.clientY + 14;
  if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - 14;
  if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - 14;
  tip.style.left = Math.max(8, x) + 'px';
  tip.style.top = Math.max(8, y) + 'px';
}
function hideTip() { document.getElementById('tooltip').hidden = true; }
```

- 창 크기가 바뀌면 150ms 디바운스 후 그래프를 다시 그립니다(`drawPanel`은 컨테이너의 실제 폭을 기준으로 그림).
- 그래프 카드를 DOM에 먼저 넣고 레이아웃이 잡힌 뒤 `drawPanel`을 호출해야 폭이 맞게 나옵니다.

---

## 이 폴더의 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 화면 골격 (부록 A와 같음) |
| `style.css` | 전체 스타일 (부록 B와 같음) |
| `app.js` | 엑셀 읽기(SheetJS), 시트 구조 해석, 수식 재계산, 필터·표·그래프 렌더링 |

`app.js`의 데이터 처리 부분(엑셀 파싱, 수식 재계산)은 엑셀 전용입니다. 다른 데이터 소스를 쓸 때는 그 부분을 바꾸고, 화면 부분(`renderTabs`, `renderFilters`, `renderTable`, `renderCharts`, `drawPanel`)은 그대로 참고하면 됩니다.
