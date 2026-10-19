"""Shared scrubbing for everything published to the public crew map."""
import re
# Message/topic words that make a bus line private (whole message hidden, not just scrubbed).
PRIVATE=re.compile(r"(?i)\b(secur\w*|passwords?|passcodes?|bills?|loans?|osap|nslsc|bmo|banks?|banking|spend\w*|financ\w*|money|salary|budgets?|"
  r"payments?|paid|pay|payworks|payroll|paystubs?|paycheques?|paychecks?|wages?|refunds?|subscriptions?|cards?|credit|debit|transactions?|tx|balances?|invoices?|receipts?|taxes|tax|rent|"
  r"guelph|romeo|girlfriend|health|medical)\b")
def scrub(t):
    t=str(t or '')
    t=re.sub(r'[\w.+-]+@[\w-]+\.[\w.]+','[email]',t)
    t=re.sub(r'https?://[^\s)]+|www\.[^\s)]+|\b[\w-]+(\.[\w-]+)*\.(com|ca|io|app|dev|org|net|me)\b(/\S*)?','[link]',t)
    t=re.sub(r'(?i)(\$|CAD|USD)\s?-?\d[\d,]*(\.\d+)?|\d[\d,]*(\.\d+)?\s?(\$|dollars|CAD|USD)','[amount]',t)
    t=re.sub(r'\b\d[\d,]*\.\d{2}\b','[amount]',t)
    t=re.sub(r'\+?\b\d{1,2}[- .]?\(?\d{3}\)?[- .]\d{3}[- .]\d{4}\b|\b\d{5,}\b|\b\d{3,4}[- ]\d{3,4}[- ]\d{3,4}\b','[number]',t)
    t=re.sub(r'(?<![\d:/-])\b(?!(?:19|20)\d\d\b)\d{4}\b(?![:/-]\d)','[number]',t)   # last-4 account digits etc. (keeps times/years)
    t=re.sub(r'(?i)\b(sk|pk|ghp|gho|github_pat|AIza|xox[abp])[-_A-Za-z0-9]{10,}','[key]',t)
    t=re.sub(r'\b[A-Za-z0-9_-]{32,}\b','[key]',t)
    t=re.sub(r'(?i)(token|api key|key|password|secret)\s*[:=]\s*\S+',r'\1 [hidden]',t)
    t=re.sub(r'(?i)(/home/box|/workspace|/tmp)/\S*','[file]',t)
    return t
def clean(t,limit=80):
    """Short one-line, scrubbed label."""
    t=scrub(' '.join(str(t or '').split()))
    return t if len(t)<=limit else t[:limit].rsplit(' ',1)[0]+'…'
