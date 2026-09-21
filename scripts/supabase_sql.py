import json
import os
import urllib.request
import urllib.parse
import sys

PROJECT_REF = 'nhqomxlttffnaomlprlc'
TOKEN_PATH = os.path.expanduser('~/.gemini/antigravity-ide/mcp_oauth_tokens.json')

def get_access_token():
    if not os.path.exists(TOKEN_PATH):
        raise FileNotFoundError(f"Tokens file not found at {TOKEN_PATH}")
    with open(TOKEN_PATH, 'r') as f:
        data = json.load(f)
    
    key = f"https://mcp.supabase.com/mcp?project_ref={PROJECT_REF}"
    if key not in data:
        raise KeyError(f"Project key {key} not found in {TOKEN_PATH}")
    
    entry = data[key]
    tok = entry.get('token', {})
    return tok.get('access_token')

def execute_sql(query: str):
    token = get_access_token()
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    req = urllib.request.Request(
        url,
        data=json.dumps({"query": query}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("HTTPError:", e.code, e.reason, file=sys.stderr)
        print(e.read().decode("utf-8"), file=sys.stderr)
        raise

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 supabase_sql.py '<sql_query>'")
        sys.exit(1)
    q = sys.argv[1]
    res = execute_sql(q)
    print(json.dumps(res, indent=2))
