import requests
import os
import re

INPUT_FILE = "departments_list.txt"
BASE = "https://www.curaj.ac.in/departments/"

os.makedirs("dept_html", exist_ok=True)


def slugify(name):
    name = name.lower()
    name = re.sub(r"[&(),]", "", name)
    name = name.replace("department of", "").strip()
    name = name.replace("  ", " ")
    name = name.replace(" ", "-")
    return "department-" + name


with open(INPUT_FILE) as f:
    departments = [line.strip() for line in f if line.strip()]

for dept in departments:
    slug = slugify(dept)
    url = BASE + slug

    try:
        r = requests.get(url, timeout=20)
        if r.status_code != 200:
            print("NOT FOUND:", url)
            continue

        filename = f"dept_html/{slug}.html"
        with open(filename, "w", encoding="utf-8") as out:
            out.write(r.text)

        print("SAVED:", url)

    except Exception as e:
        print("ERROR:", url, e)

