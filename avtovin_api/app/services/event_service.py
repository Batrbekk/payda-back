import json

import redis.asyncio as aioredis


async def publish_event(redis: aioredis.Redis, user_id: str, event_type: str, data: dict):
    channel = f"events:{user_id}"
    message = json.dumps({"type": event_type, **data})
    await redis.publish(channel, message)


async def subscribe_events(redis: aioredis.Redis, user_id: str):
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"events:{user_id}")
    return pubsub
