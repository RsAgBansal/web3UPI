import asyncio
import logging
import os
import json
import requests
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Load environment variables
load_dotenv()

# Configuration
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000/api/chat')

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN environment variable is not set")

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

class MindUnitsBot:
    def __init__(self):
        self.backend_url = BACKEND_URL
        # Dictionary to track user request counts {user_id: count}
        self.user_request_counts = {}
        self.max_requests = 5
        
    def check_request_limit(self, user_id: int) -> tuple[bool, int]:
        """Check if user has exceeded request limit. Returns (can_proceed, remaining_requests)"""
        current_count = self.user_request_counts.get(user_id, 0)
        remaining = self.max_requests - current_count
        
        if current_count >= self.max_requests:
            return False, 0
        
        return True, remaining
    
    def increment_request_count(self, user_id: int) -> int:
        """Increment user request count and return new count"""
        current_count = self.user_request_counts.get(user_id, 0)
        new_count = current_count + 1
        self.user_request_counts[user_id] = new_count
        return new_count
        
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /start command"""
        welcome_message = """
🚀 Welcome to MindUnits AI Assistant!

I'm your personal Solidity smart contract assistant powered by AI and RAG technology.

⚡ **Request Limit: 5 queries per session**

💡 **What I can do:**
• Create smart contracts (ERC20, NFT, DeFi, etc.)
• Explain existing code
• Help with blockchain transactions
• Generate Solidity code from natural language

📝 **Commands:**
• /start - Start the bot
• /help - Show help message
• /status - Check backend status
• /remaining - Check remaining requests
• /examples - Show example queries

**Just type your request in natural language!**

**Examples:**
• "Create an ERC20 token contract"
• "Transfer 1 ETH to address 0x123..."
• "Explain what this contract does"
• "Deploy a voting contract"

Let's build some amazing Web3 projects together! 🔥
        """
        await update.message.reply_text(welcome_message)

    async def remaining_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show remaining requests for the user"""
        user_id = update.effective_user.id
        can_proceed, remaining = self.check_request_limit(user_id)
        current_count = self.user_request_counts.get(user_id, 0)
        
        if can_proceed:
            await update.message.reply_text(
                f"📊 **Request Status:**\n"
                f"• Used: {current_count}/{self.max_requests}\n"
                f"• Remaining: {remaining} requests\n\n"
                f"💡 Each message you send counts as one request."
            )
        else:
            await update.message.reply_text(
                f"⚠️ **Request Limit Reached**\n\n"
                f"You've used all {self.max_requests} requests for this session.\n"
                f"Please restart the bot with /start to get a new session."
            )

    async def reset_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Reset user's request count (admin feature)"""
        user_id = update.effective_user.id
        self.user_request_counts[user_id] = 0
        await update.message.reply_text(
            f"🔄 **Request count reset!**\n\n"
            f"You now have {self.max_requests} fresh requests."
        )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /help command"""
        help_message = """
🆘 **MindUnits AI Assistant Help**

**Available Commands:**
• /start - Show welcome message
• /help - Show this help message
• /status - Check backend connection
• /examples - Show example queries

**How to interact:**
Just send me any message about Solidity or blockchain!

**Example queries:**
• "Create a token contract with 1000 supply"
• "How do I transfer tokens?"
• "Deploy a multisig wallet"
• "What's the balance of 0x123...?"

**Need more help?** Visit our documentation or contact support.
        """
        await update.message.reply_text(help_message)

    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Check backend status"""
        try:
            response = requests.get(f"{self.backend_url}/api/health", timeout=5)
            if response.status_code == 200:
                await update.message.reply_text("✅ Backend is healthy and ready!")
            else:
                await update.message.reply_text(f"⚠️ Backend responded with status {response.status_code}")
        except requests.exceptions.RequestException as e:
            await update.message.reply_text(f"❌ Backend is unreachable: {str(e)}")

    async def examples_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show example queries"""
        examples_message = """
💡 **Example Queries You Can Try:**

**Smart Contract Creation:**
• "Create an ERC20 token with name MyToken"
• "Generate a simple voting contract"
• "Build a multisig wallet contract"

**Blockchain Operations:**
• "Transfer 0.5 ETH to 0x742d35Cc..."
• "Check balance of address 0x123..."
• "Deploy my contract to mainnet"

**Code Explanation:**
• "Explain what this contract does: [paste code]"
• "How does this function work?"
• "What are the security issues here?"

