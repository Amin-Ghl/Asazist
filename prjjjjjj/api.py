import socket
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import numpy as np

app = Flask(__name__)
CORS(app)

def get_local_ip():
    """Get the local IP address of the machine"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

def get_db():
    """Get database connection"""
    db = sqlite3.connect('stations.db')
    db.row_factory = sqlite3.Row
    return db

def init_db():
    """Initialize the database with tables"""
    db = get_db()
    cursor = db.cursor()
    
    # Create groups table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS groups (
            group_id INTEGER PRIMARY KEY,
            group_name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create stations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stations (
            station_id INTEGER PRIMARY KEY,
            station_name TEXT NOT NULL,
            group_id INTEGER,
            global_station_number INTEGER,
            group_station_number INTEGER,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups(group_id)
        )
    ''')
    
    # Create sensor_readings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id INTEGER,
            timestamp DATETIME,
            raw_temperature REAL,
            raw_humidity REAL,
            calibrated_temperature REAL,
            calibrated_humidity REAL,
            mouse_weight REAL,
            mouse_present INTEGER,
            bait1_touched INTEGER,
            bait2_touched INTEGER,
            FOREIGN KEY (station_id) REFERENCES stations(station_id)
        )
    ''')
    
    # Create model_outputs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS model_outputs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id INTEGER,
            group_id INTEGER,
            timestamp DATETIME,
            food_recommendation TEXT,
            mouse_probability REAL,
            FOREIGN KEY (station_id) REFERENCES stations(station_id),
            FOREIGN KEY (group_id) REFERENCES groups(group_id)
        )
    ''')
    
    db.commit()
    db.close()

@app.route('/database', methods=['GET'])
def get_database_data():
    """Get all database data"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get stations
        cursor.execute('SELECT * FROM stations')
        stations = [dict(row) for row in cursor.fetchall()]
        
        # Get sensor readings
        cursor.execute('SELECT * FROM sensor_readings ORDER BY timestamp DESC')
        readings = [dict(row) for row in cursor.fetchall()]
        
        # Get model outputs
        cursor.execute('SELECT * FROM model_outputs ORDER BY timestamp DESC')
        outputs = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            "status": "success",
            "data": {
                "stations": stations,
                "sensor_readings": readings,
                "model_outputs": outputs
            }
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        db.close()

@app.route('/stations', methods=['GET'])
def get_stations():
    """Get all stations"""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM stations WHERE is_active = 1')
        stations = [dict(row) for row in cursor.fetchall()]
        return jsonify({"stations": stations})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route('/sensor-readings', methods=['GET'])
def get_sensor_readings():
    """Get all sensor readings"""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM sensor_readings ORDER BY timestamp DESC')
        readings = [dict(row) for row in cursor.fetchall()]
        return jsonify({"sensor_readings": readings})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route('/station/<station_id>', methods=['GET'])
