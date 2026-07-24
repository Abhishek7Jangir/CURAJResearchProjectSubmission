import os
import pandas as pd
from bs4 import BeautifulSoup

HTML_DIR = "dept_html"   # folder where you saved 34 html files

faculty_rows = []
dean_rows = []
hod_rows = []

for file in os.listdir(HTML_DIR):
    if not file.endswith(".html"):
        continue

    path = os.path.join(HTML_DIR, file)

    with open(path, encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    # Department name
    dept_tag = soup.find("h1")
    department = dept_tag.text.strip() if dept_tag else ""

    # Faculty blocks
    faculty_blocks = soup.select("div.faculty_short")

    for block in faculty_blocks:
        name_tag = block.find("h3")
        pos_tag = block.find("p")
        email_tag = block.select_one("a[href^=mailto]")

        name = name_tag.text.strip() if name_tag else ""
        position = pos_tag.text.strip() if pos_tag else ""
        email = email_tag["href"].replace("mailto:", "") if email_tag else ""

        row = {
            "department": department,
            "faculty name": name,
            "email": email,
            "position": position
        }

        faculty_rows.append(row)

        pos_lower = position.lower()

        if "dean" in pos_lower:
            dean_rows.append(row)

        if "head" in pos_lower or "hod" in pos_lower:
            hod_rows.append(row)


# -----------------
# Export Excel
# -----------------

df_faculty = pd.DataFrame(faculty_rows)
df_dean = pd.DataFrame(dean_rows)
df_hod = pd.DataFrame(hod_rows)

with pd.ExcelWriter("curaj_faculty_final.xlsx", engine="openpyxl") as writer:
    df_faculty.to_excel(writer, index=False, sheet_name="faculty")
    df_dean.to_excel(writer, index=False, sheet_name="deans")
    df_hod.to_excel(writer, index=False, sheet_name="hods")

print("Saved curaj_faculty_final.xlsx")
print("Faculty:", len(df_faculty))
print("Deans:", len(df_dean))
print("HODs:", len(df_hod))

