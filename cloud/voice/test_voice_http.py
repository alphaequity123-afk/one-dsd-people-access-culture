import base64
import json
import unittest
from fastapi.testclient import TestClient
from voice_http import create_app


class VoiceHTTPTests(unittest.TestCase):
    def test_stream_contract_and_completion(self):
        calls = []
        def render(text):
            calls.append(text)
            yield b"RIFF-example-WAVE"
            yield b"second-packet"
        response = TestClient(create_app(render)).post("/speech", json={"text": "A test answer."})
        self.assertEqual(response.status_code, 200)
        packets = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]
        self.assertEqual(base64.b64decode(packets[0]["audio"]), b"RIFF-example-WAVE")
        self.assertEqual([p["sequence"] for p in packets[:-1]], [0, 1])
        self.assertEqual(packets[-1], {"done": True})
        self.assertEqual(calls, ["A test answer."])

    def test_bad_requests_never_generate(self):
        def render(_):
            raise AssertionError("Invalid input must not reach the GPU")
        client = TestClient(create_app(render))
        for value in ({}, {"text": ""}, {"text": 10}, {"text": "x" * 10001}, []):
            self.assertEqual(client.post("/speech", json=value).status_code, 400)
        self.assertEqual(client.post("/speech", content=b"x" * 64001).status_code, 413)

    def test_generation_failure_does_not_expose_internal_errors_or_claim_completion(self):
        def render(_):
            yield b"audio"
            raise RuntimeError("private provider details")
        response = TestClient(create_app(render)).post("/speech", json={"text": "Test"})
        packets = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]
        self.assertIn("error", packets[-1])
        self.assertNotIn("private provider details", response.text)
        self.assertFalse(any(p.get("done") for p in packets))


if __name__ == "__main__":
    unittest.main()
