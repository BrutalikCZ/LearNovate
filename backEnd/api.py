"""
LearNovate - Python AI backend
"""
print("[API] ====== API.PY LOADED ======")

import sys
sys.stdout.reconfigure(line_buffering=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
from AI.configAI import get_client, load_system_prompt
from AI.scoring import start_scenario_run, award_milestone_points, get_multiplier
from AI.logger import start_conversation, log_message, end_conversation
from AI.monitor import check_input, check_output, BLOCKED_INPUT_MSG, BLOCKED_OUTPUT_MSG
import jwt as pyjwt

app = Flask(__name__)
CORS(app)

AI_CONFIG = {
    'model': 'gpt-5.4-mini',
    'temperature': 0.7,
    'reasoning': {'effort': 'none'},
    'max_output_tokens': {
        'ask': 800,
        'scenario_start': 600,
        'scenario_step': 600,
    },
}

JWT_SECRET = 'learnovate-dev-secret'

try:
    _client = get_client()
    _system_prompt = load_system_prompt()
    _ai_ready = True
    print("[API] AI client initialized successfully.")
except Exception as e:
    import traceback
    print(f"[API] FAILED to initialize AI client:")
    traceback.print_exc()
    _client = None
    _system_prompt = None
    _ai_ready = False


def ai_call(conversation_input, token_key='ask'):
    return _client.responses.create(
        model=AI_CONFIG['model'],
        input=conversation_input,
        temperature=AI_CONFIG['temperature'],
        reasoning=AI_CONFIG['reasoning'],
        max_output_tokens=AI_CONFIG['max_output_tokens'][token_key],
    )


def parse_flags(answer):
    milestone = '[MILESTONE_COMPLETE]' in answer
    task_done = '[TASK_COMPLETE]' in answer
    clean = answer.replace('[MILESTONE_COMPLETE]', '').replace('[TASK_COMPLETE]', '').strip()
    return clean, task_done, milestone


def get_user_id_from_token(req):
    header = req.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    token = header.replace('Bearer ', '')
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload.get('id')
    except Exception:
        return None


@app.before_request
def log_all_requests():
    print(f"[FLASK] {request.method} {request.path}")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'ai_ready': _ai_ready})


@app.route('/ask', methods=['POST'])
def ask():
    if not _ai_ready:
        return jsonify({'error': 'AI client not initialized.'}), 503

    data = request.get_json(silent=True) or {}
    question = data.get('question', '').strip()
    subject  = data.get('subject', '')
    subject_context = data.get('subject_context', '')
    history  = data.get('messages', [])

    if not question:
        return jsonify({'error': 'Missing "question" parameter.'}), 400

    user_id = get_user_id_from_token(request)
    conv_id = data.get('conv_id', '').strip()

    # MONITOR: check input
    input_safe, input_reason = check_input(question)
    if not input_safe:
        if user_id:
            if not conv_id:
                conv_id = start_conversation(user_id, 'ask', {'subject': subject, 'blocked': True})
            log_message(user_id, conv_id, 'user', question, {'blocked': True, 'reason': input_reason})
        return jsonify({'answer': BLOCKED_INPUT_MSG, 'blocked': True, 'conv_id': conv_id})

    # Start conversation if first message
    if user_id and not conv_id:
        conv_id = start_conversation(user_id, 'ask', {'subject': subject})

    if user_id and conv_id:
        log_message(user_id, conv_id, 'user', question)

    # Build conversation input
    # Load chat assistant prompt (separate from scenario prompt)
    chat_prompt = {
        'role': 'system',
        'content': (
            "Jsi přátelský AI asistent vzdělávací platformy LearNovate. "
            "Pomáháš studentům pochopit učivo. Odpovídej stručně, jasně a v češtině. "
            "Pokud dostaneš kontext předmětu, drž se tématu ale odpověz na cokoliv se student zeptá."
        )
    }

    conversation_input = [chat_prompt]

    # Add subject context if available
    if subject_context:
        conversation_input.append({
            'role': 'user',
            'content': f'[Kontext lekce: {subject_context}]'
        })
        conversation_input.append({
            'role': 'assistant',
            'content': 'Rozumím, mám kontext této lekce. Na co se chceš zeptat?'
        })

    # Add conversation history
    for msg in history:
        conversation_input.append({
            'role': msg.get('role', 'user'),
            'content': msg.get('content', '')
        })

    # Add current question
    conversation_input.append({'role': 'user', 'content': question})

    try:
        response = ai_call(conversation_input, 'ask')
        answer = response.output_text

        # MONITOR: check output
        output_safe, output_reason = check_output(answer)
        if not output_safe:
            if user_id and conv_id:
                log_message(user_id, conv_id, 'ai', answer, {'blocked': True, 'reason': output_reason})
            return jsonify({'answer': BLOCKED_OUTPUT_MSG, 'blocked': True, 'conv_id': conv_id})

        if user_id and conv_id:
            log_message(user_id, conv_id, 'ai', answer)

        return jsonify({'answer': answer, 'conv_id': conv_id})
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

    user_id = get_user_id_from_token(request)

    scenario_context = ''
    milestones_list = []
    milestone_points = []

    if scenario_id:
        try:
            from AI.configAI import load_scenario
            scenario = load_scenario(scenario_id)
            s = scenario.get('scenario', {})
            raw_milestones = s.get('milestones', [])

            for m in raw_milestones:
                if isinstance(m, dict):
                    milestones_list.append(m.get('name', ''))
                    milestone_points.append(m.get('points', 100))
                else:
                    milestones_list.append(str(m))
                    milestone_points.append(100)

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
        milestone_points = [100] * 5

    repetition = 1
    multiplier = 1.0
    if user_id and scenario_id:
        rep, mult = start_scenario_run(user_id, scenario_id)
        if rep is not None:
            repetition = rep
            multiplier = mult

    opening_prompt = f"Start the scenario:\n{scenario_context}\n\nStart by describing the scene."
    conversation_input = [_system_prompt, {'role': 'user', 'content': opening_prompt}]

    try:
        response = ai_call(conversation_input, 'scenario_start')
        answer = response.output_text

        # MONITOR: check scenario start output
        output_safe, output_reason = check_output(answer)
        if not output_safe:
            if user_id:
                conv_id = start_conversation(user_id, 'scenario', {
                    'scenario_id': scenario_id, 'blocked_at_start': True, 'reason': output_reason
                })
                log_message(user_id, conv_id, 'ai', answer, {'blocked': True, 'reason': output_reason})
                end_conversation(user_id, conv_id)
            return jsonify({'error': BLOCKED_OUTPUT_MSG, 'blocked': True})

        conv_id = None
        if user_id:
            conv_id = start_conversation(user_id, 'scenario', {
                'scenario_id': scenario_id,
                'subject_name': subject_name,
                'repetition': repetition,
                'multiplier': multiplier,
            })
            log_message(user_id, conv_id, 'ai', answer)

        history = [
            {'role': 'user',      'content': opening_prompt},
            {'role': 'assistant', 'phase': 'final_answer', 'content': answer},
        ]
        return jsonify({
            'answer': answer,
            'messages': history,
            'max_milestones': len(milestones_list) if milestones_list else 5,
            'milestone_points': milestone_points,
            'repetition': repetition,
            'multiplier': multiplier,
            'conv_id': conv_id,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'AI Error: {str(e)}'}), 500


