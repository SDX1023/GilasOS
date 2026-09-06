import pdfplumber
import sys

sys.stdout.reconfigure(encoding='utf-8')

with pdfplumber.open(r"C:\Users\Sofia\Downloads\Copy of PHILIPPINE HISTORY.docx.pdf") as pdf:
    with open("C:\\Users\\Sofia\\Documents\\GILASOS\\phil-history.txt", "w", encoding="utf-8") as f:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                f.write(f"--- PAGE {i+1} ---\n")
                f.write(text)
                f.write("\n\n")
    print(f"Total pages: {len(pdf.pages)}")
    print("Written to phil-history.txt")
