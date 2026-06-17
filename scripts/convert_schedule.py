#!/usr/bin/env python3
"""
Convert schedule XLS files (per-day sheets, per-master columns)
to BeautyOS CSV format: Клиент,Телефон,Дата визита,Мастер,Услуга,Сумма
"""

import xlrd
import csv
import re
import os
import sys

FILES = [
    "/Users/uliaionova/15.03 - 14.04.",
    "/Users/uliaionova/15.04-14.05",
    "/Users/uliaionova/15.05-14.06",
]

OUTPUT = "/Users/uliaionova/beautyos/data/dikidi_converted.csv"

def parse_cell(cell_text, master, date_str):
    """Parse booking cell text into structured record."""
    lines = [l.strip() for l in cell_text.strip().split("\n") if l.strip()]
    if len(lines) < 2:
        return None

    # Line 0: "HH:MM - HH:MM    (NNNN RUB)" or just time range
    amount = 0
    amount_match = re.search(r"\((\d+)\s*RUB\)", lines[0])
    if amount_match:
        amount = int(amount_match.group(1))

    # Lines 1+ : client name, phone, service, notes
    client_name = ""
    phone = ""
    service_parts = []

    for line in lines[1:]:
        if re.match(r"^7\d{10}$|^\+7\d{10}$|^8\d{10}$", line.strip()):
            phone = line.strip()
        elif not client_name:
            client_name = line
        else:
            # Skip obvious notes that aren't service names
            if not re.match(r"^(долг|потреб|могу|4ног)", line, re.IGNORECASE):
                service_parts.append(line)

    service = ", ".join(service_parts) if service_parts else ""

    if not client_name:
        return None

    # Normalize phone: strip non-digits, ensure starts with 7
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    phone_clean = digits if digits else phone

    return {
        "client": client_name,
        "phone": phone_clean,
        "date": date_str,
        "master": master,
        "service": service,
        "amount": amount,
    }


def process_file(path):
    records = []
    wb = xlrd.open_workbook(path.encode(), ignore_workbook_corruption=True)

    for sheet_idx in range(wb.nsheets):
        ws = wb.sheet_by_index(sheet_idx)
        date_str = wb.sheet_names()[sheet_idx]  # DD.MM.YYYY

        if ws.nrows < 2 or ws.ncols < 2:
            continue

        # Row 0: headers — master names in columns 1..N
        masters = []
        for c in range(1, ws.ncols):
            masters.append(str(ws.cell_value(0, c)).strip())

        # Rows 1..: time slot + booking cells per master
        for r in range(1, ws.nrows):
            for c_idx, master in enumerate(masters):
                if not master:
                    continue
                cell_val = str(ws.cell_value(r, c_idx + 1)).strip()
                if not cell_val:
                    continue
                record = parse_cell(cell_val, master, date_str)
                if record:
                    records.append(record)

    return records


def main():
    all_records = []
    for path in FILES:
        if not os.path.exists(path):
            print(f"SKIP (not found): {path}")
            continue
        print(f"Processing: {path}")
        recs = process_file(path)
        print(f"  → {len(recs)} записей")
        all_records.extend(recs)

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

    with open(OUTPUT, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["Клиент", "Телефон", "Дата визита", "Мастер", "Услуга", "Сумма"],
        )
        writer.writeheader()
        for r in all_records:
            writer.writerow({
                "Клиент": r["client"],
                "Телефон": r["phone"],
                "Дата визита": r["date"],
                "Мастер": r["master"],
                "Услуга": r["service"],
                "Сумма": r["amount"],
            })

    print(f"\nГотово! {len(all_records)} записей → {OUTPUT}")


if __name__ == "__main__":
    main()
