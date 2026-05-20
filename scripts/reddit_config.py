"""Reddit configuration — subreddits to scrape for ad-discussion aggregation.

See docs/adr/0007-reddit-aggregation.md for the decision record.
Rate limit: Reddit's public JSON API is roughly 1 request per 2 seconds;
we add a conservative 2.5 s delay between subreddits.
"""

SUBREDDITS: list[str] = [
    "FacebookAds",
    "PPC",
    "advertising",
    "marketing",
    "GoogleAds",
    "programmatic",
    "adops",
    "socialmedia",
]

# Minimum upvotes to include a post in the aggregation.
MIN_UPVOTES = 25

# Each subreddit fetch: top posts from the past week, up to 20 posts.
SORT = "top"
TIME = "week"
LIMIT = 20

# Seconds between requests to stay within Reddit's rate limit.
REQUEST_DELAY = 2.5

# Reddit JSON API base (no auth required for public subreddits).
BASE_URL = "https://www.reddit.com"

# User-Agent header — Reddit requires a non-default UA.
USER_AGENT = (
    "media-updates/1.0 (by /u/toptou-product; internal research aggregator; "
    "1 request every 2.5 seconds)"
)

# Rolling retention: posts older than this many days are trimmed from the data file.
MAX_AGE_DAYS = 90
