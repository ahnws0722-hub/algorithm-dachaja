# 알고리즘 다찾아

네이버 **공식 출처만** 근거로 정리한 네이버 블로그·검색 알고리즘 변경 타임라인 + "내 블로그에 적용할 일" 체크리스트 (GitHub Pages, 무료).

- 라이브: https://ahnws0722-hub.github.io/algorithm-dachaja/
- 데이터: `data.json` (화면 코드는 수정하지 않고 이 파일만 고치면 갱신됨)

## 주간 갱신 방법
1. 공식 출처 새 글 확인
   - 네이버 검색: https://rss.blog.naver.com/naver_search.xml
   - 서치어드바이저(웹마스터): https://blog.naver.com/naver_webmaster
   - 블로그팀: https://rss.blog.naver.com/blogpeople.xml
   - 보도자료: https://www.navercorp.com/media/pressReleases
2. 블로그·검색 노출과 관련 있는 글만 `data.json`의 `items` **맨 앞**(최신순)에 추가
   - 필수: `id`(고유, 예 `2026-11-12-주제`), `date`(YYYY-MM-DD, 공지 게시일), `title`, `category`(기존 값 중 하나), `impact`(높음/중간/낮음), `status`:"confirmed", `summary`(원문에 있는 내용만), `sources`([{name,url}]), `todos`(문자열 배열)
   - 기존 항목의 `id`와 `todos` 순서는 바꾸지 말 것 (체크 저장 키가 `id#번호`)
   - 공식 근거 없는 소문은 `unverified`에만 추가
3. `lastUpdated`를 갱신 날짜로 변경
4. 검사: `python3 tools/validate.py --urls` (필드·중복·정렬·URL 실제 열림 확인; 실패 시 커밋 금지)
5. 커밋·푸시: `git add data.json && git commit -m "주간 갱신 YYYY-MM-DD" && git push`
6. 1~2분 뒤 라이브 페이지에서 새 항목 확인
