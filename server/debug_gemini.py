import google.generativeai as genai
import sys
import traceback

API_KEY = "AIzaSyBE2e__Kc7xt0npUqP_LvAcIqQMqEhbr9U"
genai.configure(api_key=API_KEY)

with open("debug_output.txt", "w", encoding="utf-8") as f:
    f.write(f"Testing Gemini API with key: {API_KEY[:10]}...\n")
    
    try:
        f.write("Listing models...\n")
        models = list(genai.list_models())
        f.write(f"Found {len(models)} models.\n")
        for m in models:
            f.write(f" - {m.name} ({m.supported_generation_methods})\n")
            
        f.write("\nAttempting generating simple text with gemini-1.5-flash...\n")
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hello")
        f.write(f"Response: {response.text}\n")

    except Exception as e:
        f.write(f"\nERROR: {type(e).__name__}: {str(e)}\n")
        traceback.print_exc(file=f)
