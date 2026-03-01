"""
Backend API Tests for Quality Features (Phase 4)
Tests: Production logging with rejection tracking, Quality metrics calculation
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://scheduling-engine.preview.emergentagent.com')

class TestSetup:
    """Setup helpers for creating test data"""
    
    @staticmethod
    def register_user(session):
        """Register a unique test user and return token"""
        email = f"test_quality_{int(time.time())}@test.com"
        password = "TestPass123!"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Quality Test User"
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token"), email, password
        
        return None, email, password
    
    @staticmethod
    def create_work_center(session, token):
        """Create a test work center"""
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        wc_data = {
            "id": f"wc_test_{int(time.time())}",
            "name": "Test Machine",
            "capacity_hours": 8,
            "shifts": [{"name": "Day", "start_time": "06:00", "end_time": "14:00"}],
            "working_days": [1, 2, 3, 4, 5],
            "calendar": []
        }
        
        response = session.post(f"{BASE_URL}/api/data/work-centers", json=wc_data)
        if response.status_code == 200:
            return response.json()
        return wc_data
    
    @staticmethod
    def create_order(session, token, wc_id):
        """Create a test order"""
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        order_data = {
            "id": f"order_test_{int(time.time())}",
            "customer": "Quality Test Customer",
            "part_number": f"QTY-TEST-{int(time.time()) % 10000}",
            "original_quantity": 100,
            "available_stock": 0,
            "net_required_quantity": 100,
            "quantity": 100,
            "priority": 2,
            "start_date": time.strftime("%Y-%m-%d"),
            "due_date": time.strftime("%Y-%m-%dT00:00:00.000Z"),
            "status": "PLANNED",
            "routing": [{
                "sequence_number": 1,
                "work_center_id": wc_id,
                "cycle_time_minutes": 1,
                "setup_time_hours": 0
            }]
        }
        
        response = session.post(f"{BASE_URL}/api/data/orders", json=order_data)
        if response.status_code == 200:
            return response.json()
        return order_data


class TestProductionLogRejection:
    """Test production logging with rejection tracking"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Register user
        self.token, self.email, self.password = TestSetup.register_user(self.session)
        if not self.token:
            pytest.skip("Failed to register test user")
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Create work center
        self.wc = TestSetup.create_work_center(self.session, self.token)
        
        # Create order
        self.order = TestSetup.create_order(self.session, self.token, self.wc.get("id"))
        
        yield
        
        # Cleanup is handled automatically by user isolation
    
    def test_create_production_log_with_rejection(self):
        """Test creating production log with quantity_rejected field"""
        log_data = {
            "order_id": self.order["id"],
            "part_number": self.order["part_number"],
            "date": time.strftime("%Y-%m-%d"),
            "quantity_produced": 50,
            "quantity_rejected": 5  # 10% rejection rate
        }
        
        response = self.session.post(f"{BASE_URL}/api/data/production", json=log_data)
        
        assert response.status_code == 200, f"Failed to create production log: {response.text}"
        
        data = response.json()
        assert data["quantity_produced"] == 50
        assert data["quantity_rejected"] == 5
        assert data["order_id"] == self.order["id"]
        print(f"SUCCESS: Created production log with rejection - Produced: 50, Rejected: 5")
    
    def test_reject_negative_quantity(self):
        """Test that negative rejection quantity is rejected"""
        log_data = {
            "order_id": self.order["id"],
            "part_number": self.order["part_number"],
            "date": time.strftime("%Y-%m-%d"),
            "quantity_produced": 50,
            "quantity_rejected": -5  # Invalid negative value
        }
        
        response = self.session.post(f"{BASE_URL}/api/data/production", json=log_data)
        
        # Should fail validation
        assert response.status_code == 422, f"Should reject negative rejection: {response.status_code}"
        print("SUCCESS: Negative rejection quantity correctly rejected")
    
    def test_reject_rejection_exceeding_produced(self):
        """Test that rejection cannot exceed produced quantity"""
        log_data = {
            "order_id": self.order["id"],
            "part_number": self.order["part_number"],
            "date": time.strftime("%Y-%m-%d"),
            "quantity_produced": 50,
            "quantity_rejected": 60  # Invalid: exceeds produced
        }
        
        response = self.session.post(f"{BASE_URL}/api/data/production", json=log_data)
        
        # Should fail validation
        assert response.status_code == 422, f"Should reject rejection > produced: {response.status_code}"
        print("SUCCESS: Rejection exceeding produced quantity correctly rejected")
    
    def test_production_without_rejection(self):
        """Test creating production log without rejection (optional field)"""
        log_data = {
            "order_id": self.order["id"],
            "part_number": self.order["part_number"],
            "date": time.strftime("%Y-%m-%d"),
            "quantity_produced": 30
            # quantity_rejected not provided - should default to 0
        }
        
        response = self.session.post(f"{BASE_URL}/api/data/production", json=log_data)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["quantity_rejected"] == 0, "Rejection should default to 0"
        print("SUCCESS: Production log created without rejection (defaults to 0)")


