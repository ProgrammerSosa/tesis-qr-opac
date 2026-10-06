const express = require('express');
const { listItems, getItem, getDocumento } = require('./catalog_controller');

const router = express.Router();

router.get('/', listItems);
router.get('/:id', getItem);
router.get('/:id/documento', getDocumento);

module.exports = router;