**Learning & Help:**
• "How do I prevent reentrancy attacks?"
• "Best practices for gas optimization"
• "Difference between view and pure functions"

Just copy any of these or ask in your own words! 🎯
        """
        await update.message.reply_text(examples_message)

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle regular messages and send to LLM"""
        user_message = update.message.text
        user_id = update.effective_user.id
        username = update.effective_user.username or "Unknown"
        
        logger.info(f"User {username} ({user_id}): {user_message}")
        
        # Check request limit before processing
        can_proceed, remaining = self.check_request_limit(user_id)
        
        if not can_proceed:
            limit_message = f"""
⚠️ **Request Limit Reached**

You've used all {self.max_requests} requests for this session.

🔄 **Options:**
• Use /start to reset your session
• Use /reset to clear your request count
• Come back later for a fresh start

Current usage: {self.user_request_counts.get(user_id, 0)}/{self.max_requests}
            """
            await update.message.reply_text(limit_message)
            return
        
        # Increment request count since we're processing
        current_count = self.increment_request_count(user_id)
        remaining_after = self.max_requests - current_count
        
        # Send typing indicator
        await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
        
        try:
            # Call your backend API
            response = requests.post(
                f"{self.backend_url}/api/chat",
                json={"message": user_message},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    # Format the response for Telegram
                    reply_text = "🤖 **AI Response:**\n\n"
                    
                    # Add the main response
                    llm_response = data.get("response", "")
                    if llm_response:
                        reply_text += f"```json\n{llm_response}\n```\n\n"
                    
                    # Add context if available
                    context_chunks = data.get("context_chunks", "")
                    if context_chunks:
                        reply_text += f"📚 **Context Used:**\n{context_chunks[:500]}...\n\n"
                    
                    # Add request counter info
                    reply_text += f"📊 **Requests:** {current_count}/{self.max_requests} used ({remaining_after} remaining)"
                    
                    # Split long messages
                    if len(reply_text) > 4000:
                        # Send in parts
                        await update.message.reply_text(
                            f"🤖 **AI Response:**\n\n```json\n{llm_response}\n```\n\n📊 **Requests:** {current_count}/{self.max_requests} used ({remaining_after} remaining)",
                            parse_mode='Markdown'
                        )
                        if context_chunks:
                            await update.message.reply_text(
                                f"📚 **Context Used:**\n{context_chunks[:1000]}",
                                parse_mode='Markdown'
                            )
                    else:
                        await update.message.reply_text(reply_text, parse_mode='Markdown')
                        
                else:
                    error_msg = data.get("error", "Unknown error occurred")
                    await update.message.reply_text(f"❌ Error: {error_msg}\n\n📊 **Requests:** {current_count}/{self.max_requests} used ({remaining_after} remaining)")
                    
            else:
                await update.message.reply_text(
                    f"❌ Backend error: HTTP {response.status_code}\n"
                    f"Make sure the backend server is running on {self.backend_url}"
                )
                
        except requests.exceptions.Timeout:
            await update.message.reply_text(
                "⏱️ Request timed out. Your query might be too complex or the backend is busy. Please try again."
            )
        except requests.exceptions.RequestException as e:
            await update.message.reply_text(
                f"❌ Connection error: {str(e)}\n"
                f"Make sure the backend server is running on {self.backend_url}"
            )
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            await update.message.reply_text(
                f"❌ An unexpected error occurred: {str(e)}"
            )

    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle errors"""
        logger.warning('Update "%s" caused error "%s"', update, context.error)

def main() -> None:
    """Start the bot"""
    print("🚀 Starting MindUnits Telegram Bot...")
    print(f"🔗 Backend URL: {BACKEND_URL}")
    print(f"🤖 Bot Token: {TELEGRAM_BOT_TOKEN[:10]}...")
    
    # Create the bot instance
    bot = MindUnitsBot()
    
    # Create the Application
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Add handlers
    application.add_handler(CommandHandler("start", bot.start_command))
    application.add_handler(CommandHandler("help", bot.help_command))
    application.add_handler(CommandHandler("status", bot.status_command))
    application.add_handler(CommandHandler("examples", bot.examples_command))
    application.add_handler(CommandHandler("remaining", bot.remaining_command))
    application.add_handler(CommandHandler("reset", bot.reset_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, bot.handle_message))
    
    # Add error handler
    application.add_error_handler(bot.error_handler)

    # Run the bot
    print("✅ Bot is running! Send /start to begin.")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
