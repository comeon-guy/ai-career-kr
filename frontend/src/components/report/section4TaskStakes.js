/**
 * 업무 문장 키워드로 스테이크 채널 추론 (Section4 폴백·스캔 불릿용).
 * @param {string} text
 */
export function inferTaskStakesChannel(text) {
  const s = String(text || "");
  if (/인력|배치|근무|교대|결원|근태|당직|인원을 배치|배치하여/.test(s)) return "staffing";
  if (/보도|언론|미디어킷|미디어|press|media kit|공보|대외\s*발표/.test(s)) return "media_comms";
  if (/디자인|브로셔|편집|홍보.*출판|그래픽|시각|레이아웃|출판물|brochure|layout|graphic/i.test(s)) return "creative_visual";
  if (/정책|규제|입법|예산.*편성|법령|규정.*제정|정부\s*기관/.test(s)) return "policy_org";
  if (/고객|협상|계약|영업|클라이언트|관계자|대행사/.test(s)) return "client_sales";
  if (/훈련|교육|연수|워크숍/.test(s)) return "training";
  if (/데이터|보고서|집계|분석|지표|대시보드|평가\s*지표/.test(s)) return "operations_data";
  if (/백업|복구|동기화|디렉터리|디렉토리|backup|restore|sync/i.test(s)) return "backup_ops";
  if (/코드|개발|프로그|웹\s*앱|API|테스트|디버|소프트웨어|script|code|software|CRUD|지원 코드/i.test(s)) return "software_dev";
  return "default";
}
