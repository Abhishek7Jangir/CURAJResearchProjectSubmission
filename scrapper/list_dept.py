from bs4 import BeautifulSoup

FILE_PATH = "school_data"

with open(FILE_PATH, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# If file is HTML, parse it
soup = BeautifulSoup(content, "html.parser")

departments = set()

# Common places where dept names appear (works for text or HTML)
for tag in soup.find_all(["a", "li", "p", "span", "div"]):
    text = tag.get_text(strip=True)
    if "department" in text.lower():
        departments.add(text)

# Fallback: plain line scan
for line in content.splitlines():
    if "department" in line.lower():
        departments.add(line.strip())

# Save clean list
departments = sorted(departments)

with open("departments_list.txt", "w") as f:
    for d in departments:
        f.write(d + "\n")

print("Departments found:", len(departments))
print("Saved to departments_list.txt")

