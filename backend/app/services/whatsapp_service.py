# Language: Python | Target: WhatsApp Cloud API Notification Service
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger("globalroute.whatsapp")


async def send_whatsapp_message(to_phone: str, message_text: str) -> dict[str, Any]:
    cleaned_phone = "".join(ch for ch in to_phone if ch.isdigit())
    if not cleaned_phone:
        return {"sent": False, "reason": "invalid_phone"}

    if not settings.WHATSAPP_API_URL or not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_NUMBER_ID:
        return {"sent": False, "reason": "whatsapp_not_configured"}

    url = f"{settings.WHATSAPP_API_URL.rstrip('/')}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": cleaned_phone,
        "type": "text",
        "text": {"preview_url": False, "body": message_text},
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 201):
                return {"sent": True}
            logger.warning("WhatsApp API error status: %s", resp.status_code)
            return {"sent": False, "reason": "api_error", "status_code": resp.status_code}
    except httpx.RequestError as exc:
        logger.warning("WhatsApp network error: %s", type(exc).__name__)
        return {"sent": False, "reason": "network_error"}
