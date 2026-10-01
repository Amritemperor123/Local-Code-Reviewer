import os
import uuid
import zipfile
import shutil
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = './uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB

LM_STUDIO_URL = os.environ.get('LM_STUDIO_URL', 'http://172.0.0.1:1234')

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def detect_language(filename):
    ext = os.path.splitext(filename)[1].lower()
    mapping = {
        '.py': 'python',
        '.js': 'javascript', '.jsx': 'javascript',
        '.ts': 'typescript', '.tsx': 'typescript',
        '.java': 'java',
        '.c': 'c', '.h': 'c',
        '.cpp': 'cpp', '.cc': 'cpp', '.hpp': 'cpp',
        '.cs': 'csharp',
        '.go': 'go',
        '.rs': 'rust',
        '.html': 'html', '.htm': 'html',
        '.css': 'css', '.scss': 'css', '.sass': 'css',
        '.json': 'json',
        '.md': 'markdown', '.markdown': 'markdown',
        '.sh': 'bash', '.bash': 'bash',
        '.yaml': 'yaml', '.yml': 'yaml',
        '.xml': 'xml',
        '.sql': 'sql',
        '.r': 'r',
        '.rb': 'ruby',
        '.php': 'php',
        '.swift': 'swift',
        '.kt': 'kotlin'
    }
    return mapping.get(ext, 'text')

@app.before_request
def log_request_info():
    app.logger.info(f"Request: {request.method} {request.url}")

@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f"Error: {str(e)}")
    return jsonify(error=str(e)), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    session_id = str(uuid.uuid4())
    session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    os.makedirs(session_dir, exist_ok=True)

    filename = file.filename
    file_path = os.path.join(session_dir, filename)
    file.save(file_path)

    if filename.endswith('.zip'):
        try:
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(session_dir)
            os.remove(file_path) # Remove the zip file after extraction
        except zipfile.BadZipFile:
            shutil.rmtree(session_dir)
            return jsonify({"error": "Invalid zip file"}), 400

    return jsonify({"session_id": session_id}), 200

@app.route('/api/files', methods=['GET'])
def list_files():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    if not os.path.exists(session_dir):
        return jsonify({"error": "Session not found"}), 404

    ignore_dirs = {'.git', 'node_modules', '__pycache__', '.DS_Store'}
    ignore_exts = {'.pyc'}

    file_list = []
    for root, dirs, files in os.walk(session_dir):
        # Filter out hidden directories and ignore_dirs
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ignore_dirs]

        for file in files:
            if file.startswith('.') or any(file.endswith(ext) for ext in ignore_exts):
                continue

            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, session_dir)
            # Use forward slashes for consistency in API
            rel_path = rel_path.replace('\\', '/')
            file_list.append(rel_path)

    file_list.sort()
    return jsonify({"files": file_list}), 200

@app.route('/api/file', methods=['GET'])
def get_file():
    session_id = request.args.get('session_id')
    path_arg = request.args.get('path')

    if not session_id or not path_arg:
        return jsonify({"error": "session_id and path are required"}), 400

    session_dir = os.path.abspath(os.path.join(app.config['UPLOAD_FOLDER'], session_id))
    if not os.path.exists(session_dir):
        return jsonify({"error": "Session not found"}), 404

    # Resolve absolute path and prevent path traversal
    file_path = os.path.abspath(os.path.join(session_dir, path_arg))
    if not file_path.startswith(session_dir):
        return jsonify({"error": "Invalid file path"}), 403

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    if not os.path.isfile(file_path):
        return jsonify({"error": "Not a file"}), 400

    # Limit to 1MB
    file_size = os.path.getsize(file_path)
    if file_size > 1024 * 1024:
        return jsonify({"error": "File too large (exceeds 1MB)"}), 400

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return jsonify({"error": "Binary or unsupported file type"}), 400

    lang = detect_language(file_path)
    return jsonify({"content": content, "language": lang}), 200

def get_active_lm_studio_url():
    configured = os.environ.get('LM_STUDIO_URL')
    candidates = []
    if configured:
        candidates.append(configured)
    candidates.extend([
        'http://host.docker.internal:1234',
        'http://172.17.0.1:1234',
        'http://127.0.0.1:1234'
    ])

    seen = set()
    unique_candidates = [url for url in candidates if not (url in seen or seen.add(url))]

    for url in unique_candidates:
        try:
            resp = requests.get(f"{url}/v1/models", timeout=3)
            if resp.status_code == 200:
                models = resp.json().get('data', [])
                if models:
                    return url, models[0]['id'], None
                else:
                    return url, None, "LM Studio is running, but no model is loaded. Please load a model in LM Studio."
        except Exception:
            continue

    return None, None, (
        "Could not connect to LM Studio. "
        "Please ensure: 1) LM Studio server is running on port 1234. "
        "2) In LM Studio server settings, enable 'Serve on Local Network' (or set host to 0.0.0.0) so WSL/Docker can connect."
    )

@app.route('/api/review', methods=['POST'])
def review_code():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    session_id = data.get('session_id')
    file_path = data.get('file_path')
    code = data.get('code')

    if not session_id or not file_path or not code:
        return jsonify({"error": "session_id, file_path, and code are required"}), 400

    lm_url, model_id, err_msg = get_active_lm_studio_url()
    if err_msg:
        return jsonify({"error": err_msg}), 502

    system_prompt = (
        "You are an expert code reviewer. Analyze the provided code and give detailed, "
        "constructive feedback. Focus on:\n"
        "1. Code quality and best practices\n"
        "2. Potential bugs or errors\n"
        "3. Performance issues\n"
        "4. Security vulnerabilities\n"
        "5. Code style and readability\n"
        "6. Suggestions for improvement\n"
        "Format your response with clear sections using markdown headers (##). Be specific and actionable."
    )

    payload = {
        "model": model_id,
        "stream": True,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"File Path: {file_path}\n\nCode:\n{code}"}
        ]
    }

    def generate():
        """Generator that forwards LM Studio SSE chunks to the client."""
        try:
            with requests.post(
                f"{lm_url}/v1/chat/completions",
                json=payload,
                stream=True,
                timeout=180
            ) as lm_resp:
                lm_resp.raise_for_status()
                for raw_line in lm_resp.iter_lines():
                    if not raw_line:
                        continue
                    line = raw_line.decode('utf-8') if isinstance(raw_line, bytes) else raw_line
                    if not line.startswith('data:'):
                        continue
                    chunk = line[len('data:'):].strip()
                    if chunk == '[DONE]':
                        yield "data: [DONE]\n\n"
                        return
                    yield f"data: {chunk}\n\n"
        except Exception as e:
            import json as _json
            yield f"event: error\ndata: {_json.dumps({'error': str(e)})}\n\n"

    return app.response_class(generate(), mimetype='text/event-stream',
                              headers={"X-Accel-Buffering": "no",
                                       "Cache-Control": "no-cache"})

@app.route('/api/session', methods=['DELETE'])
def delete_session():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    if os.path.exists(session_dir):
        shutil.rmtree(session_dir)

    return jsonify({"success": True}), 200

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', debug=True, port=port)
