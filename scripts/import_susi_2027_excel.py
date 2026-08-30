#!/usr/bin/env python3
"""Build the browser-safe 2027 수시 모집정보 dataset from the supplied workbook.

The public page consumes a compact JavaScript array.  Keeping the conversion here
makes future workbook refreshes reproducible and, importantly, prevents a partial
hand-curated summary from dropping new or renamed 모집단위.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import pandas as pd


TRACK_NAMES = {
    "교과": "학생부교과",
    "종합": "학생부종합",
    "논술": "논술",
    "실기": "실기",
}


def clean(value: object) -> str:
    """Return a compact string while preserving the source wording."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    text = str(value).replace("\r\n", " ").replace("\n", " ")
    return " ".join(text.split()).replace("</BR>", " / ").replace("<BR>", " / ")


def value(row: pd.Series, column: str) -> str:
    return clean(row.get(column))


def stage_method(row: pd.Series) -> str:
    first = value(row, "전형설명1")
    second = value(row, "전형설명2")
    if not second:
        return first or value(row, "전형요소 메모") or "모집요강 기준"
    first_ratio = value(row, "선발비율1")
    second_ratio = value(row, "선발비율2")
    first_label = f"1단계 {first}" if first_ratio else first
    second_label = f"2단계 {second}" if second_ratio else second
    return f"{first_label} / {second_label}"


def element_detail(row: pd.Series, prefix: str) -> str:
    parts: list[str] = []
    for suffix in ("1", "2"):
        item = value(row, f"{prefix}{suffix}")
        if item:
            parts.append(item)
    return " / ".join(dict.fromkeys(parts))


def row_to_plan(row: pd.Series) -> dict[str, object] | None:
    university = value(row, "대학명")
    major = value(row, "모집단위")
    detail_major = value(row, "세부전공")
    admission = value(row, "전형유형")
    if not university or not major or not admission:
        return None

    # The workbook often gives a broad 모집단위 plus one or more 세부전공.
    # Keep both in the matching label: this lets an historical record for an
    # individual 전공 inherit the correct 2027 모집인원 without pretending that
    # each listed 전공 has the full combined headcount.
    if detail_major and detail_major.replace(" ", "") != major.replace(" ", ""):
        major = f"{major} ({detail_major})"

    center = value(row, "중심 전형요소")
    plan: dict[str, object] = {
        "rg": value(row, "지역"),
        "u": university,
        "t": TRACK_NAMES.get(center, center or "수시"),
        "p": admission,
        "m": major,
        "stage": value(row, "사정모형"),
        "n": value(row, "모집인원"),
        "method": stage_method(row),
        # Blank in the workbook means the university does not impose a CSAT minimum.
        # Do not substitute a generic phrase: the UI must show the authoritative wording.
        "min": value(row, "수능 최저학력 기준") or "미반영",
    }
    details = {
        "subj": value(row, "전형요소 메모"),
        "doc": element_detail(row, "서류"),
        "iv": element_detail(row, "면접"),
        "examPhase": value(row, "대학별고사 시기"),
        "ann1": value(row, "1차합격"),
        "ivdate": value(row, "면접"),
        "nonsul": value(row, "논술"),
        "prac": value(row, "실기"),
        "ann": value(row, "최종합격"),
    }
    plan.update({key: item for key, item in details.items() if item})
    return plan


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--sheet", default="2027수시요강")
    parser.add_argument("--header", type=int, default=8)
    args = parser.parse_args()

    source = pd.read_excel(args.workbook, sheet_name=args.sheet, header=args.header)
    plans: list[dict[str, object]] = []
    seen: set[tuple[str, ...]] = set()
    for _, row in source.iterrows():
        plan = row_to_plan(row)
        if not plan:
            continue
        key = tuple(str(plan.get(field, "")) for field in ("u", "m", "t", "p", "n"))
        if key in seen:
            continue
        seen.add(key)
        plans.append(plan)

    payload = json.dumps(plans, ensure_ascii=False, separators=(",", ":"))
    args.output.write_text(
        "// Generated from the 2027 수시 모집요강 DB workbook. Do not hand-edit.\n"
        f"window.__GAONGIL_SUSI_2027_PLAN__={payload};\n",
        encoding="utf-8",
    )
    print(f"wrote {len(plans):,} unique 2027 수시 모집 rows to {args.output}")


if __name__ == "__main__":
    main()
