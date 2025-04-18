from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from google.generativeai import configure as genai_configure, GenerativeModel
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['GEMINI_API_KEY'] = os.getenv("GEMINI_API_KEY")
app.config['CONFIG_FILE'] = 'config.json'

conversation_history = []

try:
    genai_configure(api_key=app.config['GEMINI_API_KEY'])
    model = GenerativeModel('gemini-2.0-flash')
except Exception as e:
    print(f"Failed to initialize Gemini: {str(e)}")
    model = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    if not model:
        return jsonify({'status': 'error', 'message': 'Gemini model not initialized'}), 500

    try:
        data = request.json
        user_message = data.get('message', '').strip()

        if not user_message:
            return jsonify({'status': 'error', 'message': 'Empty message'}), 400

        if not conversation_history:
            conversation_history.append({
                'role': 'user',
                'parts': [{
                    'text': "You are a helpful AI assistant. Be friendly and provide detailed answers."
                }]
            })

        conversation_history.append({
            'role': 'user',
            'parts': [{'text': user_message}]
        })

        chat_session = model.start_chat(history=conversation_history)
        response = chat_session.send_message(user_message)
        ai_response = response.text

        conversation_history.append({
            'role': 'model',
            'parts': [{'text': ai_response}]
        })

        return jsonify({
            'status': 'success',
            'response': ai_response,
            'history': conversation_history
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f"Error in chat: {str(e)}"
        }), 500

@app.route('/reset', methods=['POST'])
def reset_conversation():
    global conversation_history
    conversation_history = []
    return jsonify({'status': 'success', 'message': 'Conversation reset'})

if __name__ == '__main__':
    if not os.path.exists(app.config['CONFIG_FILE']):
        with open(app.config['CONFIG_FILE'], 'w') as f:
            json.dump({}, f)

    app.run(debug=True, host='0.0.0.0', port=5000)
