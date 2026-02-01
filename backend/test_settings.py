import requests
import json

base_url = "http://127.0.0.1:8001/api/settings"

def test_settings_update():
    print("Getting current settings...")
    try:
        r = requests.get(base_url)
        current = r.json()
        print("Current saved keys:", current.get("whatsapp_api_key"), current.get("whatsapp_instance_id"))
    except Exception as e:
        print(f"Failed to get settings: {e}")
        return

    print("Updating settings...")
    update_data = {
        "whatsapp_api_key": "TEST_KEY_123",
        "whatsapp_instance_id": "TEST_INSTANCE_456"
    }
    
    try:
        r = requests.put(base_url, json=update_data)
        if r.status_code == 200:
            print("Update success:", r.json().get("whatsapp_api_key") == "TEST_KEY_123")
        else:
            print(f"Update failed: {r.text}")
            
        print("Verifying persistence...")
        r = requests.get(base_url)
        new_settings = r.json()
        print("Final Saved Keys:", new_settings.get("whatsapp_api_key"), new_settings.get("whatsapp_instance_id"))
        
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_settings_update()
