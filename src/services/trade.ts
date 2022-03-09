import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client'

import { checkAuthentication } from '../middleware/auth'

const prisma = new PrismaClient()
const router = express.Router();


router.get('/shares/', async (req, res) => {
    const shares = await prisma.share.findMany()

    res.json({
        results: shares,
    })
});

router.post('/shares/:shareSymbol/buy/', checkAuthentication, async (req, res) => {
    const { shareSymbol } = req.params
    const { unit, portfolioId } = req.body
    const { user } = req

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

    if (!unit) {
        return res.status(400).json({
            error: "unit_required"
        })
    }

    if (unit <= 0) {
        return res.status(400).json({
            error: "unit_must_be_greater_than_zero"
        })
    }

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
        return res.status(400).json({
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



router.post('/assets/:assetId/sell/', checkAuthentication, async (req, res) => {
    const { assetId } = req.params
    const { unit } = req.body
    const { user } = req

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
        return res.status(400).json({
            error: "asset_inactive",
        })
    }

    if (!unit) {
        return res.status(400).json({
            error: "unit_required"
        })
    }

    if (unit <= 0) {
        return res.status(400).json({
            error: "unit_must_be_greater_than_zero"
        })
    }

    if (unit > asset.unit) {
        return res.status(400).json({
            error: "unit_must_be_less_than_or_equal_to_asset_unit",
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


export default router