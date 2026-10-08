import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { config, logConfig } from './config/env';
import { ExtractionController } from './controllers/extraction.controller';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Controller
const extractionController = new ExtractionController();

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'PixelMind AI - Member 4 Document Intelligence & Extraction Service',
    timestamp: new Date().toISOString(),
    aiProvider: config.aiProvider,
    ocrProvider: config.ocrProvider,
  });
});

// Primary Document Extraction Route
app.post('/api/v1/document-extraction/extract', extractionController.extract);

// Testing & Diagnostics Routes
app.post('/api/v1/document-extraction/upload-test', upload.single('file'), extractionController.uploadTest);
app.get('/api/v1/document-extraction/sample-test', extractionController.sampleTest);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    logConfig();
    console.log('🚀 ===============================================================');
    console.log('🚀 PixelMind AI - Document Extraction Service is RUNNING!');
    console.log(`🌐 Local URL:      http://localhost:${config.port}`);
    console.log(`💓 Health Check:   http://localhost:${config.port}/health`);
    console.log(`📑 Extract Route:  POST http://localhost:${config.port}/api/v1/document-extraction/extract`);
    console.log(`🧪 Sample Test:    GET  http://localhost:${config.port}/api/v1/document-extraction/sample-test`);
    console.log('🚀 ===============================================================\n');
  });
}

export default app;
