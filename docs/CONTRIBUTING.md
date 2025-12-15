# Contributing to Telegram API Checker Bot

## Welcome!
We're excited that you're interested in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community

## How to Contribute

### Reporting Bugs
1. Check if the bug already exists in Issues
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information

### Suggesting Features
1. Open an issue with "Feature Request" label
2. Describe the feature and use case
3. Explain why it would be valuable

### Pull Requests
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit pull request

## Development Setup

```bash
git clone https://github.com/your-repo/telegram-api-checker-bot.git
cd telegram-api-checker-bot
pip install -r requirements.txt
pip install -e ".[dev]"
```

## Coding Standards
- Follow PEP 8 style guide
- Use type hints
- Write docstrings
- Add unit tests
- Keep functions focused

## Testing
```bash
pytest tests/
pytest --cov
```

## Documentation
- Update README if needed
- Add docstrings to new functions
- Update relevant .md files

## Commit Messages
Format: `type: description`

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- test: Tests
- refactor: Code refactoring

## Review Process
1. Code review by maintainers
2. CI/CD checks must pass
3. At least one approval required
4. Maintainer merges

## Questions?
- Open a discussion on GitHub
- Join our community chat
- Email: support@example.com

Thank you for contributing!
