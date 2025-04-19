from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from google.cloud import texttospeech
import uuid
import os

router = APIRouter()

class TTSInput(BaseModel):
    text: str
    language: str = "en"

@router.post("/tts")
async def tts(tts_input: TTSInput = Body(...)):
    try:
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=tts_input.text)
        # Choose a voice for the language
        voice = texttospeech.VoiceSelectionParams(
            language_code=tts_input.language,
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        filename = f"tts_{uuid.uuid4()}.mp3"
        audio_path = os.path.join("static", "tts_audio", filename)
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)
        with open(audio_path, "wb") as out:
            out.write(response.audio_content)
        audio_url = f"/static/tts_audio/{filename}"
        return {"audio_url": audio_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
