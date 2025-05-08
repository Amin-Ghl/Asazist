import sqlite3
from datetime import datetime, timedelta
import calb
import food
import prob
import threading
import schedule
import time
from database_api import StationDatabase
import traceback
import os

class ModelTrainer:
    def __init__(self, db_name="stations.db"):
        # Ensure we're using the correct database file
        if not os.path.exists(db_name):
            print(f"Warning: Database file {db_name} not found. Using default database.")
            db_name = "stations.db"
        self.db_name = db_name
        self.db = StationDatabase(db_name)
        
    def train_models(self):
        """Train models with new data"""
        try:
            # Ensure database connection is initialized
            if not hasattr(self, 'db') or self.db is None:
                self.db = StationDatabase(self.db_name)
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Clear existing model outputs
            cursor.execute("DELETE FROM model_outputs")
            
            # Get all groups
            cursor.execute("SELECT DISTINCT group_id FROM stations")
            groups = cursor.fetchall()
            
            for group in groups:
                group_id = group[0]
                
                # Get stations in this group
                cursor.execute("SELECT station_id FROM stations WHERE group_id = ?", (group_id,))
                stations = cursor.fetchall()
                
                # Calculate group probability
                group_probability = prob.calculate_group_probability(conn, group_id)
                
                # For each station in the group
                for station in stations:
                    station_id = station[0]
                    
                    # Get latest sensor reading for this station
                    cursor.execute('''
                        SELECT raw_temperature, raw_humidity, mouse_weight,
                               mouse_present, bait1_touched, bait2_touched
                        FROM sensor_readings
                        WHERE station_id = ?
                        ORDER BY timestamp DESC
                        LIMIT 1
                    ''', (station_id,))
                    
                    reading = cursor.fetchone()
                    if reading:
                        # Calibrate sensor data
                        calibrated_temp = calb.calibrate_temperature(reading[0])
                        calibrated_humidity = calb.calibrate_humidity(reading[1])
                        
                        # Get food recommendation
                        food_rec = food.recommend_food(
                            reading[2],  # mouse_weight
                            reading[4],  # bait1_touched
                            reading[5],  # bait2_touched
                            calibrated_temp,
                            calibrated_humidity
                        )
                        
                        # Store model outputs with group probability
                        cursor.execute('''
                            INSERT INTO model_outputs (
                                station_id, timestamp, food_recommendation, mouse_probability
                            ) VALUES (?, datetime('now'), ?, ?)
                        ''', (station_id, food_rec, group_probability))
                        
                        print(f"Generated model outputs for station {station_id} (Group {group_id}):")
                        print(f"  - Food recommendation: {food_rec}")
                        print(f"  - Group probability: {group_probability:.2f}")
            
            conn.commit()
            print("Model training completed successfully!")
            
        except Exception as e:
            print(f"Error in model training: {str(e)}")
            traceback.print_exc()
            if 'conn' in locals():
                conn.rollback()

def run_scheduler():
    """Run the scheduler for daily model training"""
    trainer = ModelTrainer()
    
    # Schedule training to run daily at midnight
    schedule.every().day.at("00:00").do(trainer.train_models)
    
    print("Model training scheduler started. Will run daily at midnight.")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    # Run the scheduler
    run_scheduler() 