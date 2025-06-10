import os
from fraud_locations.Fraude_Locaties import FraudLocationManager

def main():
    # Get the database path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_file = os.path.join(base_dir, "project-d.db")
    
    # Initialize the fraud location manager
    manager = FraudLocationManager(db_file)
    
    # Step 1: Update coordinates for all charge points
    print("Updating charge point coordinates...")
    manager.update_charge_point_coordinates()
    print("Charge point coordinates updated.")
    
    # Step 2: Update fraud locations
    print("Updating fraud locations...")
    manager.update_fraud_locations()
    print("Fraud locations updated.")

if __name__ == "__main__":
    main() 