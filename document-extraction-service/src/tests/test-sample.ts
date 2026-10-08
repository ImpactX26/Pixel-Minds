import { DocumentExtractionService } from '../services/document-extraction.service';
import { ExtractionRequestDto } from '../types/extraction.types';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🧪 Starting Document Intelligence Service Test Suite');
  console.log('===============================================================\n');

  const extractionService = new DocumentExtractionService();

  // Test Case 1: Degree Certificate with full details
  console.log('--- TEST CASE 1: Synthetic Degree Certificate (Full Data) ---');
  const sampleCertificateText = `
    RNS INSTITUTE OF TECHNOLOGY
    BENGALURU, KARNATAKA, INDIA
    
    DEGREE OF BACHELOR OF ENGINEERING
    
    This is to certify that
    NITHIN N
    
    having completed the course of study and passed the examinations,
    has been conferred the degree of
    BACHELOR OF ENGINEERING IN COMPUTER SCIENCE AND ENGINEERING
    
    University: Visvesvaraya Technological University
    Date of Birth: 2008-01-01
    Year of Passing: 2028
  `;

  // We test using Base64 text buffer
  const samplePdfBuffer = Buffer.from(sampleCertificateText, 'utf-8');

  const request1: ExtractionRequestDto = {
    documentId: 'doc-deg-test-001',
    documentType: 'degree_certificate',
    base64Data: samplePdfBuffer.toString('base64'),
    mimeType: 'text/plain',
  };

  const result1 = await extractionService.extractDocumentData(request1);
  console.log('Test 1 Result:', JSON.stringify(result1, null, 2));

  // Test Case 2: Document with missing fields (Ensuring NULL values, no hallucination)
  console.log('\n--- TEST CASE 2: Document with Missing Fields (Zero Hallucination Verification) ---');
  const partialText = `
    EXPERIENCE CERTIFICATE
    This is to certify that
    ALEX JOHNSON
    worked as a Junior Developer at PixelMind Solutions.
  `;

  const request2: ExtractionRequestDto = {
    documentId: 'doc-exp-partial-002',
    documentType: 'experience_letter',
    base64Data: Buffer.from(partialText).toString('base64'),
    mimeType: 'text/plain',
  };

  const result2 = await extractionService.extractDocumentData(request2);
  console.log('Test 2 Result:', JSON.stringify(result2, null, 2));

  // Verify assertions
  console.log('\n===============================================================');
  console.log('✅ TEST ASSERTIONS SUMMARY:');
  console.log(`1. DocumentId Preserved (Test 1): ${result1.documentId === 'doc-deg-test-001' ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`2. Status is Processed:           ${result1.status === 'processed' ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`3. FullName Extracted:           ${result1.extractedData?.fullName ? 'PASS ✅ (' + result1.extractedData.fullName + ')' : 'FAIL ❌'}`);
  console.log(`4. Missing DOB is NULL (Test 2):  ${result2.extractedData?.dateOfBirth === null ? 'PASS ✅ (Strict NULL, No Hallucination)' : 'FAIL ❌'}`);
  console.log(`5. Missing Degree is NULL (Test 2): ${result2.extractedData?.degree === null ? 'PASS ✅ (Strict NULL, No Hallucination)' : 'FAIL ❌'}`);
  console.log(`6. Confidence is a valid number:  ${typeof result1.confidence === 'number' && result1.confidence > 0 ? 'PASS ✅ (' + result1.confidence + ')' : 'FAIL ❌'}`);
  console.log('===============================================================\n');
}

runTestSuite().catch(console.error);
