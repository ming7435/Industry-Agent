"""临时 JSON 缓存只进入 Redis，TTL 不影响 MySQL 业务真相。"""
import json
import os


class RedisJsonCache:
    def __init__(self, url=None, *, prefix="industry:cache", ttl_seconds=300):
        import redis
        self.client = redis.Redis.from_url(url or os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0"), socket_connect_timeout=2, socket_timeout=2, decode_responses=True)
        self.prefix = str(prefix).rstrip(":") + ":"
        self.ttl_seconds = max(1, int(ttl_seconds))

    def get(self, key):
        value = self.client.get(self.prefix + str(key))
        return json.loads(value) if value else None

    def set(self, key, value):
        self.client.set(self.prefix + str(key), json.dumps(value, ensure_ascii=False, default=str), ex=self.ttl_seconds)

    def delete(self, key):
        self.client.delete(self.prefix + str(key))
