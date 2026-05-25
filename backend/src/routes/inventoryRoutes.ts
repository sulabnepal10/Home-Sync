import { Router } from 'express';
import {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockItem,
} from '../controllers/inventoryController';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

// All inventory routes require authentication
router.use(requireAuth);

// GET /api/inventory - Get all inventory items
router.get('/', getInventory);

// POST /api/inventory - Create a new inventory item
router.post('/', createInventoryItem);

// GET /api/inventory/:id - Get a single inventory item
router.get('/:id', getInventoryItem);

// PUT /api/inventory/:id - Update an inventory item
router.put('/:id', updateInventoryItem);

// DELETE /api/inventory/:id - Delete an inventory item
router.delete('/:id', deleteInventoryItem);

// POST /api/inventory/:id/restock - Restock an item
router.post('/:id/restock', restockItem);

export default router;
