import requests
import json
import random
import string

BASE_URL = "http://localhost:8000/api/auth"

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_auth():
    email = f"test_{random_string()}@example.com"
    password = "password123!"
    
    print(f"Testing signup with {email} / {password}")
    res = requests.post(f"{BASE_URL}/registration/", json={
        "email": email,
        "password1": password,
        "password2": password
    })
    print("Signup Status:", res.status_code)
    print("Signup Response:", json.dumps(res.json(), indent=2))
    
    if res.status_code == 201:
        print("\nTesting login...")
        res = requests.post(f"{BASE_URL}/login/", json={
            "email": email,
            "password": password
        })
        print("Login Status:", res.status_code)
        print("Login Response:", json.dumps(res.json(), indent=2))

if __name__ == "__main__":
    test_auth()
