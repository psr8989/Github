"""Reproducible price-only scenario model. Python standard library only."""
import calendar
import csv
import io
import datetime as dt
import json
import math
from pathlib import Path
import statistics as st
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dashboards/stock-outlook'
ASOF = dt.date(2026, 9, 11)
STOCKS = [('005380.KS', '현대차', '#66dbc5'), ('000660.KS', 'SK하이닉스', '#a899ff'), ('005930.KS', '삼성전자', '#70b7ff')]

def fit(rows):
    returns = [math.log(b['adjusted'] / a['adjusted']) for a, b in zip(rows[-127:-1], rows[-126:])]
    assert len(returns) == 126
    raw = st.mean(returns) * 252
    return max(-0.35, min(0.35, raw * 0.25)), st.stdev(returns) * math.sqrt(252), raw

def run():
    OUT.mkdir(parents=True, exist_ok=True)
    stocks = []
    for symbol, name, color in STOCKS:
        url = f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=2y&interval=1d'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        result = json.load(urllib.request.urlopen(req, timeout=45))['chart']['result'][0]
        quote = result['indicators']['quote'][0]['close']
        adj = result['indicators']['adjclose'][0]['adjclose']
        rows = []
        for timestamp, close, adjusted in zip(result['timestamp'], quote, adj):
            date = dt.datetime.fromtimestamp(timestamp, dt.timezone(dt.timedelta(hours=9))).date()
            if date <= ASOF and close and adjusted:
                rows.append(dict(date=str(date), close=close, adjusted=adjusted))
        assert len(rows) >= 300 and rows[-1]['date'] == str(ASOF), f'{symbol}: incomplete history'
        assert len({r['date'] for r in rows}) == len(rows)
        mu, sigma, raw = fit(rows)
        last = rows[-1]['close']
        forecasts = [dict(date=str(ASOF), base=last, low=last, high=last)]
        for month in range(9, 13):
            date = dt.date(2026, month, calendar.monthrange(2026, month)[1])
            t = (date-ASOF).days/365.25
            forecasts.append(dict(date=str(date), base=last*math.exp(mu*t), low=last*math.exp(mu*t-1.281551566*sigma*math.sqrt(t)), high=last*math.exp(mu*t+1.281551566*sigma*math.sqrt(t))))
        tests = []
        for end in range(len(rows)-126-1, len(rows)-21, 21):
            train = rows[:end+1]
            m, s, _ = fit(train)
            # Dividend-adjusted returns expressed in origin-day price units.
            actual = rows[end]['close'] * rows[end+21]['adjusted']/rows[end]['adjusted']
            predicted = rows[end]['close']*math.exp(m*21/252)
            lo = predicted*math.exp(-1.281551566*s*math.sqrt(21/252))
            hi = predicted*math.exp(1.281551566*s*math.sqrt(21/252))
            tests.append(dict(origin=rows[end]['date'], target=rows[end+21]['date'], actual=actual, predicted=predicted, ape=abs(predicted/actual-1)*100, naiveApe=abs(rows[end]['close']/actual-1)*100, covered=lo<=actual<=hi))
        peak = 0
        drawdown = 0
        for row in rows[-252:]:
            peak = max(peak, row['adjusted'])
            drawdown = min(drawdown, row['adjusted']/peak-1)
        stocks.append(dict(symbol=symbol, name=name, color=color, source=url, history=rows, last=last, annualDrift=mu, rawDrift=raw, volatility=sigma, drawdown=drawdown, return6m=rows[-1]['adjusted']/rows[-127]['adjusted']-1, forecasts=forecasts, backtest=dict(folds=tests, mape=st.mean(x['ape'] for x in tests), naiveMape=st.mean(x['naiveApe'] for x in tests), coverage=st.mean(x['covered'] for x in tests))))
    data = dict(asOf=str(ASOF), generatedAt=dt.datetime.now(dt.timezone.utc).isoformat(), target='2026-12-31', model='Damped log-return / conditional lognormal scenarios v1', stocks=stocks)
    text = json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False)
    (OUT/'data.json').write_text(text, encoding='utf-8')
    (OUT/'data.js').write_text('window.STOCK_DATA = '+text+';\n', encoding='utf-8')
    buffer = io.StringIO(newline='')
    writer = csv.writer(buffer)
    writer.writerow(['종목', '날짜', '하락_P10_원', '기준_P50_원', '상승_P90_원', '기준종가_원', '기준수익률_pct', '분석기준일'])
    for stock in stocks:
        for f in stock['forecasts'][1:]:
            writer.writerow([stock['name'], f['date'], *[int(f[k]/100+0.5)*100 for k in ('low', 'base', 'high')], stock['last'], round((f['base']/stock['last']-1)*100, 2), str(ASOF)])
    (OUT/'forecast.csv').write_text(buffer.getvalue(), encoding='utf-8-sig', newline='')
    print(json.dumps([dict(name=s['name'], last=s['last'], december=s['forecasts'][-1], mape=s['backtest']['mape'], naive=s['backtest']['naiveMape']) for s in stocks], ensure_ascii=False, indent=2))

if __name__ == '__main__':
    run()
