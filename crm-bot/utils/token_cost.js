const TOKEN_PRICES = {
  anthropic: {
    'claude-opus-4-5':   { input: 15.00, output: 75.00 },
    'claude-sonnet-4-5': { input: 3.00,  output: 15.00 },
  },
  google: {
    'gemini-1.5-pro':    { input: 3.50,  output: 10.50 },
    'gemini-1.5-flash':  { input: 0.075, output: 0.30 },
  },
  openai: {
    'gpt-4o':            { input: 5.00,  output: 15.00 },
    'gpt-4o-mini':       { input: 0.15,  output: 0.60 },
  },
};

function calculateCost(provider, model, inputTokens, outputTokens) {
  const prices = TOKEN_PRICES[provider]?.[model];
  if (!prices) return 0;
  const inputCost  = (inputTokens  / 1_000_000) * prices.input;
  const outputCost = (outputTokens / 1_000_000) * prices.output;
  return parseFloat((inputCost + outputCost).toFixed(6));
}

module.exports = { calculateCost, TOKEN_PRICES };
