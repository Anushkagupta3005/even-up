const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const Groq = require('groq-sdk');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Store uploads in memory (no disk needed — we pass the buffer straight to Tesseract)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const RECEIPT_PROMPT = `You are a receipt parser. You will receive raw OCR text extracted from a receipt photo. The OCR text is often messy, misspelled, garbled, or incomplete. Your job is to extract structured data from it.

IMPORTANT RULES:
1. **Merchant/store name**: This is usually the FIRST line or the large header text at the top. It is NOT a purchased item. Common patterns:
   - Store name, branch, or franchise name (e.g. "STARBUCKS #12345", "Domino's Pizza", "Big Bazaar")
   - Sometimes the OCR garbles it — try to reconstruct the most likely store name
   - If you truly cannot identify any merchant name, set merchant to "Unknown"

2. **Line items**: These are things that were PURCHASED — food, drinks, products, services. Each has a name and a price.
   - Do NOT include the merchant/store name as a line item
   - Do NOT include subtotals, totals, tax lines, service charges, tips, discounts, or payment method lines as items
   - If an item name is garbled/partial, clean it up to the best readable version
   - If a quantity is mentioned (e.g. "2 x Latte ₹350"), keep it as one item with the total price for that line (₹350), not the unit price

3. **Total**: The final amount paid. Look for keywords like "TOTAL", "GRAND TOTAL", "NET AMOUNT", "AMOUNT DUE", "PAYABLE". 
   - Use the LARGEST total if multiple totals appear (subtotal vs grand total)
   - If no total is found, sum up the line items yourself

4. **Tax/fees**: Extract tax, service charge, GST, VAT, CGST, SGST if present. These are SEPARATE from line items.

5. **Date**: Look for any date pattern (DD/MM/YYYY, MM-DD-YYYY, "Sep 11, 2026", etc). Return in YYYY-MM-DD format. If no date found, set to null.

6. **Currency**: Detect from symbols (₹, $, €, £) or text (INR, USD, Rs, Rs.). Default to "INR" if unclear.

Respond with ONLY valid JSON, no markdown backticks, no explanation. Use this exact structure:
{
  "merchant": "Store Name",
  "date": "YYYY-MM-DD or null",
  "currency": "INR",
  "items": [
    { "name": "Item name", "amount": 123.45 },
    { "name": "Another item", "amount": 67.00 }
  ],
  "tax": 0,
  "service_charge": 0,
  "total": 190.45,
  "confidence": "high | medium | low",
  "notes": "Any issues or assumptions you made (e.g. 'merchant name was garbled, best guess', 'no date found on receipt')"
}

If the OCR text is completely unreadable garbage, return:
{
  "merchant": "Unknown",
  "date": null,
  "currency": "INR",
  "items": [],
  "tax": 0,
  "service_charge": 0,
  "total": 0,
  "confidence": "low",
  "notes": "OCR text was too garbled to extract meaningful data"
}`;

// POST /api/receipts/parse — upload a receipt image, get structured data back
router.post('/parse', requireAuth, upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded. Send a file with field name "receipt".' });
  }

  try {
    // Stage 1: OCR — extract raw text from the image
    const { data: { text: rawText } } = await Tesseract.recognize(
      req.file.buffer,
      'eng', // language — works for English + most Latin-script text; Hindi receipts mostly use English for amounts
      { logger: () => {} } // suppress progress logs
    );

    if (!rawText || rawText.trim().length < 5) {
      return res.status(422).json({
        error: 'Could not read any text from this image. Try a clearer photo.',
        raw_text: rawText || '',
      });
    }

    // Stage 2: LLM — structure the raw text into JSON
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      // Fallback: return raw text without structuring if no Groq key
      return res.json({
        raw_text: rawText,
        structured: null,
        message: 'GROQ_API_KEY not set — returning raw OCR text only',
      });
    }

    const groq = new Groq({ apiKey: groqKey });

    const chatCompletion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: RECEIPT_PROMPT },
        { role: 'user', content: `Here is the raw OCR text from a receipt photo:\n\n---\n${rawText}\n---\n\nExtract the structured receipt data as JSON.` },
      ],
      temperature: 0.1, // low temp for deterministic extraction
      max_tokens: 1024,
    });

    const llmResponse = chatCompletion.choices[0]?.message?.content || '';

    // Parse the LLM's JSON response
    let structured;
    try {
      const cleaned = llmResponse.replace(/```json\s*|```\s*/g, '').trim();
      structured = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.json({
        raw_text: rawText,
        structured: null,
        llm_response: llmResponse,
        message: 'LLM returned invalid JSON — raw text and LLM response included for debugging',
      });
    }

    res.json({
      raw_text: rawText,
      structured,
    });

  } catch (err) {
    console.error('Receipt parse error:', err);
    res.status(500).json({ error: 'Failed to process receipt', details: err.message });
  }
});

module.exports = router;