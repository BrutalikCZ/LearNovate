"""
LearNovate - Python AI backend
Runs as an HTTP API (Flask), available on port 5000.
Node.js server proxies /api/ai/* here.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from AI.configAI import get_client, load_system_prompt

app = Flask(__name__)
CORS(app)

# ===================================================
# AI Configuration
# ===================================================
AI_CONFIG = {
    'model': 'gpt-5.4-mini',
    'temperature': 0.7,
    'reasoning': {
        'effort': 'none'
    },
    'max_output_tokens': {
        'ask': 800,
        'scenario_start': 600,
        'scenario_step': 600,
    },
}

# Initialize client once at startup
try:
    _client = get_client()
    _system_prompt = load_system_prompt()
    _ai_ready = True
except Exception as e:
    print(f"[WARN] Failed to initialize AI client: {e}")
    _client = None
    _system_prompt = None
    _ai_ready = False


def ai_call(conversation_input, token_key='ask'):
    """Unified OpenAI API call using the Responses API."""
    return _client.responses.create(
        model=AI_CONFIG['model'],
        input=conversation_input,
        temperature=AI_CONFIG['temperature'],
        reasoning=AI_CONFIG['reasoning'],
        max_output_tokens=AI_CONFIG['max_output_tokens'][token_key],
    )


def parse_flags(answer):
    """Detect and remove [MILESTONE_COMPLETE] and [TASK_COMPLETE] from the response."""
    milestone = '[MILESTONE_COMPLETE]' in answer
    task_done = '[TASK_COMPLETE]' in answer
    clean = answer.replace('[MILESTONE_COMPLETE]', '').replace('[TASK_COMPLETE]', '').strip()
    return clean, task_done, milestone


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'ai_ready': _ai_ready})


@app.route('/ask', methods=['POST'])
def ask():
    if not _ai_ready:
        return jsonify({'error': 'AI client not initialized. Check OPENAI_API_KEY.'}), 503

    data = request.get_json(silent=True) or {}
    question = data.get('question', '').strip()
    subject  = data.get('subject', '')

    if not question:
        return jsonify({'error': 'Missing "question" parameter.'}), 400

    conversation_input = [_system_prompt]
    if subject:
        conversation_input.append({'role': 'user', 'content': f'[Subject context: {subject}]'})
    conversation_input.append({'role': 'user', 'content': question})

    try:
        response = ai_call(conversation_input, 'ask')
        answer = response.output_text
        return jsonify({'answer': answer})
    except Exception as e:
        return jsonify({'error': f'AI Error: {str(e)}'}), 500


@app.route('/scenario/start', methods=['POST'])
def scenario_start():
    if not _ai_ready:
        return jsonify({'error': 'AI client not initialized.'}), 503

    data = request.get_json(silent=True) or {}
    subject_name        = data.get('subject_name', '')
    subject_description = data.get('subject_description', '')
    scenario_id         = data.get('scenario_id', '').strip()

    scenario_context = ''
    milestones_list = []

    if scenario_id:
        try:
            from AI.configAI import load_scenario
            scenario = load_scenario(scenario_id)
            s = scenario.get('scenario', {})
            milestones_list = s.get('milestones', [])
            milestones_text = '\n'.join(f'  {i+1}. {m}' for i, m in enumerate(milestones_list))
            scenario_context = (
                f"Scenario title: {s.get('title', '')}\n"
                f"Setting: {s.get('setting', '')}\n"
                f"Objective: {s.get('objective', '')}\n"
                f"Milestones (steps, {len(milestones_list)} total):\n{milestones_text}"
            )
        except Exception:
            pass

    if not scenario_context:
        scenario_context = (
            f"Generate a practical scenario for the topic: {subject_name}.\n"
            f"Topic description: {subject_description}\n"
            f"The user must solve a real-world situation related to this topic.\n"
            f"Generate exactly 5 milestones (steps)."
        )

    opening_prompt = f"Start the scenario:\n{scenario_context}\n\nStart by describing the scene."
    conversation_input = [_system_prompt, {'role': 'user', 'content': opening_prompt}]

    try:
        response = ai_call(conversation_input, 'scenario_start')
        answer = response.output_text
        history = [
            {'role': 'user',      'content': opening_prompt},
            {'role': 'assistant', 'phase': 'final_answer', 'content': answer},
        ]
        return jsonify({
            'answer': answer,
            'messages': history,
            'max_milestones': len(milestones_list) if milestones_list else 5,
        })
    except Exception as e:
        return jsonify({'error': f'AI Error: {str(e)}'}), 500


@app.route('/scenario/step', methods=['POST'])
def scenario_step():
    if not _ai_ready:
        return jsonify({'error': 'AI client not initialized.'}), 503

    data         = request.get_json(silent=True) or {}
    history      = data.get('messages', [])
    user_message = data.get('user_message', '').strip()

    if not user_message:
        return jsonify({'error': 'Missing user_message.'}), 400

    full_conversation = [_system_prompt] + history + [{'role': 'user', 'content': user_message}]

    try:
        response = ai_call(full_conversation, 'scenario_step')
        raw_answer = response.output_text
        answer, task_complete, milestone_complete = parse_flags(raw_answer)

        return jsonify({
            'answer': answer,
            'is_complete': task_complete,
            'milestone_complete': milestone_complete,
        })
    except Exception as e:
        return jsonify({'error': f'AI Error: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)