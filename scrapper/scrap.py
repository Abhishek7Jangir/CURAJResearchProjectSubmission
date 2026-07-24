import requests
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE = "https://www.curaj.ac.in"
HEADERS = {"User-Agent": "Mozilla/5.0"}

rows = []
leaders = []


def get(url):
    return BeautifulSoup(
        requests.get(url, headers=HEADERS, timeout=20).text,
        "html.parser"
    )


# -------------------------
# 1. Get department links from schools page
# -------------------------

schools_page = get("https://www.curaj.ac.in/schools")

dept_links = set()

for a in schools_page.find_all("a", href=True):
    href = a["href"]
    if "/departments/department-" in href:
        dept_links.add(urljoin(BASE, href))

print("Departments found:", len(dept_links))


# -------------------------
# 2. Parse each department page
# -------------------------

for url in dept_links:
    soup = get(url)

    dept = soup.find("h1")
    dept = dept.text.strip() if dept else ""

    # breadcrumb holds school
    school = ""
    crumbs = soup.select("ul.breadcrumb li")
    if len(crumbs) >= 2:
        school = crumbs[-2].text.strip()

    # faculty cards (real structure used by CURAJ)
    cards = soup.select(".view-content .row > div")

    for c in cards:
        name = c.select_one("h3, h4")
        email = c.select_one("a[href^=mailto]")
        position = c.find("strong")

        if not name:
            continue

        record = {
            "school": school,
            "dept": dept,
            "faculty name": name.text.strip(),
            "email": email.text.replace("mailto:", "") if email else "",
            "position": position.text.strip() if position else ""
        }

        rows.append(record)

        # detect HoD / Dean
        text = c.get_text(" ", strip=True).lower()
        if "head" in text or "hod" in text or "dean" in text:
            leaders.append(record)


# -------------------------
# 3. Export Excel
# -------------------------

df_fac = pd.DataFrame(rows)
df_lead = pd.DataFrame(leaders)

with pd.ExcelWriter("curaj_final.xlsx", engine="openpyxl") as w:
    df_fac.to_excel(w, index=False, sheet_name="faculty")
    df_lead.to_excel(w, index=False, sheet_name="dean_hod")

print("Saved curaj_final.xlsx")
print("Faculty:", len(df_fac))
print("Leaders:", len(df_lead))

