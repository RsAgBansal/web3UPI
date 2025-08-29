from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin, urlparse
from collections import deque
import time

visited = set()
base_url = "https://docs.soliditylang.org/en/latest/solidity-by-example.html"
domain = urlparse(base_url).netloc
output = "scraped_content.txt"

# Crawling limits
MAX_PAGES = 50  # Limit total pages to crawl
MAX_DEPTH = 3   # Limit crawling depth
DELAY_BETWEEN_REQUESTS = 1  # Seconds to wait between requests

# Define unwanted URL patterns
EXCLUDE_PATTERNS = [
    "/accounts/login",
    "/accounts/signup",
    "/accounts/github",
    "login",
    "signup"
]

SKIP_PHRASES = [
    "Don’t have an account",
    "head over to dev.algorand.co",
    "Please excuse us",
    "Gitcoin bounties",
    "sign up", "log in",
    "See the full list"
]

def is_meaningful_text(text):
    if len(text) < 40:  # Skip too short
        return False
    for phrase in SKIP_PHRASES:
        if phrase.lower() in text.lower():
            return False
    return True


# Helper function to check if URL should be skipped
def is_excluded(url):
    return any(pattern in url for pattern in EXCLUDE_PATTERNS)


def scrape_page(url):
    """Scrape content from a single page."""
    try:
        print(f"Scraping: {url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        res = requests.get(url, timeout=10, headers=headers)
        res.raise_for_status()  # Raise an exception for bad status codes
        soup = BeautifulSoup(res.text, 'html.parser')

        # Debug: check what we got
        print(f"  Page title: {soup.title.string if soup.title else 'No title'}")
        
        # Debug: show some of the HTML structure
        all_text = soup.get_text(strip=True)
        print(f"  Total text length: {len(all_text)} characters")
        print(f"  First 200 chars: {all_text[:200]}")
        
        # Debug: check for common elements
        divs = soup.find_all('div')
        links = soup.find_all('a')
        paras = soup.find_all('p')
        print(f"  Found: {len(divs)} divs, {len(links)} links, {len(paras)} paragraphs")
        
        # Extract and process content from multiple sources
        content_count = 0
        
        # Try paragraphs first
        for p in soup.find_all('p'):
            text = p.get_text(strip=True)
            if is_meaningful_text(text):
                with open(output, 'a', encoding='utf-8') as file:
                    file.write(f"P: {text}\n\n")
                content_count += 1

        # Try divs and other content containers
        for tag in soup.find_all(['div', 'article', 'section']):
            text = tag.get_text(strip=True)
            if is_meaningful_text(text) and len(text) > 100:  # Longer text for containers
                with open(output, 'a', encoding='utf-8') as file:
                    file.write(f"DIV: {text}\n\n")
                content_count += 1
                
        # Try headings
        for h in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            text = h.get_text(strip=True)
            if text and len(text) > 5:
                with open(output, 'a', encoding='utf-8') as file:
                    file.write(f"H: {text}\n")
                content_count += 1

        # Find more links to follow
        found_links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag.get('href')
            if href:
                next_link = urljoin(url, href)
                if domain in urlparse(next_link).netloc and not is_excluded(next_link):
                    found_links.append(next_link)
        
        # Remove duplicates
        found_links = list(set(found_links))
        
        print(f"  ✓ Extracted {content_count} content pieces, found {len(found_links)} unique links")
        if len(found_links) > 0:
            print(f"    Sample links: {found_links[:3]}")
        
        return found_links

    except Exception as e:
        print(f"  ✗ Failed to crawl {url}: {e}")
        return []


def crawl_iteratively(start_url):
    """Crawl pages iteratively with depth and page limits."""
    # Queue stores (url, depth) tuples
    queue = deque([(start_url, 0)])
    pages_scraped = 0
    
    print(f"Starting crawl from: {start_url}")
    print(f"Limits: {MAX_PAGES} pages max, {MAX_DEPTH} depth max")
    print("-" * 50)
    
    # Clear the output file
    with open(output, 'w', encoding='utf-8') as file:
        file.write(f"Scraped content from {domain}\n")
        file.write("=" * 50 + "\n\n")

    while queue and pages_scraped < MAX_PAGES:
        url, depth = queue.popleft()
        
        # Skip if already visited or depth exceeded
        if url in visited or depth > MAX_DEPTH:
            continue
            
        visited.add(url)
        pages_scraped += 1
        
        print(f"[{pages_scraped}/{MAX_PAGES}] Depth {depth}: ", end="")
        
        # Scrape the page
        new_links = scrape_page(url)
        
        # Add new links to queue with incremented depth
        for link in new_links:
            if link not in visited:
                queue.append((link, depth + 1))
        
        # Be respectful to the server
        time.sleep(DELAY_BETWEEN_REQUESTS)
    
    print("-" * 50)
    print(f"Crawling completed! Scraped {pages_scraped} pages.")
    print(f"Content saved to: {output}")


# Start crawling
if __name__ == "__main__":
    crawl_iteratively(base_url)