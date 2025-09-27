import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Web scraper endpoint
router.post('/scrape', optionalAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }
    
    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract metadata
    const result = {
      url,
      title: $('title').text() || '',
      meta: {
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        author: $('meta[name="author"]').attr('content') || ''
      },
      openGraph: {
        title: $('meta[property="og:title"]').attr('content') || '',
        description: $('meta[property="og:description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
        url: $('meta[property="og:url"]').attr('content') || ''
      },
      links: []
    };
    
    // Extract links (max 20)
    $('a').slice(0, 20).each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      if (href && text) {
        result.links.push({ href, text });
      }
    });
    
    res.json({ result });
  } catch (error) {
    console.error('Scraper error:', error);
    res.status(500).json({ error: 'Failed to scrape URL' });
  }
});

export default router;