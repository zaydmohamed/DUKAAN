const Category = require('../models/Category');
const { logAudit } = require('../services/auditService');

// @desc Get all categories
// @route GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

// @desc Create a new category
// @route POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const category = new Category({
      name,
      code: code || name.substring(0, 3).toUpperCase(),
      description,
    });
    await category.save();

    await logAudit({
      user: req.user,
      action: 'CATEGORY_CREATED',
      resourceType: 'Category',
      resourceId: category._id,
      description: `Category '${category.name}' created`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @desc Update category
// @route PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @desc Delete category
// @route DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

