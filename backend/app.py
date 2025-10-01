import os
import json
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

DATA_DIR = 'data'
FILE_MAPPING = {
    'default': 'markers.json',
    'admin': 'markers_admin.json',
    'admin_fleet': 'markers_admin_fleet.json'
}

# --- Helper Functions (Updated) ---

def read_json_file(file_key):
    filename = FILE_MAPPING.get(file_key)
    if not filename:
        return None, "Invalid file key provided."
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
            # Ensure the data is in the expected format
            if 'STATION' not in data or not isinstance(data['STATION'], list):
                return None, "JSON format error: Missing 'STATION' key or it's not a list."
            return data, None
    except FileNotFoundError:
        # If file doesn't exist, create a default structure
        return {'STATION': []}, None
    except json.JSONDecodeError:
        return None, "Error decoding JSON from file."

def write_json_file(file_key, data):
    filename = FILE_MAPPING.get(file_key)
    if not filename:
        return False, "Invalid file key provided."
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=4)
        return True, None
    except Exception as e:
        return False, str(e)

# --- Web Page Route ---
@app.route('/')
def index():
    return render_template('index.html')

# --- API Routes (Updated) ---

@app.route('/api/markers/<string:file_key>', methods=['GET'])
def get_markers(file_key):
    """Endpoint to get all markers from a specific file."""
    data, error = read_json_file(file_key)
    if error:
        return jsonify({"error": error}), 500
    # Return just the list of stations
    return jsonify(data.get('STATION', []))

@app.route('/api/markers/<string:file_key>', methods=['POST'])
def add_marker(file_key):
    """Endpoint to add a new marker."""
    new_marker = request.get_json()
    if not new_marker or 'id' not in new_marker:
        return jsonify({"error": "Invalid data format. 'id' is required."}), 400

    data, error = read_json_file(file_key)
    if error:
        return jsonify({"error": error}), 500
    
    # Access the list via the 'STATION' key
    station_list = data['STATION']
    if any(str(marker.get('id')) == str(new_marker['id']) for marker in station_list):
        return jsonify({"error": f"Marker with id {new_marker['id']} already exists."}), 409

    station_list.append(new_marker)
    
    success, write_error = write_json_file(file_key, data)
    if not success:
        return jsonify({"error": f"Failed to write to file: {write_error}"}), 500
        
    return jsonify(new_marker), 201

@app.route('/api/markers/<string:file_key>/<string:marker_id>', methods=['PUT'])
def update_marker(file_key, marker_id):
    """Endpoint to update an existing marker by its ID."""
    update_data = request.get_json()
    
    data, error = read_json_file(file_key)
    if error:
        return jsonify({"error": error}), 500

    # Access the list via the 'STATION' key
    station_list = data['STATION']
    marker_found = False
    updated_marker_obj = {}
    for i, marker in enumerate(station_list):
        if str(marker.get('id')) == str(marker_id):
            station_list[i].update(update_data)
            updated_marker_obj = station_list[i]
            marker_found = True
            break
            
    if not marker_found:
        return jsonify({"error": f"Marker with id {marker_id} not found."}), 404

    success, write_error = write_json_file(file_key, data)
    if not success:
        return jsonify({"error": f"Failed to write to file: {write_error}"}), 500

    return jsonify(updated_marker_obj)

@app.route('/api/markers/<string:file_key>/<string:marker_id>', methods=['DELETE'])
def delete_marker(file_key, marker_id):
    """Endpoint to delete a marker by its ID."""
    data, error = read_json_file(file_key)
    if error:
        return jsonify({"error": error}), 500

    # Access the list via the 'STATION' key
    station_list = data['STATION']
    original_count = len(station_list)
    
    data['STATION'] = [marker for marker in station_list if str(marker.get('id')) != str(marker_id)]

    if len(data['STATION']) == original_count:
        return jsonify({"error": f"Marker with id {marker_id} not found."}), 404

    success, write_error = write_json_file(file_key, data)
    if not success:
        return jsonify({"error": f"Failed to write to file: {write_error}"}), 500
        
    return jsonify({"message": f"Marker with id {marker_id} deleted successfully."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)