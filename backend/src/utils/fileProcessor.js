const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

// Enhanced text extraction for different file types
const extractTextContent = async (filePath, fileType) => {
  try {
    switch (fileType.toLowerCase()) {
      case 'txt':
        return await fs.readFile(filePath, 'utf8');
      
      case 'json':
        const jsonContent = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(jsonContent);
        return JSON.stringify(parsed, null, 2);
      
      case 'pdf':
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text || 'No text content found in PDF';
      
      case 'docx':
        const docxResult = await mammoth.extractRawText({ path: filePath });
        return docxResult.value || 'No text content found in DOCX';
      
      case 'xlsx':
      case 'xls':
        const workbook = XLSX.readFile(filePath);
        let xlsxText = '';
        workbook.SheetNames.forEach((sheetName, index) => {
          const sheet = workbook.Sheets[sheetName];
          xlsxText += `=== Sheet: ${sheetName} ===\n`;
          xlsxText += XLSX.utils.sheet_to_txt(sheet) + '\n\n';
        });
        return xlsxText || 'No data found in Excel file';
      
      case 'csv':
        const csvContent = await fs.readFile(filePath, 'utf8');
        return csvContent;
      
      // Image files - no text extraction
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return `Image file: ${fileType.toUpperCase()}. No text content available.`;
      
      // PowerPoint and other formats
      case 'pptx':
        return `PowerPoint file. Content extraction not implemented yet.`;
      
      default:
        return `File type: ${fileType}. Content extraction not supported.`;
    }
  } catch (error) {
    console.error(`Text extraction error for ${fileType}:`, error);
    return `Error extracting content from ${fileType} file: ${error.message}`;
  }
};

const getFileType = (filename) => {
  return path.extname(filename).toLowerCase().slice(1);
};

const validateFileType = (fileType) => {
  const allowedTypes = [
    'pdf', 'docx', 'xlsx', 'xls', 'pptx', 
    'txt', 'csv', 'json',
    'png', 'jpg', 'jpeg', 'gif'
  ];
  return allowedTypes.includes(fileType.toLowerCase());
};

const generateUniqueFilename = (originalName) => {
  const { v4: uuidv4 } = require('uuid');
  const fileExtension = path.extname(originalName);
  return `${uuidv4()}${fileExtension}`;
};

const getFileInfo = (filePath, originalName, fileSize) => {
  const fileType = getFileType(originalName);
  const stats = {
    type: fileType,
    size: fileSize,
    sizeFormatted: formatFileSize(fileSize),
    canExtractText: ['txt', 'json', 'pdf', 'docx', 'xlsx', 'xls', 'csv'].includes(fileType)
  };
  return stats;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  extractTextContent,
  getFileType,
  validateFileType,
  generateUniqueFilename,
  getFileInfo,
  formatFileSize
};