// LLM Client Configuration

// Google Gemini client
client<llm> Gemini {
  provider google-ai
  options {
    model "gemini-2.5-flash"
    api_key env.GEMINI_API_KEY
    // Gemini doesn't support direct https URLs, convert to base64
    media_url_handler {
      pdf "send_base64"
      image "send_base64"
    }
  }
}

client<llm> VercelClient {
  provider "openai-generic"
  options {
    base_url "https://ai-gateway.vercel.sh/v1"
    api_key env.AI_GATEWAY_API_KEY
    model "alibaba/qwen3-next-80b-a3b-instruct"
    }
}

// Backup client - Gemini Pro (for more complex tasks)
client<llm> GeminiPro {
  provider google-ai
  options {
    model "gemini-2.5-pro"
    api_key env.GEMINI_API_KEY
    // Gemini doesn't support direct https URLs, convert to base64
    media_url_handler {
      pdf "send_base64"
      image "send_base64"
    }
  }
}
