import express from 'express';

import {
    createExpense,
    deleteExpense,
    getExpenses,
    getRecentExpenses,
    updateAllExpenses,
    updateExpense
} from '../controllers/expenseController.js';

const router = express.Router();

router.get('/expenses', getExpenses);
router.get('/expenses/dashboard', getRecentExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);
router.put('/all', updateAllExpenses);
export default router;