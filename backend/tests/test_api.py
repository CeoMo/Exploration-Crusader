import pytest
from fastapi.testclient import TestClient
from backend.app import create_app

@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(f"sqlite:///{tmp_path}/test.db")) as client:
        yield client

def test_save_and_duplicate(client):
    run = client.post('/api/runs').json()['id']
    data = {'nickname': 'Pilot', 'score': 0, 'duration': 0}
    assert client.post(f'/api/runs/{run}/score', json=data).status_code == 200
    assert client.post(f'/api/runs/{run}/score', json=data).status_code == 409
    assert client.get('/api/leaderboard').json()[0]['nickname'] == 'Pilot'

@pytest.mark.parametrize('change', [{'score':-1},{'score':999},{'score':True},{'duration':999},{'nickname':'   '},{'nickname':'<script>'}])
def test_reject_invalid_scores(client, change):
    run = client.post('/api/runs').json()['id']
    data = {'nickname':'Pilot','score':0,'duration':0} | change
    assert client.post(f'/api/runs/{run}/score',json=data).status_code == 422

def test_missing_run(client):
    assert client.post('/api/runs/missing/score',json={'nickname':'Pilot','score':0,'duration':0}).status_code == 404

def test_persistence_across_app_restarts(tmp_path):
    url = f'sqlite:///{tmp_path}/persist.db'
    with TestClient(create_app(url)) as client:
        run=client.post('/api/runs').json()['id']
        client.post(f'/api/runs/{run}/score',json={'nickname':'Persist','score':0,'duration':0})
    with TestClient(create_app(url)) as client:
        assert client.get('/api/leaderboard').json()[0]['nickname']=='Persist'
