const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3001;

// Function to sanitize filenames by replacing special characters
function sanitizeFilename(filename) {
  // Replace special characters with safe alternatives
  const replacements = {
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'à': 'a', 'â': 'a', 'ä': 'a', 'á': 'a', 'ã': 'a',
    'ù': 'u', 'û': 'u', 'ü': 'u', 'ú': 'u',
    'ì': 'i', 'î': 'i', 'ï': 'i', 'í': 'i',
    'ò': 'o', 'ô': 'o', 'ö': 'o', 'ó': 'o', 'õ': 'o',
    'ñ': 'n', 'ç': 'c',
    'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'À': 'A', 'Â': 'A', 'Ä': 'A', 'Á': 'A', 'Ã': 'A',
    'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'Ú': 'U',
    'Ì': 'I', 'Î': 'I', 'Ï': 'I', 'Í': 'I',
    'Ò': 'O', 'Ô': 'O', 'Ö': 'O', 'Ó': 'O', 'Õ': 'O',
    'Ñ': 'N', 'Ç': 'C',
    ' ': '_', // Replace spaces with underscores
    '&': 'and',
    '#': 'hash',
    '%': 'percent',
    '+': 'plus',
    '=': 'equals',
    '@': 'at',
    '!': 'exclamation',
    '$': 'dollar',
    '^': 'caret',
    '*': 'asterisk',
    '(': '',
    ')': '',
    '[': '',
    ']': '',
    '{': '',
    '}': '',
    '|': '',
    '\\': '',
    '/': '',
    ':': '',
    ';': '',
    '"': '',
    "'": '',
    '<': '',
    '>': '',
    ',': '',
    '?': '',
    '~': '',
    '`': ''
  };
  
  let sanitized = filename;
  for (const [char, replacement] of Object.entries(replacements)) {
    sanitized = sanitized.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
  }
  
  // Remove any remaining non-alphanumeric characters except dots and hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
  
  // Ensure the filename doesn't start or end with dots or hyphens
  sanitized = sanitized.replace(/^[._-]+/, '').replace(/[._-]+$/, '');
  
  return sanitized;
}

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Accept', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Content-Type', 'Content-Disposition']
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  console.log('File access request:', req.method, req.url);
  console.log('Request headers:', req.headers);
  
  // Set CORS headers for all requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Range');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, Content-Disposition');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  // Decode the URL properly to handle special characters
  const decodedUrl = decodeURIComponent(req.url);
  const filePath = path.join(uploadsDir, decodedUrl);
  console.log('Serving file:', filePath);
  console.log('Decoded URL:', decodedUrl);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log('File exists, size:', stats.size, 'bytes');
    res.header('Content-Length', stats.size);
    
    // Set proper content type for PDFs
    if (filePath.toLowerCase().endsWith('.pdf')) {
      res.header('Content-Type', 'application/pdf');
    }
    
    // Add cache control headers
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  } else {
    console.log('File not found:', filePath);
    // Try to list files in directory for debugging
    try {
      const files = fs.readdirSync(uploadsDir);
      console.log('Available files:', files);
    } catch (error) {
      console.error('Error listing files:', error);
    }
  }
  
  next();
}, express.static(uploadsDir));