class TestProductionLogCRUD:
    """Test full CRUD operations for production logs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session and user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Register user
        self.token, self.email, self.password = TestSetup.register_user(self.session)
        if not self.token:
            pytest.skip("Failed to register test user")
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Create work center
        self.wc = TestSetup.create_work_center(self.session, self.token)
        
        # Create order
        self.order = TestSetup.create_order(self.session, self.token, self.wc.get("id"))
        
        yield
    
    def test_get_production_logs(self):
        """Test getting production logs list"""
        response = self.session.get(f"{BASE_URL}/api/data/production")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("SUCCESS: GET /api/data/production returns list")
    
    def test_update_production_log_rejection(self):
        """Test updating rejection quantity in existing log"""
        # First create a log
        log_data = {
            "order_id": self.order["id"],
            "part_number": self.order["part_number"],
            "date": time.strftime("%Y-%m-%d"),
            "quantity_produced": 40,
            "quantity_rejected": 2
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/data/production", json=log_data)
        assert create_response.status_code == 200
        
        created_log = create_response.json()
        log_id = created_log["id"]
        
        # Update rejection quantity
        update_response = self.session.put(f"{BASE_URL}/api/data/production/{log_id}", json={
            "quantity_rejected": 5
        })
        
        assert update_response.status_code == 200
        updated_log = update_response.json()
        assert updated_log["quantity_rejected"] == 5
        print("SUCCESS: Updated production log rejection quantity")
    
    def test_delete_production_log(self):
        """Test deleting production log"""
        # First create a log
        log_data = {
            "order_id": self.order["id"],
            "part_number": self.order["part_number"],
            "date": time.strftime("%Y-%m-%d"),
            "quantity_produced": 20,
            "quantity_rejected": 1
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/data/production", json=log_data)
        if create_response.status_code != 200:
            pytest.skip("Could not create log to delete (may already exist for date)")
        
        created_log = create_response.json()
        log_id = created_log["id"]
        
        # Delete the log
        delete_response = self.session.delete(f"{BASE_URL}/api/data/production/{log_id}")
        
        assert delete_response.status_code == 200
        print("SUCCESS: Deleted production log")


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_register_endpoint(self):
        """Test user registration"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        email = f"auth_test_{int(time.time())}@test.com"
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPass123!",
            "full_name": "Auth Test User"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print(f"SUCCESS: User registered - {email}")
    
    def test_login_endpoint(self):
        """Test user login"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # First register
        email = f"login_test_{int(time.time())}@test.com"
        password = "TestPass123!"
        
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Login Test User"
        })
        
        if reg_response.status_code != 200:
            pytest.skip("Registration failed")
        
        # Then login
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        
        assert login_response.status_code == 200
        data = login_response.json()
        assert "access_token" in data
        print("SUCCESS: Login successful")


class TestDataEndpoints:
    """Test data endpoints (orders, work centers)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        self.token, self.email, self.password = TestSetup.register_user(self.session)
        if not self.token:
            pytest.skip("Failed to register test user")
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        yield
    
    def test_get_orders(self):
        """Test getting orders list"""
        response = self.session.get(f"{BASE_URL}/api/data/orders")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("SUCCESS: GET /api/data/orders returns list")
    
    def test_get_work_centers(self):
        """Test getting work centers list"""
        response = self.session.get(f"{BASE_URL}/api/data/work-centers")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("SUCCESS: GET /api/data/work-centers returns list")
    
    def test_get_parts(self):
        """Test getting parts list"""
        response = self.session.get(f"{BASE_URL}/api/data/parts")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("SUCCESS: GET /api/data/parts returns list")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
