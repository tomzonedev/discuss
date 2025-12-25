import requests
import sys
import json
from datetime import datetime, timedelta

class DiscussionBoardAPITester:
    def __init__(self, base_url="https://discusshub-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_resources = {
            'users': [],
            'topics': [],
            'tasks': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'endpoint': endpoint,
                    'error': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'error': str(e),
                'endpoint': endpoint
            })
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_register_user(self, name, email, password, phone=None):
        """Test user registration"""
        data = {
            "name": name,
            "email": email,
            "password": password
        }
        if phone:
            data["phone"] = phone
            
        success, response = self.run_test(
            f"Register User ({email})",
            "POST",
            "auth/register",
            200,
            data=data
        )
        
        if success and 'access_token' in response:
            user_data = {
                'id': response['user']['id'],
                'email': email,
                'token': response['access_token']
            }
            self.created_resources['users'].append(user_data)
            return True, user_data
        return False, {}

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            f"Login ({email})",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True, response
        return False, {}

    def test_get_current_user(self):
        """Test get current user profile"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_get_users(self, search=None):
        """Test get all users"""
        params = {"search": search} if search else None
        return self.run_test("Get All Users", "GET", "users", 200, data=params)

    def test_create_topic(self, name, description=None):
        """Test create topic"""
        data = {"name": name}
        if description:
            data["description"] = description
            
        success, response = self.run_test(
            f"Create Topic ({name})",
            "POST",
            "topics",
            200,
            data=data
        )
        
        if success and 'id' in response:
            self.created_resources['topics'].append(response['id'])
            return True, response
        return False, {}

    def test_get_topics(self, search=None, my_topics=False):
        """Test get topics"""
        params = {}
        if search:
            params["search"] = search
        if my_topics:
            params["my_topics"] = True
            
        return self.run_test("Get Topics", "GET", "topics", 200, data=params)

    def test_get_topic_detail(self, topic_id):
        """Test get topic details"""
        return self.run_test(f"Get Topic Detail ({topic_id})", "GET", f"topics/{topic_id}", 200)

    def test_subscribe_to_topic(self, topic_id):
        """Test subscribe to topic"""
        return self.run_test(f"Subscribe to Topic ({topic_id})", "POST", f"topics/{topic_id}/subscribe", 200)

    def test_unsubscribe_from_topic(self, topic_id):
        """Test unsubscribe from topic"""
        return self.run_test(f"Unsubscribe from Topic ({topic_id})", "DELETE", f"topics/{topic_id}/unsubscribe", 200)

    def test_add_member_to_topic(self, topic_id, user_id, role="member"):
        """Test add member to topic"""
        data = {"user_id": user_id, "role": role}
        return self.run_test(f"Add Member to Topic ({topic_id})", "POST", f"topics/{topic_id}/members", 200, data=data)

    def test_create_task(self, topic_id, title, description=None, worker_id=None):
        """Test create task"""
        data = {
            "topic_id": topic_id,
            "title": title
        }
        if description:
            data["description"] = description
        if worker_id:
            data["worker_id"] = worker_id
            
        success, response = self.run_test(
            f"Create Task ({title})",
            "POST",
            "tasks",
            200,
            data=data
        )
        
        if success and 'id' in response:
            self.created_resources['tasks'].append(response['id'])
            return True, response
        return False, {}

    def test_get_my_tasks(self):
        """Test get my tasks"""
        return self.run_test("Get My Tasks", "GET", "tasks", 200)

    def test_get_topic_tasks(self, topic_id):
        """Test get topic tasks"""
        return self.run_test(f"Get Topic Tasks ({topic_id})", "GET", f"topics/{topic_id}/tasks", 200)

    def test_update_task_status(self, task_id, status):
        """Test update task status"""
        data = {"status": status}
        return self.run_test(f"Update Task Status ({task_id})", "PUT", f"tasks/{task_id}", 200, data=data)

    def test_assign_task_to_users(self, task_id, worker_ids):
        """Test assign task to multiple users"""
        data = {"worker_ids": worker_ids}
        return self.run_test(f"Assign Task to Users ({task_id})", "POST", f"tasks/{task_id}/assign", 200, data=data)

    def test_delete_task(self, task_id):
        """Test delete task"""
        return self.run_test(f"Delete Task ({task_id})", "DELETE", f"tasks/{task_id}", 200)

    def test_swagger_docs(self):
        """Test Swagger UI availability"""
        # Remove /api from base URL for docs endpoint
        docs_url = self.base_url.replace('/api', '/docs')
        try:
            response = requests.get(docs_url)
            if response.status_code == 200:
                print("✅ Swagger UI accessible at /docs")
                return True
            else:
                print(f"❌ Swagger UI failed - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Swagger UI failed - Error: {str(e)}")
            return False

def main():
    print("🚀 Starting Discussion Board API Tests")
    print("=" * 50)
    
    tester = DiscussionBoardAPITester()
    
    # Test 1: Health Check
    print("\n📋 BASIC CONNECTIVITY TESTS")
    tester.test_health_check()
    
    # Test 2: Authentication Tests
    print("\n🔐 AUTHENTICATION TESTS")
    
    # Test default admin login
    admin_login_success, admin_response = tester.test_login("admin@example.com", "admin123")
    if not admin_login_success:
        print("❌ Critical: Default admin login failed. Cannot proceed with tests.")
        return 1
    
    # Test current user endpoint
    tester.test_get_current_user()
    
    # Test user registration
    test_user_email = f"testuser_{datetime.now().strftime('%H%M%S')}@example.com"
    user_reg_success, user_data = tester.test_register_user(
        "Test User", 
        test_user_email, 
        "testpass123",
        "+1234567890"
    )
    
    # Test 3: User Management Tests
    print("\n👥 USER MANAGEMENT TESTS")
    tester.test_get_users()
    tester.test_get_users(search="test")
    
    # Test 4: Topic Management Tests
    print("\n📝 TOPIC MANAGEMENT TESTS")
    
    # Create test topic
    topic_success, topic_data = tester.test_create_topic(
        "Test Discussion Topic",
        "This is a test topic for API testing"
    )
    
    if topic_success:
        topic_id = topic_data['id']
        
        # Test topic operations
        tester.test_get_topics()
        tester.test_get_topics(search="Test")
        tester.test_get_topics(my_topics=True)
        tester.test_get_topic_detail(topic_id)
        
        # Test topic membership
        if user_reg_success:
            # Login as test user to test subscription
            original_token = tester.token
            test_login_success, _ = tester.test_login(test_user_email, "testpass123")
            
            if test_login_success:
                tester.test_subscribe_to_topic(topic_id)
                tester.test_unsubscribe_from_topic(topic_id)
            
            # Switch back to admin
            tester.token = original_token
            
            # Test adding member as admin
            if user_data:
                tester.test_add_member_to_topic(topic_id, user_data['id'], "member")
    
    # Test 5: Task Management Tests
    print("\n✅ TASK MANAGEMENT TESTS")
    
    if topic_success:
        # Create test task
        task_success, task_data = tester.test_create_task(
            topic_id,
            "Test Task",
            "This is a test task for API testing",
            tester.user_id
        )
        
        if task_success:
            task_id = task_data['id']
            
            # Test task operations
            tester.test_get_my_tasks()
            tester.test_get_topic_tasks(topic_id)
            tester.test_update_task_status(task_id, "in_progress")
            tester.test_update_task_status(task_id, "completed")
            
            # Test task assignment
            if user_data:
                tester.test_assign_task_to_users(task_id, [user_data['id']])
    
    # Test 6: Swagger Documentation
    print("\n📚 DOCUMENTATION TESTS")
    tester.test_swagger_docs()
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure['test']}")
            print(f"   Endpoint: {failure['endpoint']}")
            if 'expected' in failure:
                print(f"   Expected: {failure['expected']}, Got: {failure['actual']}")
            if 'error' in failure:
                print(f"   Error: {failure['error']}")
    
    print(f"\n🎯 Created Resources:")
    print(f"   Users: {len(tester.created_resources['users'])}")
    print(f"   Topics: {len(tester.created_resources['topics'])}")
    print(f"   Tasks: {len(tester.created_resources['tasks'])}")
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())