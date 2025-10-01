import os
import json
import io
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_file

app = Flask(__name__)

DATA_DIR = 'data'
FILE_MAPPING = {
    'default': 'markers.json',
    'admin': 'markers_admin.json',
    'admin_fleet': 'markers_admin_fleet.json'
}

# --- Helper Functions ---
def read_json_file(file_key):
    filename = FILE_MAPPING.get(file_key)
    if not filename: return None, "Invalid file key provided."
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if 'STATION' not in data or not isinstance(data['STATION'], list):
                return None, "JSON format error: Missing 'STATION' key."
            return data, None
    except FileNotFoundError:
        return {'STATION': []}, None
    except json.JSONDecodeError:
        return None, "Error decoding JSON from file."

def write_json_file(file_key, data):
    filename = FILE_MAPPING.get(file_key)
    if not filename: return False, "Invalid file key provided."
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        return True, None
    except Exception as e:
        return False, str(e)

# --- Web Page Route ---
@app.route('/')
def index():
    return render_template('index.html')

# --- API Routes ---
@app.route('/api/export/<string:file_key>')
def export_to_excel(file_key):
    data, error = read_json_file(file_key)
    if error: return jsonify({"error": error}), 500

    station_list = data.get('STATION', [])
    if not station_list: return "No data to export", 404

    df = pd.DataFrame(station_list)
    for col in ['description', 'product', 'other_product', 'service', 'promotion']:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: ', '.join(map(str, x)) if isinstance(x, list) else x)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Stations')
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name=f'{file_key}_stations.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.route('/api/markers/<string:file_key>', methods=['GET'])
def get_markers(file_key):
    data, error = read_json_file(file_key)
    if error: return jsonify({"error": error}), 500
    return jsonify(data.get('STATION', []))

@app.route('/api/markers/<string:file_key>', methods=['PATCH'])
def update_multiple_markers(file_key):
    updates = request.get_json()
    if not isinstance(updates, list): return jsonify({"error": "Request body must be an array"}), 400
    data, error = read_json_file(file_key)
    if error: return jsonify({"error": error}), 500
    stations_map = {str(s.get('id')): s for s in data['STATION']}
    updated_ids, not_found_ids = [], []
    for item in updates:
        marker_id, changes = item.get('id'), item.get('changes')
        if not marker_id or not changes: continue
        station = stations_map.get(str(marker_id))
        if station:
            station.update(changes)
            updated_ids.append(marker_id)
        else:
            not_found_ids.append(marker_id)
    success, write_error = write_json_file(file_key, data)
    if not success: return jsonify({"error": f"Write failed: {write_error}"}), 500
    return jsonify({"updated_ids": updated_ids, "not_found_ids": not_found_ids})

@app.route('/api/markers/<string:file_key>', methods=['POST'])
def add_marker(file_key):
    new_marker = request.get_json()
    if not new_marker or 'id' not in new_marker: return jsonify({"error": "ID is required."}), 400
    data, error = read_json_file(file_key)
    if error: return jsonify({"error": error}), 500
    station_list = data['STATION']
    if any(str(m.get('id')) == str(new_marker['id']) for m in station_list):
        return jsonify({"error": f"ID {new_marker['id']} already exists."}), 409
    station_list.append(new_marker)
    success, write_error = write_json_file(file_key, data)
    if not success: return jsonify({"error": f"Write failed: {write_error}"}), 500
    return jsonify(new_marker), 201

@app.route('/api/markers/<string:file_key>/<string:marker_id>', methods=['PUT'])
def update_marker(file_key, marker_id):
    update_data = request.get_json()
    data, error = read_json_file(file_key)
    if error: return jsonify({"error": error}), 500
    station_list = data['STATION']
    marker_found = False
    updated_marker_obj = {}
    for i, marker in enumerate(station_list):
        if str(marker.get('id')) == str(marker_id):
            station_list[i].update(update_data)
            updated_marker_obj = station_list[i]
            marker_found = True
            break
    if not marker_found: return jsonify({"error": f"ID {marker_id} not found."}), 404
    success, write_error = write_json_file(file_key, data)
    if not success: return jsonify({"error": f"Write failed: {write_error}"}), 500
    return jsonify(updated_marker_obj)

@app.route('/api/markers/<string:file_key>/<string:marker_id>', methods=['DELETE'])
def delete_marker(file_key, marker_id):
    data, error = read_json_file(file_key)
    if error: return jsonify({"error": error}), 500
    station_list = data['STATION']
    original_count = len(station_list)
    data['STATION'] = [m for m in station_list if str(m.get('id')) != str(marker_id)]
    if len(data['STATION']) == original_count:
        return jsonify({"error": f"ID {marker_id} not found."}), 404
    success, write_error = write_json_file(file_key, data)
    if not success: return jsonify({"error": f"Write failed: {write_error}"}), 500
    return jsonify({"message": f"ID {marker_id} deleted."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7000, debug=True)