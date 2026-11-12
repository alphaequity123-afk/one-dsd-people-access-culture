"""HTTP streaming contract, independent of GPU startup."""
import base64
import json


def create_app(render, *, voice="host1", profile=None, verified_packets=False):
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse, StreamingResponse
    from starlette.concurrency import run_in_threadpool
    web = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

    @web.get("/health")
    async def health():
        result = {"ready": True, "voice": voice, "reference_verified": True}
        if profile:
            result["profile"] = profile
        return result

    @web.post("/speech")
    async def speech(request: Request):
        body = bytearray()
        async for chunk in request.stream():
            body.extend(chunk)
            if len(body) > 64_000:
                return JSONResponse({"error": "Answer too long"}, status_code=413)
        try:
            value = json.loads(body)
            text = value.get("text") if isinstance(value, dict) else None
        except (ValueError, UnicodeDecodeError):
            text = None
        if not isinstance(text, str) or not text.strip() or len(text) > 10_000:
            return JSONResponse({"error": "A text answer of up to 10,000 characters is required"}, status_code=400)

        async def packets():
            rendered = render(text)
            try:
                sequence = 0
                while not await request.is_disconnected():
                    audio = await run_in_threadpool(lambda: next(rendered, None))
                    if audio is None:
                        yield "data: " + json.dumps({"done": True}) + "\n\n"
                        return
                    packet = {"audio": base64.b64encode(audio).decode("ascii"), "sequence": sequence}
                    if verified_packets:
                        packet["verified"] = True
                    yield "data: " + json.dumps(packet) + "\n\n"
                    sequence += 1
            except Exception:
                yield "data: " + json.dumps({"error": "The approved voice could not finish. Your written answer is still available."}) + "\n\n"
            finally:
                rendered.close()

        return StreamingResponse(packets(), media_type="text/event-stream", headers={"Cache-Control": "no-store"})
    return web
