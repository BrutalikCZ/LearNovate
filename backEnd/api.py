"""
LearNovate – Python AI backend
Spouštěn jako HTTP API (Flask), dostupný na portu 5000.
Node.js server proxuje /api/ai/* sem.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from AI.configAI import get_client, load_system_prompt

app = Flask(__name__)
CORS(app)

# Klient se inicializuje jednou při startu
try:
    _client = get_client()
    _system_prompt = load_system_prompt()
    _ai_ready = True
except Exception as e:
    print(f"[WARN] AI klient se nepodařilo inicializovat: {e}")
    _client = None
    _system_prompt = None
    _ai_ready = False


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'ai_ready': _ai_ready})


@app.route('/ask', methods=['POST'])
def ask():
    if not _ai_ready:
        return jsonify({'error': 'AI klient není inicializován. Zkontrolujte OPENAI_API_KEY.'}), 503

    data = request.get_json(silent=True) or {}
    question = data.get('question', '').strip()
    subject  = data.get('subject', '')   # volitelný kontext předmětu

    if not question:
        return jsonify({'error': 'Chybí parametr "question".'}), 400

    messages = [_system_prompt]
    if subject:
        messages.append({'role': 'user', 'content': f'[Kontext předmětu: {subject}]'})
    messages.append({'role': 'user', 'content': question})

    try:
        response = _client.chat.completions.create(
            model='gpt-4o-mini',
            messages=messages,
            temperature=0.7,
            max_tokens=800,
        )
        answer = response.choices[0].message.content
        return jsonify({'answer': answer})
    except Exception as e:
        return jsonify({'error': f'Chyba AI: {str(e)}'}), 500


@app.route('/scenario/start', methods=['POST'])
def scenario_start():
    if not _ai_ready:
        return jsonify({'error': 'AI klient není inicializován.'}), 503

    data = request.get_json(silent=True) or {}
    subject_name        = data.get('subject_name', '')
    subject_description = data.get('subject_description', '')
    scenario_id         = data.get('scenario_id', '').strip()

    # Pokud existuje konkrétní scénář, načti ho
    scenario_context = ''
    if scenario_id:
        try:
            from AI.configAI import load_scenario
            scenario = load_scenario(scenario_id)
            s = scenario.get('scenario', {})
            scenario_context = (
                f"Název scénáře: {s.get('title', '')}\n"
                f"Situace: {s.get('setting', '')}\n"
                f"Cíl: {s.get('objective', '')}"
            )
        except Exception:
            pass

    # Fallback — vygeneruj scénář ze subject kontextu
    if not scenario_context:
        scenario_context = (
            f"Vygeneruj praktický scénář pro téma: {subject_name}.\n"
            f"Popis tématu: {subject_description}\n"
            f"Uživatel musí vyřešit reálnou situaci spojenou s tímto tématem."
        )

    opening_prompt = f"Spusť scénář:\n{scenario_context}\n\nZačni popisem scény."
    messages = [_system_prompt, {'role': 'user', 'content': opening_prompt}]

    try:
        response = _client.chat.completions.create(
            model='gpt-4o-mini',
            messages=messages,
            temperature=0.7,
            max_tokens=600,
        )
        answer = response.choices[0].message.content
        history = [
            {'role': 'user',      'content': opening_prompt},
            {'role': 'assistant', 'content': answer},
        ]
        return jsonify({'answer': answer, 'messages': history})
    except Exception as e:
        return jsonify({'error': f'Chyba AI: {str(e)}'}), 500


@app.route('/scenario/step', methods=['POST'])
def scenario_step():
    if not _ai_ready:
        return jsonify({'error': 'AI klient není inicializován.'}), 503

    data         = request.get_json(silent=True) or {}
    history      = data.get('messages', [])
    user_message = data.get('user_message', '').strip()
    step         = int(data.get('step', 1))
    max_steps    = int(data.get('max_steps', 5))

    if not user_message:
        return jsonify({'error': 'Chybí user_message.'}), 400

    full_messages = [_system_prompt] + history + [{'role': 'user', 'content': user_message}]

    if step >= max_steps:
        full_messages.append({
            'role': 'system',
            'content': 'Toto je poslední akce uživatele. Ukonči scénář — popiš výsledek a stručně zhodnoť, jak si uživatel vedl a zda splnil cíl.'
        })

    try:
        response = _client.chat.completions.create(
            model='gpt-4o-mini',
            messages=full_messages,
            temperature=0.7,
            max_tokens=600,
        )
        answer = response.choices[0].message.content
        return jsonify({'answer': answer, 'is_complete': step >= max_steps})
    except Exception as e:
        return jsonify({'error': f'Chyba AI: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
