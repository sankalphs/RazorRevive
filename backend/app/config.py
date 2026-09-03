import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from root directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

GMI_BASE_URL = os.getenv("GMI_BASE_URL", "https://api.gmi-serving.com/v1")
GMI_API_KEY = os.getenv("GMI_API_KEY", "")
GMI_MODEL = os.getenv("GMI_MODEL", "MiniMaxAI/MiniMax-M3")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")

# Compliance Constants
RBI_START_HOUR_IST = 8   # 08:00 AM IST
RBI_END_HOUR_IST = 19    # 07:00 PM IST
MAX_TOUCHPOINTS = 3      # Maximum contact attempts within 7 days
PRE_DEBIT_NOTIFICATION_HOURS = 24
