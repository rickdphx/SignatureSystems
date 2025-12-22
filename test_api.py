#!/usr/bin/env python3
"""
Test script to verify BEN API returns correct JSON format with 'reply' field
"""
import requests
import json
import sys


def test_health_endpoint():
    """Test the health check endpoint"""
    print("Testing /health endpoint...")
    try:
        response = requests.get("http://127.0.0.1:8000/health")
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")

        # Verify 'reply' field exists
        if 'reply' in data:
            print("✅ Health endpoint returns 'reply' field")
            return True
        else:
            print("❌ Health endpoint missing 'reply' field")
            return False
    except Exception as e:
        print(f"❌ Error testing health endpoint: {e}")
        return False


def test_ben_message_endpoint():
    """Test the main BEN message endpoint"""
    print("\nTesting /api/ben endpoint...")
    try:
        test_message = {
            "message": "Hello, BEN! This is a test message.",
            "context": {}
        }

        response = requests.post(
            "http://127.0.0.1:8000/api/ben",
            json=test_message,
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")

        # Verify 'reply' field exists
        if 'reply' in data and isinstance(data['reply'], str):
            print("✅ BEN endpoint returns 'reply' field with string value")
            print(f"✅ Reply content: {data['reply']}")
            return True
        else:
            print("❌ BEN endpoint missing 'reply' field or wrong type")
            return False
    except Exception as e:
        print(f"❌ Error testing BEN endpoint: {e}")
        return False


def test_greeting():
    """Test greeting message"""
    print("\nTesting greeting message...")
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/ben",
            json={"message": "Hello!"},
            headers={"Content-Type": "application/json"}
        )

        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")

        if 'reply' in data:
            print("✅ Greeting test passed")
            return True
        else:
            print("❌ Greeting test failed")
            return False
    except Exception as e:
        print(f"❌ Error testing greeting: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("BEN API Response Format Test")
    print("=" * 60)
    print("\nVerifying that all endpoints return JSON with 'reply' field")
    print("as expected by frontend (App.jsx line ~346)\n")

    results = []
    results.append(("Health Check", test_health_endpoint()))
    results.append(("BEN Message", test_ben_message_endpoint()))
    results.append(("Greeting", test_greeting()))

    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)

    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False

    print("=" * 60)

    if all_passed:
        print("\n🎉 All tests passed! Backend is returning correct JSON format.")
        print("Frontend will receive 'data.reply' as expected.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Please check the API implementation.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