def get_station_data(station_id):
    """Get data for a specific station"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get station info
        cursor.execute('SELECT * FROM stations WHERE station_id = ?', (station_id,))
        station = dict(cursor.fetchone())
        
        # Get latest sensor reading
        cursor.execute('''
            SELECT * FROM sensor_readings 
            WHERE station_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        ''', (station_id,))
        reading = dict(cursor.fetchone()) if cursor.fetchone() else None
        
        # Get latest model output
        cursor.execute('''
            SELECT * FROM model_outputs 
            WHERE station_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        ''', (station_id,))
        model_output = dict(cursor.fetchone()) if cursor.fetchone() else None
        
        return jsonify({
            "station": station,
            "latest_reading": reading,
            "latest_model_output": model_output
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route('/sensor-reading', methods=['POST'])
def add_sensor_reading():
    """Add a single sensor reading"""
    try:
        data = request.json
        db = get_db()
        cursor = db.cursor()
        
        # Validate required fields
        required_fields = ['station_id', 'temperature', 'humidity', 'mouse_weight', 
                         'mouse_present', 'bait1_touched', 'bait2_touched']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Add sensor reading
        cursor.execute('''
            INSERT INTO sensor_readings (
                station_id, timestamp, raw_temperature, raw_humidity,
                calibrated_temperature, calibrated_humidity, mouse_weight,
                mouse_present, bait1_touched, bait2_touched
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['station_id'],
            datetime.now().isoformat(),
            data['temperature'],
            data['humidity'],
            data['temperature'],  # Using same values for calibrated
            data['humidity'],     # Using same values for calibrated
            data['mouse_weight'],
            data['mouse_present'],
            data['bait1_touched'],
            data['bait2_touched']
        ))
        
        db.commit()
        return jsonify({
            "status": "success",
            "message": "Sensor reading added successfully"
        })
    except Exception as e:
        db.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        db.close()

@app.route('/populate-test-data', methods=['POST'])
def populate_test_data():
    """Populate database with test data"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Clear existing data
        cursor.execute('DELETE FROM model_outputs')
        cursor.execute('DELETE FROM sensor_readings')
        cursor.execute('DELETE FROM stations')
        cursor.execute('DELETE FROM groups')
        
        # Add test groups
        groups = [
            ("Group 1", "First group of stations in Area A"),
            ("Group 2", "Second group of stations in Area B"),
            ("Group 3", "Third group of stations in Area C")
        ]
        
        group_ids = []
        for group_name, description in groups:
            cursor.execute(
                'INSERT INTO groups (group_name, description) VALUES (?, ?)',
                (group_name, description)
            )
            group_ids.append(cursor.lastrowid)
        
        # Add test stations
        for group_idx, group_id in enumerate(group_ids):
            for station_num in range(1, 4):
                station_name = f"Station {group_idx * 3 + station_num}"
                cursor.execute('''
                    INSERT INTO stations (
                        station_name, group_id, global_station_number, 
                        group_station_number
                    ) VALUES (?, ?, ?, ?)
                ''', (station_name, group_id, group_idx * 3 + station_num, station_num))
        
        # Add test sensor readings for last 90 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)
        
        cursor.execute('SELECT station_id, group_id FROM stations WHERE is_active = 1')
        stations = cursor.fetchall()
        
        for station in stations:
            station_id = station['station_id']
            group_id = station['group_id']
            current_date = start_date
            
            while current_date <= end_date:
                # Generate random sensor data with patterns
                mouse_weight = 20.0 + (group_id * 5) + np.random.normal(0, 2)
                temperature = 20.0 + (group_id * 2) + np.random.normal(0, 1)
                humidity = 50.0 + (group_id * 5) + np.random.normal(0, 3)
                
                # Activity patterns
                group_activity_day = (current_date.day + group_id) % 3 == 0
                mouse_present = 1 if (group_activity_day and np.random.random() > 0.3) else 0
                bait1_touched = 1 if (group_activity_day and np.random.random() > 0.4) else 0
                bait2_touched = 1 if (group_activity_day and np.random.random() > 0.5) else 0
                
                # Add sensor reading
                cursor.execute('''
                    INSERT INTO sensor_readings (
                        station_id, timestamp, raw_temperature, raw_humidity,
                        calibrated_temperature, calibrated_humidity, mouse_weight,
                        mouse_present, bait1_touched, bait2_touched
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    station_id, current_date.isoformat(),
                    temperature, humidity,
                    temperature, humidity,  # Using same values for calibrated
                    mouse_weight, mouse_present,
                    bait1_touched, bait2_touched
                ))
                
                current_date += timedelta(hours=1)
        
        db.commit()
        return jsonify({"status": "success", "message": "Test data populated successfully"})
    except Exception as e:
        db.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Start server
    local_ip = get_local_ip()
    print(f"\nServer starting...")
    print(f"Local IP: {local_ip}")
    print(f"Available endpoints:")
    print(f"  - http://{local_ip}:5000/database")
    print(f"  - http://{local_ip}:5000/stations")
    print(f"  - http://{local_ip}:5000/sensor-readings")
    print(f"  - http://{local_ip}:5000/sensor-reading (POST)")
    print(f"  - http://{local_ip}:5000/station/<station_id>")
    print(f"  - http://{local_ip}:5000/populate-test-data (POST)")
    print("\nPopulating test data...")
    with app.test_client() as client:
        client.post('/populate-test-data')
    print("\nPress Ctrl+C to stop the server\n")
    app.run(debug=True, port=5000, host='0.0.0.0') 