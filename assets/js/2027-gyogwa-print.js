(function () {
  "use strict";

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function number(value) {
    return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "-";
  }

  function buildPrintReport() {
    let report = document.getElementById("printReport");
    if (!report) {
      report = document.createElement("section");
      report.id = "printReport";
      document.body.appendChild(report);
    }

    const rows = Array.isArray(calcResults) ? calcResults : [];
    const generatedAt = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date());
    const summary = rows.length
      ? `선택 대학 ${rows.length}개 · 입력 과목 ${subjects.filter((item) => item.type === "common" && hasValidRank(item)).length}개(석차등급 보유 과목 기준)`
      : "계산 결과가 없습니다. 인쇄 전에 대학별 환산 등급을 계산해 주세요.";
    const resultRows = rows.length
      ? rows.map((item, index) => `<tr>
          <td>${index + 1}</td>
          <td><strong>${esc(item.uni?.name)}</strong></td>
          <td>${esc(item.effectiveUni?._variantLabel || item.uni?.note || "대학별 반영 기준")}</td>
          <td class="grade">${item.convertedGrade === null ? "산출 불가" : `${number(item.convertedGrade)}등급`}</td>
          <td>${item.gradeDiff === null ? "-" : `${item.gradeDiff > 0 ? "+" : ""}${number(item.gradeDiff)}등급`}</td>
          <td>${item.score === null ? "-" : `${number(item.score)} / ${esc(item.maxScore)}점`}</td>
        </tr>`).join("")
      : `<tr><td colspan="6" class="empty">${summary}</td></tr>`;

    report.innerHTML = `
      <style>
        #printReport { display:none; }
        @media print {
          @page { size:A4; margin:13mm 11mm; }
          body { background:#fff !important; color:#122033 !important; }
          body > *:not(#printReport) { display:none !important; }
          #printReport { display:block !important; font-family:"Noto Sans KR", Arial, sans-serif; color:#122033; }
          #printReport * { box-sizing:border-box; }
          #printReport .print-head { border-top:5px solid #153c6b; border-bottom:1px solid #b7c8d9; padding:14px 0 12px; margin-bottom:14px; }
          #printReport .brand { color:#153c6b; font-size:11px; font-weight:800; letter-spacing:.08em; }
          #printReport h1 { margin:4px 0; font-size:22px; letter-spacing:-.05em; }
          #printReport .meta, #printReport .notice { font-size:10px; color:#536579; line-height:1.55; }
          #printReport .summary { background:#eef4fa; border:1px solid #cbd9e6; padding:10px 12px; margin:12px 0; font-size:11px; font-weight:700; }
          #printReport table { width:100%; border-collapse:collapse; font-size:9.2px; table-layout:fixed; }
          #printReport th { background:#173f70; color:#fff; padding:7px 5px; border:1px solid #173f70; text-align:center; }
          #printReport td { padding:7px 5px; border:1px solid #c4d0dc; vertical-align:top; line-height:1.35; word-break:keep-all; }
          #printReport tr:nth-child(even) td { background:#f6f9fc; }
          #printReport th:nth-child(1), #printReport td:nth-child(1) { width:6%; text-align:center; }
          #printReport th:nth-child(2), #printReport td:nth-child(2) { width:16%; }
          #printReport th:nth-child(3), #printReport td:nth-child(3) { width:39%; }
          #printReport th:nth-child(4), #printReport td:nth-child(4) { width:14%; text-align:center; }
          #printReport th:nth-child(5), #printReport td:nth-child(5) { width:11%; text-align:center; }
          #printReport th:nth-child(6), #printReport td:nth-child(6) { width:14%; text-align:right; }
          #printReport .grade { font-weight:800; color:#153c6b; }
          #printReport tr { break-inside:avoid; }
          #printReport .foot { border-top:1px solid #b7c8d9; margin-top:13px; padding-top:8px; font-size:8.5px; color:#637386; line-height:1.5; }
          #printReport .empty { text-align:center; padding:22px; }
        }
      </style>
      <header class="print-head">
        <div class="brand">GAONGIL EDU · ADMISSIONS STRATEGY INSTITUTE</div>
        <h1>2027학년도 대학별 교과 환산내신 결과표</h1>
        <div class="meta">출력 일시 ${esc(generatedAt)} · 가온길 에듀</div>
      </header>
      <div class="summary">${esc(summary)}</div>
      <table>
        <thead><tr><th>순위</th><th>대학명</th><th>2027 반영 기준</th><th>환산 비교등급</th><th>기본등급 대비</th><th>비교용 환산지수</th></tr></thead>
        <tbody>${resultRows}</tbody>
      </table>
      <footer class="foot">※ 이 출력물은 선택한 대학의 공개 반영 기준에 따른 비교용 결과입니다. 모집단위·전형별 세부 기준은 대학 모집요강을 최종 확인하세요.<br>※ 과목별 체크 및 개별 과목 산출 내역은 출력에서 제외했습니다.</footer>`;
  }

  window.addEventListener("beforeprint", buildPrintReport);
  window.printResultsReport = function () {
    buildPrintReport();
    window.print();
  };
})();
