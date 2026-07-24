import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

BASE = "https://www.curaj.ac.in"
visited = set()
found = set()

def crawl(url):
    if url in visited:
        return
    visited.add(url)

    try:
        r = requests.get(url, timeout=20)
        soup = BeautifulSoup(r.text, "html.parser")
    except:
        return

    for a in soup.find_all("a", href=True):
        link = urljoin(BASE, a["href"])
        if BASE in link:
            clean = link.split("#")[0]
            if clean not in found:
                found.add(clean)
                crawl(clean)

crawl(BASE)

with open("all_links.txt", "w") as f:
    for l in sorted(found):
        f.write(l + "\n")

print("Saved all_links.txt with", len(found), "links")