@app.route('/scenario/step', methods=['POST'])
def scenario_step():
    if not _ai_ready:
        return jsonify({'error': 'AI client not initialized.'}), 503

    data         = request.get_json(silent=True) or {}
    history      = data.get('messages', [])
    user_message = data.get('user_message', '').strip()
    scenario_id  = data.get('scenario_id', '').strip()
    conv_id      = data.get('conv_id', '').strip()
    milestones_completed = int(data.get('milestones_completed', 0))
    milestone_points_list = data.get('milestone_points', [])

    if not user_message:
        return jsonify({'error': 'Missing user_message.'}), 400

    user_id = get_user_id_from_token(request)

    # MONITOR: check user input
    input_safe, input_reason = check_input(user_message)
    if not input_safe:
        if user_id and conv_id:
            log_message(user_id, conv_id, 'user', user_message, {'blocked': True, 'reason': input_reason})
        return jsonify({
            'answer': BLOCKED_INPUT_MSG,
            'is_complete': False,
            'milestone_complete': False,
            'points_awarded': 0,
            'blocked': True,
        })

    print(f"[STEP] User: {user_id}, Scenario: {scenario_id}")
    print(f"[STEP] User message: {user_message[:100]}")

    if user_id and conv_id:
        log_message(user_id, conv_id, 'user', user_message)

    full_conversation = [_system_prompt] + history + [{'role': 'user', 'content': user_message}]

    try:
        response = ai_call(full_conversation, 'scenario_step')
        raw_answer = response.output_text

        print(f"[STEP] Contains [MILESTONE_COMPLETE]: {'[MILESTONE_COMPLETE]' in raw_answer}")
        print(f"[STEP] Contains [TASK_COMPLETE]: {'[TASK_COMPLETE]' in raw_answer}")

        answer, task_complete, milestone_complete = parse_flags(raw_answer)

        # MONITOR: check AI output
        output_safe, output_reason = check_output(answer)
        if not output_safe:
            if user_id and conv_id:
                log_message(user_id, conv_id, 'ai', answer, {'blocked': True, 'reason': output_reason})
            return jsonify({
                'answer': BLOCKED_OUTPUT_MSG,
                'is_complete': False,
                'milestone_complete': False,
                'points_awarded': 0,
                'blocked': True,
            })

        points_awarded = 0
        total_body = 0
        multiplier = 1.0

        if milestone_complete and user_id and scenario_id:
            milestone_index = milestones_completed
            base_points = 100
            if milestone_index < len(milestone_points_list):
                base_points = milestone_points_list[milestone_index]

            points_awarded, total_body, multiplier = award_milestone_points(
                user_id, scenario_id, milestone_index, base_points
            )

        if user_id and conv_id:
            log_message(user_id, conv_id, 'ai', answer, {
                'milestone_complete': milestone_complete,
                'task_complete': task_complete,
                'points_awarded': points_awarded,
            })
            if task_complete:
                end_conversation(user_id, conv_id, {
                    'milestones_completed': milestones_completed + (1 if milestone_complete else 0),
                    'total_points': total_body,
                })

        return jsonify({
            'answer': answer,
            'is_complete': task_complete,
            'milestone_complete': milestone_complete,
            'points_awarded': points_awarded,
            'total_body': total_body,
            'multiplier': multiplier,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'AI Error: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)