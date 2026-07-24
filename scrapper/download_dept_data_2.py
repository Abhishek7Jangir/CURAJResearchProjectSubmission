import requests
import os

missing = [
    "department-computer-science-and-engineering",
    "department-culture-and-media-studies",
    "department-society-technology-interface",
    "department-electronics-and-communication-engineering-ece",
    "department-environmental-science",
]

BASE = "https://www.curaj.ac.in/departments/"
OUTDIR = "dept_html"

os.makedirs(OUTDIR, exist_ok=True)

for slug in missing:
    url = BASE + slug
    try:
        r = requests.get(url, timeout=30)
        if r.status_code == 200:
            fname = f"{OUTDIR}/{slug}.html"
            with open(fname, "w", encoding="utf-8") as f:
                f.write(r.text)
            print("SAVED:", url)
        else:
            print("FAILED:", url, "Status:", r.status_code)
    except Exception as e:
        print("ERROR:", url, e)

