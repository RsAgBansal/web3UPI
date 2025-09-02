import subprocess
import json
import os
import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

# Load Telegram Bot Token from .env
from dotenv import load_dotenv
load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
LLM_SCRIPT_PATH = "llm.py"  # Adjust path if needed

logging.basicConfig(level=logging.INFO)

# --- Bot Handlers ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Welcome! Send me an instruction and I’ll generate code using the LLM.")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_input = update.message.text

    # Prepare the prompt to send to llm.py
    input_data = json.dumps({"prompt": user_input})

    try:
        # Run llm.py as a subprocess
        result = subprocess.run(
            ["python", LLM_SCRIPT_PATH],
            input=input_data.encode('utf-8'),
            capture_output=True,
            check=True
        )

        output = json.loads(result.stdout)

        if "response" in output:
            reply = f"🧠 *Generated Code:*\n```\n{output['response']}\n```"
            if output.get("context_chunks"):
                reply += f"\n\n📚 *Context Used:*\n```\n{output['context_chunks']}\n```"
        else:
            reply = f"⚠️ Error: {output.get('error', 'Unknown error occurred.')}"
    except subprocess.CalledProcessError as e:
        reply = f"❌ LLM process failed:\n{e.stderr.decode()}"
    except Exception as e:
        reply = f"⚠️ Unexpected error:\n{str(e)}"

    await update.message.reply_text(reply, parse_mode="Markdown")

# --- Main Entry Point ---

def main():
    if not TELEGRAM_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not set in environment.")
        return

    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    print("🤖 Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
