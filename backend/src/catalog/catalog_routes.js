const express = require('express');
const { listItems, getItem } = require('./catalog_controller');

const router = express.Router();

router.get('/', listItems);
router.get('/:id', getItem);

module.exports = router;
