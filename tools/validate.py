#!/usr/bin/env python3
"""data.json 검사: 필수 필드, id 중복, 날짜 형식, 최신순 정렬, (옵션 --urls) 출처 URL 200 확인.
사용: python3 tools/validate.py [--urls]"""
import json,re,sys,urllib.request
d=json.load(open("data.json",encoding="utf-8"))
err=[]
need=["id","date","title","category","impact","status","summary","sources","todos"]
ids=set()
for it in d["items"]:
    for k in need:
        if k not in it: err.append(f"{it.get('id')}: {k} 없음")
    if it["id"] in ids: err.append("id 중복 "+it["id"])
    ids.add(it["id"])
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}",it["date"]): err.append("날짜형식 "+it["id"])
    if it["status"]!="confirmed": err.append("items에는 confirmed만: "+it["id"])
    if not it["sources"]: err.append("출처 없음 "+it["id"])
    if it["impact"] not in ("높음","중간","낮음"): err.append("impact 값 "+it["id"])
dates=[i["date"] for i in d["items"]]
if dates!=sorted(dates,reverse=True): err.append("items가 최신순이 아님")
for u in d["unverified"]:
    if u["id"] in ids: err.append("id 중복 "+u["id"])
    ids.add(u["id"])
    if u.get("status")!="unverified": err.append("unverified status "+u["id"])
if not re.fullmatch(r"\d{4}-\d{2}-\d{2}",d["lastUpdated"]): err.append("lastUpdated 형식")
if "--urls" in sys.argv:
    urls=set()
    for it in d["items"]:
        for s in it["sources"]: urls.add(s["url"])
    for u in d["unverified"]:
        for s in u.get("related",[]): urls.add(s["url"])
    for url in sorted(urls):
        m=re.match(r"https://blog\.naver\.com/([^/]+)/(\d+)$",url)
        check=f"https://blog.naver.com/PostView.naver?blogId={m.group(1)}&logNo={m.group(2)}" if m else url
        try:
            r=urllib.request.urlopen(urllib.request.Request(check,headers={"User-Agent":"Mozilla/5.0"}),timeout=30)
            body=r.read().decode("utf-8","ignore")
            ok=r.status==200 and (not m or "se-main-container" in body)
            print(("OK  " if ok else "BAD ")+url)
            if not ok: err.append("URL 확인 실패 "+url)
        except Exception as e:
            print("ERR "+url,e); err.append("URL 오류 "+url)
print(f"확인됨 {len(d['items'])}개 / 미확인 {len(d['unverified'])}개")
if err:
    print("\n".join(err)); sys.exit(1)
print("검사 통과")
