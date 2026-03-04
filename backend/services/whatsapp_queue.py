import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
from collections import deque

logger = logging.getLogger(__name__)

class WhatsAppQueue:
    """
    Queue manager for WhatsApp messages to respect rate limits.
    TextMeBot allows 1 message per 5 seconds.
    """

    def __init__(self):
        self.queue = deque()
        self.last_send_time = None
        self.min_interval = 6  # 6 seconds between messages (safer than 5)
        self.is_processing = False

    async def add_to_queue(self, send_func, *args, **kwargs):
        """
        Add a message to the queue.
        Returns immediately with a placeholder result.
        """
        message_info = {
            'send_func': send_func,
            'args': args,
            'kwargs': kwargs,
            'added_time': datetime.now()
        }
        self.queue.append(message_info)

        # Start processing if not already running
        if not self.is_processing:
            asyncio.create_task(self._process_queue())

        return {"ok": True, "queued": True, "queue_size": len(self.queue)}

    async def _process_queue(self):
        """
        Process messages in the queue with rate limiting.
        """
        self.is_processing = True

        while self.queue:
            # Check if we need to wait
            if self.last_send_time:
                time_since_last = (datetime.now() - self.last_send_time).total_seconds()
                if time_since_last < self.min_interval:
                    wait_time = self.min_interval - time_since_last
                    logger.info(f"Rate limiting: waiting {wait_time:.1f}s before next message")
                    await asyncio.sleep(wait_time)

            # Get next message
            message_info = self.queue.popleft()

            try:
                # Send the message
                send_func = message_info['send_func']
                args = message_info['args']
                kwargs = message_info['kwargs']

                result = await send_func(*args, **kwargs)
                logger.info(f"Message sent successfully. Queue size: {len(self.queue)}")

                # Update last send time
                self.last_send_time = datetime.now()

            except Exception as e:
                logger.error(f"Error sending queued message: {e}")

        self.is_processing = False
        logger.info("Queue processing completed")

# Global queue instance
whatsapp_queue = WhatsAppQueue()