# PowerShell script to test LLM quickly
param(
    [Parameter(Mandatory=$true)]
    [string]$Prompt
)

$jsonInput = @{
    prompt = $Prompt
} | ConvertTo-Json -Compress

$jsonInput | python llm.py
