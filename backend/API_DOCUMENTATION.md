# Document Management System - API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Document Search API

### Search Documents
Search through documents by title and content.

**Endpoint:** `GET /documents/search`

**Query Parameters:**
- `q` (required, string, min 2 characters) - Search query

**Request Example:**
```http
GET /api/documents/search?q=report
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": [
    {
      "id": 1,
      "title": "Annual Report 2024",
      "fileName": "report-2024.pdf",
      "fileType": "pdf",
      "folderId": 5,
      "folderName": "Reports",
      "description": "This is the annual report for fiscal year 2024 containing...",
      "labels": ["important", "2024"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "title": "Q1 Report",
      "fileName": "q1-report.docx",
      "fileType": "docx",
      "folderId": 5,
      "folderName": "Reports",
      "description": "Quarter 1 performance report showing metrics and KPIs...",
      "labels": ["quarterly"],
      "createdAt": "2024-04-01T09:15:00.000Z"
    }
  ]
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Search query too short"
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Search failed",
  "error": "Internal server error details"
}
```

**Features:**
- Full-text search in document titles
- Full-text search in extracted document content
- Only returns documents user owns or has access to
- Results limited to 10 documents
- Sorted by creation date (newest first)
- Includes folder context and labels
- Description truncated to 150 characters

**Access Control:**
- User can only search their own documents
- User can search documents in folders shared with them (read/write/admin permission)

---

## Other Document Endpoints

### Get All Documents
**Endpoint:** `GET /documents`

Query parameters:
- `folderId` - Filter by folder
- `search` - Search in title and content
- `labels` - Filter by labels
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Get Document by ID
**Endpoint:** `GET /documents/:id`

### Upload Documents
**Endpoint:** `POST /documents/upload`

### Update Document
**Endpoint:** `PUT /documents/:id`

### Delete Document
**Endpoint:** `DELETE /documents/:id`

### Download Document
**Endpoint:** `GET /documents/:id/download`

### View Document
**Endpoint:** `GET /documents/:id/view`

### Get Shared Documents
**Endpoint:** `GET /documents/shared`

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- File types are automatically detected from file extensions
- Search is case-insensitive
- Minimum search query length is 2 characters
- Description field shows first 150 characters of extracted content
