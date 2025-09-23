// quotes.js

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1EmUAze1H8TymkyiCWa4PQONvK4srA49z69OMDVG7RuY/gviz/tq?tqx=out:csv";
let quotes = [];

// Simple CSV to array parser
function parseCSV(text) {
  const lines = text.trim().split('\n');
  lines.shift(); // Remove header row

  return lines.map(line => {
    // Split so that only the last column is author, everything before is the quote
    const parts = line.split(',');
    if (parts.length < 2) return { quote: line.trim(), author: "" };
    let author = parts.pop().trim();
    let quote = parts.join(',').trim();

    // Remove leading/trailing quotes ONLY (not inside)
    author = author.replace(/^"|"$/g, '');
    quote = quote.replace(/^"|"$/g, '');

    return { quote, author };
  });
}


// Fetch quotes on load
async function fetchQuotes() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    const csv = await res.text();
    quotes = parseCSV(csv).filter(q => q.quote); // skip blanks
    displayRandomQuote();
  } catch (e) {
    document.getElementById('quote-text').textContent = "Failed to load quotes.";
  }
}

// Display a random quote
function displayRandomQuote() {
  if (!quotes.length) return;
  const idx = Math.floor(Math.random() * quotes.length);
  const q = quotes[idx];
  const quoteText = document.getElementById('quote-text');
  const quoteAuthor = document.getElementById('quote-author');

  // Reset font size to CSS clamp default before fitting
  quoteText.style.fontSize = "";
  quoteText.textContent = q.quote;
  quoteAuthor.textContent = q.author ? `— ${q.author}` : "";

  // Fit after DOM is rendered (double setTimeout is super reliable)
  setTimeout(fitQuoteText, 0);
}

function fitQuoteText() {
  const quoteText = document.getElementById('quote-text');
  const quoteBlock = document.getElementById('quote-block');
  quoteText.style.fontSize = ""; // reset

  // Get computed style for block's inner height/width minus padding
  const blockStyles = getComputedStyle(quoteBlock);
  const paddingY = parseFloat(blockStyles.paddingTop) + parseFloat(blockStyles.paddingBottom);
  const paddingX = parseFloat(blockStyles.paddingLeft) + parseFloat(blockStyles.paddingRight);

  const maxHeight = quoteBlock.clientHeight - paddingY;
  const maxWidth = quoteBlock.clientWidth - paddingX;

  // Wait for DOM update
  setTimeout(() => {
    let fontSize = parseFloat(getComputedStyle(quoteText).fontSize);
    const minFontPx = 14;

    // Shrink until it fits, or until min font size
    while (
      (quoteText.scrollHeight > maxHeight || quoteText.scrollWidth > maxWidth) &&
      fontSize > minFontPx
    ) {
      fontSize -= 1;
      quoteText.style.fontSize = fontSize + "px";
    }
  }, 0);
}


document.getElementById('random-btn').addEventListener('click', displayRandomQuote);


// Copy to clipboard
document.getElementById('copy-btn').addEventListener('click', () => {
  const text = document.getElementById('quote-text').textContent + "\n" + document.getElementById('quote-author').textContent;
  navigator.clipboard.writeText(text);
});

// Save as image (placeholder, add html2canvas or dom-to-image later)
// Save as image
document.getElementById('save-btn').addEventListener('click', saveQuoteImage);

async function saveQuoteImage() {
  const block = document.getElementById('quote-block');

  // Ensure fonts & last layout pass are ready
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
  }
  await new Promise(r => requestAnimationFrame(r));

  // Show export-only bg & solid base (no transparency)
  document.body.classList.add('is-exporting');

  // Give the browser a tick to paint the class change
  await new Promise(r => setTimeout(r, 20));

  try {
    const canvas = await html2canvas(block, {
      backgroundColor: '#fafaf9',     // solid base behind any alpha
      scale: Math.min(3, (window.devicePixelRatio || 2)),
      useCORS: true,
      removeContainer: true
    });

    const link = document.createElement('a');
    link.download = 'quote.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    // Always restore live state
    document.body.classList.remove('is-exporting');
  }
}




// Init
fetchQuotes();
