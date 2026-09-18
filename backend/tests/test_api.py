import urllib.request
import json

def test_endpoint(url, data=None):
    req = urllib.request.Request(url)
    if data:
        req.add_header("Content-Type", "application/json")
        res = urllib.request.urlopen(req, json.dumps(data).encode("utf-8"))
    else:
        res = urllib.request.urlopen(req)
    return json.loads(res.read().decode("utf-8"))

def run_tests():
    print("========================================")
    print("      TESTANDO ENDPOINTS DA API         ")
    print("========================================")
    
    # 1. Health check
    h = test_endpoint("http://127.0.0.1:8000/api/health")
    print("[PASS] Health Check:", h)
    assert h["status"] == "online"
    assert h["model_loaded"] is True
    
    # 2. Stats
    s = test_endpoint("http://127.0.0.1:8000/api/stats")
    print("[PASS] Stats:", s)
    assert s["total_news"] > 0
    
    # 3. Trending news
    trending = test_endpoint("http://127.0.0.1:8000/api/news?tab=trending")
    items = trending["news"]
    print(f"[PASS] Notícias em Alta ({len(items)} encontradas):")
    first = items[0]
    print(f"       -> ID: {first['id']} | [{first['reliability_score']}%] {first['title']}")
    
    # 4. Reddit-style Voting
    vote_res = test_endpoint(
        f"http://127.0.0.1:8000/api/news/{first['id']}/vote",
        {"client_id": "test_device_123", "direction": 1}
    )
    print("[PASS] Upvote registrado:", vote_res)
    assert vote_res["user_vote"] == 1
    
    # 5. Filter by topic
    topic_res = test_endpoint("http://127.0.0.1:8000/api/news?tab=topics&topics=Sa%C3%BAde")
    print(f"[PASS] Notícias no tópico 'Saúde': {len(topic_res['news'])}")
    for item in topic_res["news"]:
        print(f"       -> [{item['reliability_label']}] {item['title']}")
        
    print("========================================")
    print("   TODOS OS TESTES PASSARAM COM SUCESSO! ")
    print("========================================")

if __name__ == "__main__":
    run_tests()

