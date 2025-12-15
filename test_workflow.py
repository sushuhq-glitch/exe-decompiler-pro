#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Workflow Script
===================

Quick test to verify all components are properly integrated and importable.

Author: Telegram API Checker Bot Team
"""

import sys
from pathlib import Path

def test_imports():
    """Test that all new modules can be imported."""
    print("🔍 Testing imports...")
    
    try:
        # Core config
        print("  ✓ Importing config...")
        from bot_config import Config
        
        # Bot components
        print("  ✓ Importing bot components...")
        from bot.keyboards import BotKeyboards
        from bot.states import ConversationStates
        from bot.handlers import BotHandlers
        
        # Analyzer
        print("  ✓ Importing analyzer...")
        from analyzer.form_detector import FormDetector
        
        # Interceptor
        print("  ✓ Importing interceptor...")
        from interceptor.network_interceptor import NetworkInterceptor
        
        # Validator
        print("  ✓ Importing validator...")
        from validator.credential_validator import CredentialValidator
        
        # Discovery
        print("  ✓ Importing discovery...")
        from discovery.api_discovery import APIDiscovery
        
        # Generator
        print("  ✓ Importing generator...")
        from generator.checker_generator import CheckerGenerator
        
        print("✅ All imports successful!")
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_config():
    """Test configuration."""
    print("\n🔍 Testing configuration...")
    
    try:
        from bot_config import Config
        
        config = Config()
        
        # Check required attributes
        assert hasattr(config, 'TELEGRAM_BOT_TOKEN'), "Missing TELEGRAM_BOT_TOKEN"
        assert hasattr(config, 'COMMON_ENDPOINTS'), "Missing COMMON_ENDPOINTS"
        assert hasattr(config, 'TEST_EMAIL'), "Missing TEST_EMAIL"
        assert hasattr(config, 'TEST_PASSWORD'), "Missing TEST_PASSWORD"
        
        print(f"  ✓ Bot token configured: {config.TELEGRAM_BOT_TOKEN[:20]}...")
        print(f"  ✓ Test credentials: {config.TEST_EMAIL} / {config.TEST_PASSWORD}")
        print(f"  ✓ Common endpoints: {len(config.COMMON_ENDPOINTS)} endpoints")
        
        print("✅ Configuration test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_components():
    """Test component initialization."""
    print("\n🔍 Testing component initialization...")
    
    try:
        from validator.credential_validator import CredentialValidator
        from discovery.api_discovery import APIDiscovery
        from generator.checker_generator import CheckerGenerator
        
        # Test validator
        validator = CredentialValidator()
        print("  ✓ CredentialValidator initialized")
        
        # Test parse_credentials
        email, password = validator.parse_credentials("test@example.com:password123")
        assert email == "test@example.com", "Email parsing failed"
        assert password == "password123", "Password parsing failed"
        print("  ✓ Credential parsing works")
        
        # Test API discovery
        discovery = APIDiscovery()
        print("  ✓ APIDiscovery initialized")
        
        # Test checker generator
        generator = CheckerGenerator()
        print("  ✓ CheckerGenerator initialized")
        
        print("✅ Component initialization test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Component test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_checker_generation():
    """Test checker generation (without actual API data)."""
    print("\n🔍 Testing checker generation...")
    
    try:
        import asyncio
        from generator.checker_generator import CheckerGenerator
        from pathlib import Path
        import tempfile
        
        # Create test data
        test_api_data = {
            'url': 'https://api.example.com/auth/login',
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            'payload': {
                'email': 'test@example.com',
                'password': 'password'
            }
        }
        
        test_endpoints = [
            {
                'url': 'https://api.example.com/user/profile',
                'method': 'GET',
                'type': 'profile',
                'status_code': 200
            },
            {
                'url': 'https://api.example.com/user/orders',
                'method': 'GET',
                'type': 'orders',
                'status_code': 200
            }
        ]
        
        # Create temporary output directory
        temp_dir = Path(tempfile.mkdtemp())
        
        # Initialize generator with temp directory
        generator = CheckerGenerator(output_dir=temp_dir)
        
        # Generate checker
        async def run_test():
            files = await generator.generate_checker(
                site_name='example.com',
                api_data=test_api_data,
                endpoints=test_endpoints,
                user_id=12345
            )
            return files
        
        files = asyncio.run(run_test())
        
        # Verify files were created
        assert 'checker.py' in files, "checker.py not generated"
        assert 'requirements.txt' in files, "requirements.txt not generated"
        assert 'README.md' in files, "README.md not generated"
        assert 'config.json' in files, "config.json not generated"
        assert 'zip' in files, "ZIP file not generated"
        
        # Verify files exist
        for name, path in files.items():
            if name != 'zip':  # Skip zip verification
                assert Path(path).exists(), f"{name} file doesn't exist"
                print(f"  ✓ {name} generated")
        
        # Check ZIP file
        zip_path = Path(files['zip'])
        assert zip_path.exists(), "ZIP file doesn't exist"
        assert zip_path.stat().st_size > 0, "ZIP file is empty"
        print(f"  ✓ ZIP file generated ({zip_path.stat().st_size} bytes)")
        
        # Read and check checker.py content
        with open(files['checker.py'], 'r', encoding='utf-8') as f:
            checker_content = f.read()
            assert 'multi-threading' in checker_content.lower(), "No multi-threading mention"
            assert 'colorama' in checker_content.lower(), "No colorama import"
            assert 'tqdm' in checker_content.lower(), "No tqdm import"
            assert 'encoding=\'utf-8\'' in checker_content, "No UTF-8 encoding"
            print(f"  ✓ checker.py has all required features ({len(checker_content)} chars)")
        
        print("✅ Checker generation test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Checker generation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("🧪 TELEGRAM BOT WORKFLOW TEST")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Imports", test_imports()))
    results.append(("Configuration", test_config()))
    results.append(("Components", test_components()))
    results.append(("Checker Generation", test_checker_generation()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {name}")
    
    print("=" * 60)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 All tests passed! The bot is ready to use.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
