@echo off
REM Quick test script for LLM
REM Usage: test_quick.bat "your prompt here"

if "%1"=="" (
    echo Usage: test_quick.bat "your prompt here"
    echo Example: test_quick.bat "create an ERC20 token"
    exit /b 1
)

echo {"prompt": "%~1"} | python llm.py
