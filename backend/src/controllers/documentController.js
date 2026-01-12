const documentService = require('../services/DocumentService');
const searchService = require('../services/SearchService');
const { successResponse, errorResponse } = require('../utils/response');

const uploadDocuments = async (req, res) => {
  try {
    const { folderId, labels } = req.body;
    const userId = req.user.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return errorResponse(res, 'No files uploaded', 400);
    }

    const documents = await documentService.uploadDocuments(files, {
      folderId,
      labels,
      userId
    });

    successResponse(res, `${documents.length} document(s) uploaded successfully`, {
      documents
    }, 201);
  } catch (error) {
    errorResponse(res, 'Failed to upload documents', 500, error.message);
  }
};

const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { folderId, search, labels, page = 1, limit = 20 } = req.query;

    const options = {
      folderId,
      search,
      labels,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await documentService.getDocuments(userId, options);

    successResponse(res, 'Documents retrieved successfully', {
      documents: result.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.file_name,
        filePath: doc.file_path,
        extractedContent: doc.extracted_content,
        folderId: doc.folder_id,
        folderName: doc.folder_name,
        ownerId: doc.owner_id,
        ownerEmail: doc.owner_email,
        ownerName: doc.owner_name,
        labels: doc.labels || [],
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      })),
      pagination: result.pagination
    });
  } catch (error) {
    errorResponse(res, 'Failed to retrieve documents', 500, error.message);
  }
};

const getDocumentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const fs = require('fs');

    const document = await documentService._getDocumentWithoutLogging(id, userId);

    if (!document) {
      return errorResponse(res, 'Document not found', 404);
    }
    let fileSize = null;
    try {
      if (document.file_path && fs.existsSync(document.file_path)) {
        const stats = fs.statSync(document.file_path);
        fileSize = stats.size;
      }
    } catch (error) {
      console.error('Error getting file size:', error);
    }

    // Clean extracted content (remove error messages)
    let extractedContent = document.extracted_content;
    if (extractedContent && extractedContent.includes('Error extracting content')) {
      extractedContent = null;
    }

    successResponse(res, 'Document retrieved successfully', {
      document: {
        id: document.id,
        title: document.title,
        fileName: document.file_name,
        filePath: document.file_path,
        fileSize: fileSize,
        extractedContent: extractedContent,
        folderId: document.folder_id,
        folderName: document.folder_name,
        ownerId: document.owner_id,
        labels: document.labels || [],
        createdAt: document.created_at
      }
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to retrieve document', 500, error.message);
  }
};

const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const fs = require('fs');

    const document = await documentService.getDocumentById(id, userId);
    let fileSize = null;
    try {
      if (document.file_path && fs.existsSync(document.file_path)) {
        const stats = fs.statSync(document.file_path);
        fileSize = stats.size;
      }
    } catch (error) {
      console.error('Error getting file size:', error);
    }

    let extractedContent = document.extracted_content;
    if (extractedContent && extractedContent.includes('Error extracting content')) {
      extractedContent = null;
    }

    successResponse(res, 'Document retrieved successfully', {
      document: {
        id: document.id,
        title: document.title,
        fileName: document.file_name,
        filePath: document.file_path,
        fileSize: fileSize,
        extractedContent: extractedContent,
        folderId: document.folder_id,
        folderName: document.folder_name,
        ownerId: document.owner_id,
        labels: document.labels || [],
        createdAt: document.created_at
      }
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to retrieve document', 500, error.message);
  }
};

const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, folderId, labels } = req.body;
    const userId = req.user.id;

    const document = await documentService.updateDocument(id, {
      title,
      folderId,
      labels
    }, userId);

    successResponse(res, 'Document updated successfully', {
      document: {
        id: document.id,
        title: document.title,
        fileName: document.file_name,
        folderId: document.folder_id,
        labels: document.labels || [],
        updatedAt: document.updated_at
      }
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return errorResponse(res, error.message, 404);
    }
    if (error.message.includes('exists')) {
      return errorResponse(res, error.message, 409);
    }
    errorResponse(res, 'Failed to update document', 500, error.message);
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await documentService.deleteDocument(id, userId);

    successResponse(res, 'Document deleted successfully');
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to delete document', 500, error.message);
  }
};

const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const fileInfo = await documentService.downloadDocument(id, userId);
    const filePath = fileInfo.path || fileInfo;

    res.download(filePath);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to download document', 500, error.message);
  }
};

const viewDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const fs = require('fs');
    const path = require('path');

    const fileInfo = await documentService.viewDocument(id, userId);
    const filePath = fileInfo.path || fileInfo;
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 'File not found on server', 404);
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', 'inline');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        errorResponse(res, 'Failed to stream document', 500, error.message);
      }
    });

  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to view document', 500, error.message);
  }
};

const getSharedDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await documentService.getSharedDocuments(userId, options);

    // Transform to camelCase for frontend
    const transformedDocuments = result.documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.file_name,
      filePath: doc.file_path,
      extractedContent: doc.extracted_content,
      folderId: doc.folder_id,
      folderName: doc.folder_name,
      ownerId: doc.owner_id,
      ownerEmail: doc.owner_email,
      ownerName: doc.owner_name,
      permissionLevel: doc.permission_level,
      labels: doc.labels || [],
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }));

    successResponse(res, 'Shared documents retrieved successfully', {
      documents: transformedDocuments,
      pagination: result.pagination
    });
  } catch (error) {
    errorResponse(res, 'Failed to retrieve shared documents', 500, error.message);
  }
};

const searchDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, labels, folderId, page = 1, limit = 50 } = req.query;

    const options = {
      query: q,
      labels,
      folderId,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const documents = await searchService.simpleSearch(q, userId, options);

    successResponse(res, 'Search completed successfully', {
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.file_name,
        filePath: doc.file_path,
        extractedContent: doc.extracted_content,
        folderId: doc.folder_id,
        folderName: doc.folder_name,
        ownerId: doc.owner_id,
        ownerEmail: doc.owner_email,
        ownerName: doc.owner_name,
        labels: doc.labels || [],
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        similarity: doc.similarity,
        snippet: doc.snippet
      })),
      query: q,
      totalFound: documents.length
    });
  } catch (error) {
    errorResponse(res, 'Failed to search documents', 500, error.message);
  }
};

const ragSearchDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, limit = 50 } = req.query;

    if (!q || q.trim().length < 2) {
      return successResponse(res, 'Search query too short', {
        results: [],
        summary: 'Please enter at least 2 characters',
        totalFound: 0,
        aiPowered: false
      });
    }

    const options = {
      limit: parseInt(limit)
    };

    const results = await searchService.ragSearch(q, userId, options);

    successResponse(res, 'RAG search completed successfully', {
      results: results.map(result => ({
        id: result.id,
        title: result.title,
        fileName: result.file_name,
        filePath: result.file_path,
        extractedContent: result.extracted_content,
        folderId: result.folder_id,
        folderName: result.folder_name,
        ownerId: result.owner_id,
        ownerEmail: result.owner_email,
        ownerName: result.owner_name,
        labels: result.labels || [],
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        relevanceScore: result.relevance_score,
        snippet: result.snippet,
        summary: result.summary
      })),
      query: q,
      totalFound: results.length,
      aiPowered: true
    });
  } catch (error) {
    errorResponse(res, 'Failed to perform RAG search', 500, error.message);
  }
};

const getRecentDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const documents = await documentService.getRecentDocuments(userId, parseInt(limit));

    successResponse(res, 'Recent documents retrieved successfully', {
      documents: documents.map(doc => ({
        activityId: doc.activity_id,
        activityType: doc.activity_type,
        activityTime: doc.activity_time,
        id: doc.id,
        title: doc.title,
        fileName: doc.file_name,
        folderId: doc.folder_id,
        folderName: doc.folder_name,
        ownerId: doc.owner_id,
        ownerEmail: doc.owner_email,
        ownerName: doc.owner_name,
        labels: doc.labels || [],
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }))
    });
  } catch (error) {
    errorResponse(res, 'Failed to retrieve recent documents', 500, error.message);
  }
};

const getDocumentActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await documentService.getDocumentById(id, userId);

    const { getLatestActivity, getActivityHistory } = require('../utils/activityLogger');
    const { type } = req.query;

    if (type === 'history') {
      const history = await getActivityHistory(id);
      successResponse(res, 'Document activity history retrieved', {
        activities: history
      });
    } else {
      const latest = await getLatestActivity(id);
      successResponse(res, 'Latest document activity retrieved', {
        activity: latest
      });
    }
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to retrieve document activity', 500, error.message);
  }
};

module.exports = {
  uploadDocuments,
  getDocuments,
  getDocumentById,
  getDocumentDetails, // NEW: Get document without logging activity
  updateDocument,
  deleteDocument,
  downloadDocument,
  viewDocument, // Now uses proper viewDocument function
  getSharedDocuments,
  searchDocuments,
  ragSearchDocuments,
  getRecentDocuments,
  getDocumentActivity,
  getDocumentSharedUsers: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const sharedUsers = await documentService.getDocumentSharedUsers(id, userId);

      successResponse(res, 'Document shared users retrieved successfully', {
        sharedUsers
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return errorResponse(res, error.message, 404);
      }
      errorResponse(res, 'Failed to retrieve document shared users', 500, error.message);
    }
  }
};