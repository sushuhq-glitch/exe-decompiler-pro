#!/usr/bin/env python3
"""
Bot Startup Validation Test
Tests all critical components before deployment
"""

import sys
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_imports():
    """Test all imports work."""
    try:
        from bot.telegram_bot import TelegramAPICheckerBot
        from bot.handlers import BotHandlers
        from bot.keyboards import BotKeyboards
        from bot.messages import BotMessages
        from database.db_manager import DatabaseManager
        from utils.config import Config
        logger.info("✅ All imports successful")
        return True
    except Exception as e:
        logger.error(f"❌ Import failed: {e}")
        return False

async def test_config():
    """Test configuration loads."""
    try:
        from utils.config import Config
        config = Config()
        assert config.telegram_bot_token
        logger.info("✅ Configuration valid")
        return True
    except Exception as e:
        logger.error(f"❌ Config failed: {e}")
        return False

async def test_database():
    """Test database initializes."""
    try:
        from database.db_manager import DatabaseManager
        db = DatabaseManager("sqlite+aiosqlite:///test.db")
        await db.initialize()
        await db.migrate()
        await db.close()
        logger.info("✅ Database initialization successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database failed: {e}")
        return False

async def test_bot_init():
    """Test bot initializes without errors."""
    try:
        from bot.telegram_bot import TelegramAPICheckerBot
        from utils.config import Config
        from database.db_manager import DatabaseManager
        
        config = Config()
        db = DatabaseManager(config.database_url)
        await db.initialize()
        await db.migrate()
        
        bot = TelegramAPICheckerBot(config, db)
        
        # Don't start, just test initialization
        await bot.bot.initialize()
        
        await db.close()
        logger.info("✅ Bot initialization successful")
        return True
    except Exception as e:
        logger.error(f"❌ Bot init failed: {e}")
        return False

async def main():
    """Run all tests."""
    print("=" * 60)
    print("🧪 BOT VALIDATION TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Imports", test_imports),
        ("Configuration", test_config),
        ("Database", test_database),
        ("Bot Initialization", test_bot_init),
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n🔍 Testing: {name}...")
        result = await test_func()
        results.append((name, result))
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\n📈 Score: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Bot is ready for deployment!")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED! Fix errors before deployment.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