// Specific route for file serving with better handling of special characters
app.get('/uploads/:filename(*)', (req, res) => {
  const { filename } = req.params;
  console.log('Direct file request for:', filename);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Range');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, Content-Disposition');
  
  const filePath = path.join(uploadsDir, filename);
  console.log('Looking for file at:', filePath);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log('File found, size:', stats.size, 'bytes');
    
    // Set proper headers
    res.header('Content-Length', stats.size);
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    if (filePath.toLowerCase().endsWith('.pdf')) {
      res.header('Content-Type', 'application/pdf');
    }
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    console.log('File not found:', filePath);
    // List available files for debugging
    try {
      const files = fs.readdirSync(uploadsDir);
      console.log('Available files:', files);
    } catch (error) {
      console.error('Error listing files:', error);
    }
    res.status(404).json({ error: 'File not found' });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize the original filename
    const ext = path.extname(file.originalname);
    const originalName = path.basename(file.originalname, ext);
    const sanitizedName = sanitizeFilename(originalName);
    
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const finalFilename = `${sanitizedName}-${uniqueSuffix}${ext}`;
    
    console.log('Original filename:', file.originalname);
    console.log('Sanitized filename:', finalFilename);
    
    cb(null, finalFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// API Routes

// Upload file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      id: Date.now().toString(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date().toISOString(),
      path: `/uploads/${req.file.filename}`
    };

    // Save file info to a JSON file for persistence
    const filesListPath = path.join(__dirname, 'files-list.json');
    let filesList = [];
    
    try {
      const existingData = await fs.readFile(filesListPath, 'utf8');
      filesList = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
    }
    
    filesList.push(fileInfo);
    await fs.writeFile(filesListPath, JSON.stringify(filesList, null, 2));

    res.json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get all files
app.get('/api/files', async (req, res) => {
  try {
    const filesListPath = path.join(__dirname, 'files-list.json');
    let filesList = [];
    
    try {
      const data = await fs.readFile(filesListPath, 'utf8');
      filesList = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, return empty array
    }
    
    res.json(filesList);
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Failed to read files' });
  }
});

// Delete file
app.delete('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filesListPath = path.join(__dirname, 'files-list.json');
    
    let filesList = [];
    try {
      const data = await fs.readFile(filesListPath, 'utf8');
      filesList = JSON.parse(data);
    } catch (error) {
      return res.status(404).json({ error: 'No files found' });
    }
    
    const fileIndex = filesList.findIndex(file => file.id === id);
    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const fileToDelete = filesList[fileIndex];
    
    // Delete physical file
    try {
      await fs.remove(path.join(uploadsDir, fileToDelete.filename));
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }
    
    // Remove from list
    filesList.splice(fileIndex, 1);
    await fs.writeFile(filesListPath, JSON.stringify(filesList, null, 2));
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Test endpoint to verify CORS is working
app.options('/api/test-cors', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:4200');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.sendStatus(200);
});

app.get('/api/test-cors', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:4200');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.json({ message: 'CORS is working correctly', timestamp: new Date().toISOString() });
});

// Test endpoint to verify file content
app.get('/api/test-file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(uploadsDir, decodedFilename);
    
    console.log('Testing file:', filePath);
    console.log('Original filename:', filename);
    console.log('Decoded filename:', decodedFilename);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found, listing available files:');
      try {
        const files = fs.readdirSync(uploadsDir);
        console.log('Available files:', files);
      } catch (error) {
        console.error('Error listing files:', error);
      }
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    
    // Check first few bytes for PDF
    const firstBytes = fileBuffer.slice(0, 4);
    const header = firstBytes.toString('ascii');
    
    // Test direct file access URL
    const testUrl = `/uploads/${encodeURIComponent(decodedFilename)}`;
    
    res.json({
      filename: decodedFilename,
      size: stats.size,
      header,
      isPdf: header === '%PDF',
      firstBytes: Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join(' '),
      testUrl,
      fileExists: true
    });
  } catch (error) {
    console.error('Test file error:', error);
    res.status(500).json({ error: 'Failed to test file' });
  }
});

// Test endpoint to verify file serving directly
app.get('/api/test-file-serve/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(uploadsDir, decodedFilename);
    
    console.log('Testing file serving:', filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(filePath);
    
    // Set proper content type based on file extension
    let contentType = 'application/octet-stream';
    if (filePath.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filePath.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (filePath.toLowerCase().endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    // Set CORS headers first
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Range');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, Content-Disposition');
    
    // Set content headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size.toString());
    res.setHeader('Content-Disposition', `inline; filename="${decodedFilename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' });
      }
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('Test file serve error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Direct file serving endpoint for better compatibility
app.get('/api/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(uploadsDir, decodedFilename);
    
    console.log('Direct file request:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(filePath);
    console.log('File found, size:', stats.size);
    
    // Set proper content type based on file extension
    let contentType = 'application/octet-stream';
    if (filePath.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filePath.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (filePath.toLowerCase().endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    // Set CORS headers first
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Range');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, Content-Disposition');
    
    // Set content headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' });
      }
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('Direct file serve error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }
  
  if (error.message === 'Unsupported file type') {
    return res.status(400).json({ error: 'Unsupported file type' });
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
}); 