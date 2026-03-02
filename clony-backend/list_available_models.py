import google.generativeai as genai
import os

# Use the key from the .env or hardcoded for this quick test if needed
# We saw this key in debug_gemini.py: AIzaSyBE2e__Kc7xt0npUqP_LvAcIqQMqEhbr9U
API_KEY = "AIzaSyD2PtZIYya_UaSTZixpj7Df43FhAEgH1bM"
genai.configure(api_key=API_KEY)

print("Listing available Gemini models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
