import httpx
import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class WhatsAppClient:
    """TextMeBot WhatsApp API client wrapper"""
    
    def __init__(self):
        self.api_key = os.getenv("TEXTMEBOT_API_KEY")
        self.base_url = os.getenv("TEXTMEBOT_BASE_URL", "http://api.textmebot.com")
        self.sender = os.getenv("WHATSAPP_SENDER")
        
    async def send(self, to_phone: str, text: str) -> Dict:
        """
        Send WhatsApp message via TextMeBot.
        Returns dict with {ok: bool, provider_id: str|None, error: str|None}.
        """
        try:
            # TextMeBot API: GET send.php?recipient=[phone]&apikey=[key]&text=[text]
            url = f"{self.base_url}/send.php"
            params = {
                "recipient": to_phone,
                "apikey": self.api_key,
                "text": text
            }
            
            logger.info(f"Sending WhatsApp to {to_phone}: {text[:50]}...")
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                
                # TextMeBot returns simple response, check status code
                if response.status_code in (200, 201):
                    logger.info(f"WhatsApp sent successfully to {to_phone}")
                    return {
                        "ok": True,
                        "provider_id": None,
                        "error": None
                    }
                else:
                    error_msg = f"Status {response.status_code}: {response.text}"
                    logger.error(f"WhatsApp send failed: {error_msg}")
                    return {
                        "ok": False,
                        "provider_id": None,
                        "error": error_msg
                    }
                    
        except Exception as e:
            error_msg = str(e)
            logger.error(f"WhatsApp send exception: {error_msg}")
            return {
                "ok": False,
                "provider_id": None,
                "error": error_msg
            }