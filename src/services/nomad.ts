import express from 'express';
import { checkAuthentication } from '../middleware/auth';

const router = express.Router();

router.get('/timestamp/', async (req, res) => {
    res.json({
        unix: Date.now(),
        utc: new Date().toUTCString()
    })
});


router.get('/greeting/', checkAuthentication, async (req, res) => {
    res.json({
        message: `Hi ${req.user.firstName || req.user.email}`,
    })
});


export default router
