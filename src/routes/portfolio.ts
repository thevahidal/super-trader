/**
 * @swagger
 * tags:
 *  name: Portfolio
 *  description: Portfolios APIs
 */

import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client'

import { checkAuthentication } from '../middleware/auth'

const prisma = new PrismaClient()
const router = express.Router();


/**
 * @openapi
 * /api/v1/portfolios/:
 *   get:
 *     summary: Lists all your portfolios
 *     tags: [Portfolio]
 *     description: Portfolios API
 *     responses:
 *       200:
 *         description: Returns lists of all your portfolios
 */
router.get('/', checkAuthentication, async (req, res) => {
    const { user } = req
    const portfolios = await prisma.portfolio.findMany({
        where: {
            userId: user.id,
        },
    })

    res.status(200).json({
        results: portfolios,
    })
});

/**
 * @openapi
 * /api/v1/portfolios/{portfolioId}/assets/:
 *   get:
 *     summary: List all assets in a portfolio
 *     tags: [Portfolio]
 *     description: Portfolio assets API
 *     parameters:
 *      - name: portfolioId
 *        in: path
 *        required: true
 *        schema:
 *         type: id
 *         description: The id of your portfolio
 *     responses:
 *       200:
 *         description: Returns all active assets in a portfolio
 */
router.get('/:portfolioId/assets/', checkAuthentication, async (req, res) => {
    const { portfolioId } = req.params
    const { user } = req

    console.log(portfolioId)
    
    const portfolio = await prisma.portfolio.findFirst({
        where: {
            id: parseInt(portfolioId),
            userId: user.id,
        },
    })

    if (!portfolio) {
        return res.status(400).json({
            error: "portfolio_not_found"
        })
    }

    const assets = await prisma.asset.findMany({
        where: {
            portfolio: {
                id: portfolio.id,
            },
            active: true,
        },
    })

    res.status(200).json({
        results: assets,
    })
});


export default router