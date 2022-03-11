/**
 * @swagger
 * tags:
 *  name: Trade
 *  description: Trading APIs
 */

import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client'

import { checkAuthentication } from '../middleware/auth'
import Joi from 'joi';
import { schemaValidator } from '../utils';

const prisma = new PrismaClient()
const router = express.Router();


/**
 * @openapi
 * /api/v1/shares/:
 *   get:
 *     summary: Lists all active shares
 *     tags: [Trade]
 *     description: Shares API
 *     responses:
 *       200:
 *         description: Returns lists of all active shares
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
router.get('/shares/', async (req, res) => {
    const shares = await prisma.share.findMany({
        where: {
            active: true,
        },
    })

    res.json({
        results: shares,
    })
});


const buyShareInputSchema = Joi.object({
    unit: Joi.number()
        .greater(0)
        .required(),

    portfolioId: Joi.number()
        .greater(0),
})
/**
 * @openapi
 * /api/v1/shares/{shareSymbol}/buy/:
 *   post:
 *     summary: Buy a share
 *     tags: [Trade]
 *     description: Buying share API
 *     parameters:
 *      - name: shareSymbol
 *        in: path
 *        required: true
 *        schema:
 *         type: string
 *        description: The symbol of the share to buy (Uppercase)
 *        example: APL
 *     requestBody:
 *       required: true
 *       content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *           unit:
 *            type: number
 *            minimum: 0
 *           portfolioId:
 *            type: number
 *     responses:
 *       200:
 *         description: Returns the created asset and its trade
 *       400:
 *         description: Invalid input
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *            payload:
 *             type: object
 *           example:
 *            error: invalid_input
 *            payload: {
 *             "unit": "This field is required"
 *            }
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
 *       404:
 *         description: Share not found
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *           example:
 *            error: share_not_found
 *       422:
 *         description: Portfolio not exists
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *           example:
 *            error: portfolio_not_found
 */
router.post('/shares/:shareSymbol/buy/', checkAuthentication, async (req, res) => {
    const { shareSymbol } = req.params
    const { user } = req

    const { value: data, error, isInvalid } = schemaValidator(req.body, buyShareInputSchema)

    if (isInvalid) {
        return res.status(400).json({
            error: "invalid_input",
            payload: error,
        })
    }

    const { unit, portfolioId } = data

    const share = await prisma.share.findFirst({
        where: {
            symbol: shareSymbol,
        },
    })

    if (!share) {
        return res.status(404).json({
            error: "share_not_found",
        })
    }

    console.log(portfolioId)

    let portfolio = null
    if (portfolioId) {
        portfolio = await prisma.portfolio.findFirst({
            where: {
                id: portfolioId,
                user: {
                    id: user.id,
                },
                default: true,
            },
        })
    } else {
        portfolio = await prisma.portfolio.findFirst({
            where: {
                user: {
                    id: user.id,
                },
                default: true,
            },
        })
    }

    if (!portfolio) {
        return res.status(422).json({
            error: "portfolio_not_found",
        })
    }

    const amount = unit * +share.price

    const asset = await prisma.asset.create({
        data: {
            share: {
                connect: {
                    id: share.id,
                },
            },
            portfolio: {
                connect: {
                    id: portfolio.id,
                },
            },
            unit,
            active: true,
        },
    })

    const trade = await prisma.trade.create({
        data: {
            asset: {
                connect: {
                    id: asset.id,
                },
            },
            unit,
            isBuy: true,
            sharePrice: share.price,
            amount,
        },
    })


    res.status(200).json({
        message: "Asset bought successfully",
        payload: {
            asset,
            trade,
        }
    })
});



const sellAssetInputSchema = Joi.object({
    unit: Joi.number()
        .greater(0)
        .required(),
})

/**
 * @openapi
 * /api/v1/assets/{assetId}/sell/:
 *   post:
 *     summary: Sell an asset
 *     tags: [Trade]
 *     description: Selling assets API
 *     parameters:
 *      - name: assetId
 *        in: path
 *        required: true
 *        schema:
 *         type: number
 *        description: The id of the asset to sell
 *        example: 1
 *     requestBody:
 *       required: true
 *       content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *           unit:
 *            type: number
 *            minimum: 0
 *     responses:
 *       200:
 *         description: Returns the sold asset and its trade
 *       400:
 *         description: Invalid input
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *            payload:
 *             type: object
 *           example:
 *            error: invalid_input
 *            payload: {
 *             "unit": "This field is required"
 *            }
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
 *       403:
 *         description: Asset is closed (Sold)
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *           example:
 *              error: asset_closed
 *       404:
 *         description: Asset not found
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *           example:
 *              error: asset_not_found
 *       422:
 *         description: Unit more than asset unit
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *           example:
 *            error: not_sufficient_assets
 */
