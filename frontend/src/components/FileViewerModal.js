'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon, ArrowDownTrayIcon, DocumentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// PDF Viewer Component
const PDFViewer = ({ document, onError }) => {
  const { api } = useAuth();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    console.log('📄 PDFViewer useEffect running for document:', document.id);
    // Create new abort controller for this effect
    abortControllerRef.current = new AbortController();

    const loadPDF = async () => {
      try {
        setLoading(true);
        console.log('📄 PDFViewer: Making API call to /documents/' + document.id + '/view');

        const response = await api.get(`/documents/${document.id}/view`, {
          responseType: 'blob',
          signal: abortControllerRef.current.signal
        });

        console.log('📄 PDFViewer: Response received:', response);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
        console.log('📄 PDFViewer: PDF loaded successfully');
      } catch (error) {
        // Ignore abort errors
        if (error.name === 'CanceledError' || error.message?.includes('aborted')) {
          console.log('📄 PDFViewer: Request aborted');
          return;
        }
        console.error('❌ PDFViewer: Error loading PDF:', error);
        onError(`Failed to load PDF: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();

    // Cleanup function: abort ongoing request and revoke URL
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id, api, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Failed to load PDF
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      className="w-full h-full border-0"
      title={document.title}
    />
  );
};

// Image Viewer Component
const ImageViewer = ({ document, onError }) => {
  const { api } = useAuth();
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    console.log('🖼️ ImageViewer useEffect running for document:', document.id);
    // Create new abort controller for this effect
    abortControllerRef.current = new AbortController();

    const loadImage = async () => {
      try {
        setLoading(true);
        console.log('🖼️ ImageViewer: Making API call to /documents/' + document.id + '/view');

        const response = await api.get(`/documents/${document.id}/view`, {
          responseType: 'blob',
          signal: abortControllerRef.current.signal
        });

        console.log('🖼️ ImageViewer: Response received:', response);
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        setImageUrl(url);
        console.log('🖼️ ImageViewer: Image loaded successfully');
      } catch (error) {
        // Ignore abort errors
        if (error.name === 'CanceledError' || error.message?.includes('aborted')) {
          console.log('🖼️ ImageViewer: Request aborted');
          return;
        }
        console.error('❌ ImageViewer: Error loading image:', error);
        console.error('❌ ImageViewer: Error response:', error.response);
        onError(`Failed to load image: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup function: abort ongoing request and revoke URL
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (imageUrl) {
        window.URL.revokeObjectURL(imageUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id, api, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Failed to load image
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={document.title}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default function FileViewerModal({ document, isOpen, onClose }) {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('🔵 FileViewerModal rendered:', { isOpen, document });

  // Log view activity when modal opens
  useEffect(() => {
    if (!isOpen || !document) return;

    const logViewActivity = async () => {
      try {
        console.log('📊 FileViewerModal: Logging view activity for document:', document.id);
        // Call the view endpoint to log activity
        // This doesn't need to return anything, just trigger the logging
        await api.get(`/documents/${document.id}/view`, {
          responseType: 'blob'
        });
        console.log('✅ FileViewerModal: View activity logged successfully');
      } catch (error) {
        console.error('❌ FileViewerModal: Error logging view activity:', error);
        // Don't show error to user, this is just for logging
      }
    };

    logViewActivity();
  }, [document?.id, isOpen, api]);

  if (!isOpen || !document) {
    console.log('🔵 FileViewerModal: Not rendering (isOpen:', isOpen, ', document:', document, ')');
    return null;
  }

  const getFileExtension = (fileName) => {
    return fileName.split('.').pop()?.toLowerCase();
  };

  const getFileType = (fileName) => {
    const extension = getFileExtension(fileName);
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'txt':
      case 'md':
        return 'text';
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'spreadsheet';
      case 'ppt':
      case 'pptx':
        return 'presentation';
      default:
        return 'unknown';
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // Add authorization header via fetch
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      });
      
      // Create blob URL
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const linkElement = window.document.createElement('a');
      linkElement.href = url;
      linkElement.download = document.title || document.fileName;
      
      // Download file
      window.document.body.appendChild(linkElement);
      linkElement.click();
      window.document.body.removeChild(linkElement);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const renderFilePreview = () => {
    const fileType = getFileType(document.fileName || document.title);
    console.log('🔍 FileViewerModal: File type detected:', fileType, 'for file:', document.fileName || document.title);

    switch (fileType) {
      case 'pdf':
        console.log('📄 FileViewerModal: Rendering PDFViewer');
        return <PDFViewer document={document} onError={setError} />;

      case 'image':
        console.log('🖼️ FileViewerModal: Rendering ImageViewer');
        return <ImageViewer document={document} onError={setError} />;

      case 'text':
        return (
          <div className="h-full bg-white p-4 overflow-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {document.extractedContent || 'No preview available for this text file.'}
            </pre>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
            <DocumentIcon className="h-16 w-16 mb-4" />
            <h3 className="text-lg font-medium mb-2">Preview not available</h3>
            <p className="text-sm text-center mb-4">
              This file type ({getFileExtension(document.fileName || document.title)}) cannot be previewed in the browser.
            </p>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download to view
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 overflow-hidden z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-6xl max-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {document.title}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(document.createdAt).toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              title="Download file"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Download
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
              <ExclamationTriangleIcon className="h-16 w-16 mb-4 text-red-400" />
              <h3 className="text-lg font-medium mb-2">Error loading file</h3>
              <p className="text-sm text-center mb-4">{error}</p>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download instead
              </button>
            </div>
          ) : (
            renderFilePreview()
          )}
        </div>
      </div>
    </div>
  );
}