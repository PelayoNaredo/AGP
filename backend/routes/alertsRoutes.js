import express from 'express';
import { getAlerts, getAlertById, createAlert, updateAlert, deleteAlert } from '../controllers/alertsController.js';

const router = express.Router();

router.get('/alerts', getAlerts);
router.get('/alerts/:id', getAlertById);
router.post('/alerts', createAlert);
router.put('/alerts/:id', updateAlert);
router.delete('/alerts/:id', deleteAlert);

export default router;