/**
 * @swagger
 * tags:
 *  name: Nomad
 *  description: No-special-APIs just to test the server
 */

import express from 'express';
import { checkAuthentication } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * /api/v1/timestamp/:
 *   get:
 *     summary: Get the current timestamp
 *     tags: [Nomad]
 *     description: Timestamp API
 *     responses:
 *       200:
 *         description: Returns server timestamp in unix
 */
router.get('/timestamp/', async (req, res) => {
    res.json({
        unix: Date.now(),
        utc: new Date().toUTCString()
    })
});


/**
 * @openapi
 * /api/v1/greeting/:
 *   get:
 *     summary: Greet the user
 *     tags: [Nomad]
 *     description: Greet authenticated users
 *     responses:
 *       200:
 *         description: Returns a message containing the user's name or email
 *       401:
 *          description: Unauthorized
 *          content:
 *           application/json:
 *            schema:
 *             type: object
 *            properties:
 *             error:
 *              type: string
 *            example:
 *             error: unauthorized
 */
router.get('/greeting/', checkAuthentication, async (req, res) => {
    res.json({
        message: `Hi ${req.user.firstName || req.user.email}`,
    })
});


export default router
