#!/usr/bin/env python3
"""
Setup script for ULTRA API HUNTER v3.0
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="ultra-api-hunter",
    version="3.0.0",
    author="@teoo6232-eng",
    description="The Most Advanced API Discovery & Security Testing Tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/sushuhq-glitch/exe-decompiler-pro",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Intended Audience :: Information Technology",
        "Topic :: Security",
        "Topic :: Software Development :: Testing",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "api-hunter=main:main",
        ],
    },
    keywords="api security testing pentesting osint discovery",
)