router.post('/assets/:assetId/sell/', checkAuthentication, async (req, res) => {
    const { assetId } = req.params
    const { user } = req

    const { value: data, error, isInvalid } = schemaValidator(req.body, sellAssetInputSchema)

    if (isInvalid) {
        return res.status(400).json({
            error: "invalid_input",
            payload: error,
        })
    }

    const { unit } = data

    let asset = null
    try {
        asset = await prisma.asset.findFirst({
            where: {
                id: parseInt(assetId),
                portfolio: {
                    user: {
                        id: user.id,
                    },
                },
            },
        })
    } catch (error) {
        return res.status(404).json({
            error: "asset_not_found",
        })
    }

    if (!asset) {
        return res.status(404).json({
            error: "asset_not_found",
        })
    }

    if (!asset.active) {
        return res.status(403).json({
            error: "asset_closed",
        })
    }

    if (unit > asset.unit) {
        return res.status(422).json({
            error: "not_sufficient_assets",
            payload: {
                slack: unit - +asset.unit,
            }
        })
    }

    const share = await prisma.share.findFirst({
        where: {
            id: asset.shareId,
        },
    })

    const amount = unit * +(<any>share).price

    const trade = await prisma.trade.create({
        data: {
            asset: {
                connect: {
                    id: asset.id,
                },
            },
            unit,
            isBuy: false,
            sharePrice: (<any>share).price,
            amount,
        },
    })

    const active = +asset.unit - unit > 0
    const updatedAsset = await prisma.asset.update({
        where: {
            id: asset.id,
        },
        data: {
            unit: +asset.unit - unit,
            active,
        }
    })


    res.status(200).json({
        message: "Asset sold successfully",
        payload: {
            asset: updatedAsset,
            trade,
        }
    })
});



/**
 * @openapi
 * /api/v1/shares/{shareSymbol}/sell/:
 *   post:
 *     summary: Sell aggregated assets by share
 *     tags: [Trade]
 *     description: Selling multiple assets API
 *     parameters:
 *      - name: shareSymbol
 *        in: path
 *        required: true
 *        schema:
 *         type: string
 *        description: The symbol of the assets share
 *        example: APL
 *     requestBody:
 *       required: true
 *       content:
 *        application/json:
 *         schema:
 *          type: object
 *          properties:
 *           unit:
 *            type: number
 *            minimum: 0
 *     responses:
 *       200:
 *         description: Returns the sold assets and its trades
 *       400:
 *         description: Invalid input
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *            payload:
 *             type: object
 *           example:
 *            error: invalid_input
 *            payload: {
 *             "unit": "This field is required"
 *            }
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
 *       422:
 *         description: Unit more than total assets units
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *           properties:
 *            error:
 *             type: string
 *           example:
 *            error: not_sufficient_assets
 */
 router.post('/shares/:symbolShare/sell/', checkAuthentication, async (req, res) => {
    const { symbolShare } = req.params
    const { user } = req

    const { value: data, error, isInvalid } = schemaValidator(req.body, sellAssetInputSchema)

    if (isInvalid) {
        return res.status(400).json({
            error: "invalid_input",
            payload: error,
        })
    }

    const { unit } = data

    let assets = await prisma.asset.findMany({
        where: {
            share: {
                symbol: symbolShare,
            },
            portfolio: {
                user: {
                    id: user.id,
                },
            },
        },
        orderBy: {
            unit: "desc",
        },
    })

    const assetsUnits = await prisma.asset.aggregate({
        where: {
            share: {
                symbol: symbolShare,
            },
            portfolio: {
                user: {
                    id: user.id,
                },
            },
        },
        _sum: {
            unit: true,
        }
    }) 


    if (unit > +(<any> assetsUnits)._sum.unit) {
        return res.status(422).json({
            error: "not_sufficient_assets",
            payload: {
                slack: unit - +(<any> assetsUnits)._sum.unit,
            }
        })
    }

    const share = await prisma.share.findFirst({
        where: {
            id: assets[0].shareId,
        },
    })

    const amount = unit * +(<any>share).price
    
    const trades: any = []
    const soldAssets: any = []

    let suppliedUnits = 0
    for (let asset of assets) {
        let suppliedUnit = 0

        if (suppliedUnits + +asset.unit > unit) {
            suppliedUnit = unit - suppliedUnits
        } else {
            suppliedUnit = +asset.unit
        }   

        suppliedUnits += suppliedUnit

        const trade = await prisma.trade.create({
            data: {
                asset: {
                    connect: {
                        id: asset.id,
                    },
                },
                unit: suppliedUnit,
                isBuy: false,
                sharePrice: (<any>share).price,
                amount,
            },
        })
    
        const active = +asset.unit - suppliedUnit > 0
        const updatedAsset = await prisma.asset.update({
            where: {
                id: asset.id,
            },
            data: {
                unit: +asset.unit - suppliedUnit,
                active,
            }
        })

        trades.push(trade)
        soldAssets.push(updatedAsset)

        if (suppliedUnits == unit) {
            break
        }
    }

    res.status(200).json({
        message: "Assets sold successfully",
        payload: {
            assets: soldAssets,
            trades,
        }
    })
});



export default router