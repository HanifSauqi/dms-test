const labelService = require('../services/LabelService');
const { successResponse, errorResponse } = require('../utils/response');

const createLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    const userId = req.user.id;

    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return errorResponse(res, 'Invalid color format. Use hex format like #FF5733', 400);
    }

    const label = await labelService.createLabel({ name, color }, userId);

    successResponse(res, 'Label created successfully', { label }, 201);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return errorResponse(res, error.message, 409);
    }
    if (error.message.includes('required') || error.message.includes('too long')) {
      return errorResponse(res, error.message, 400);
    }
    errorResponse(res, 'Failed to create label', 500, error.message);
  }
};

const getLabels = async (req, res) => {
  try {
    const userId = req.user.id;
    const labels = await labelService.getLabels(userId);

    successResponse(res, 'Labels retrieved successfully', { labels });
  } catch (error) {
    errorResponse(res, 'Failed to retrieve labels', 500, error.message);
  }
};

const getLabelById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const labelData = await labelService.getLabelById(id, userId);

    successResponse(res, 'Label retrieved successfully', {
      label: {
        id: labelData.id,
        name: labelData.name,
        color: labelData.color
      },
      recentDocuments: labelData.documents.slice(0, 10)
    });
  } catch (error) {
    if (error.message === 'Label not found') {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to retrieve label', 500, error.message);
  }
};

const updateLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const userId = req.user.id;

    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return errorResponse(res, 'Invalid color format. Use hex format like #FF5733', 400);
    }

    const label = await labelService.updateLabel(id, { name, color }, userId);

    successResponse(res, 'Label updated successfully', { label });
  } catch (error) {
    if (error.message === 'Label not found') {
      return errorResponse(res, error.message, 404);
    }
    if (error.message.includes('already exists')) {
      return errorResponse(res, error.message, 409);
    }
    if (error.message.includes('required') || error.message.includes('too long') || error.message.includes('No updates')) {
      return errorResponse(res, error.message, 400);
    }
    errorResponse(res, 'Failed to update label', 500, error.message);
  }
};

const deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await labelService.deleteLabel(id, userId);

    successResponse(res, 'Label deleted successfully');
  } catch (error) {
    if (error.message === 'Label not found') {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to delete label', 500, error.message);
  }
};

const assignLabelToDocument = async (req, res) => {
  try {
    const { documentId, labelId } = req.body;
    const userId = req.user.id;

    if (!documentId || !labelId) {
      return errorResponse(res, 'Document ID and Label ID are required', 400);
    }

    await labelService.assignToDocument(labelId, documentId, userId);

    successResponse(res, 'Label assigned to document successfully');
  } catch (error) {
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to assign label to document', 500, error.message);
  }
};

const removeLabelFromDocument = async (req, res) => {
  try {
    const { documentId, labelId } = req.params;
    const userId = req.user.id;

    await labelService.removeFromDocument(labelId, documentId, userId);

    successResponse(res, 'Label removed from document successfully');
  } catch (error) {
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    errorResponse(res, 'Failed to remove label from document', 500, error.message);
  }
};

module.exports = {
  createLabel,
  getLabels,
  getLabelById,
  updateLabel,
  deleteLabel,
  assignLabelToDocument,
  removeLabelFromDocument
};
