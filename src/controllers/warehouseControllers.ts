import {Request, Response} from 'express';

export default class WarehouseControllers {
    // get all warehouses
    async getAllWarehouses(req: Request, res: Response) {
        try {
            
        } catch (error: any) {
            res.status(500).json({sucess: false, error: error.message});
        }
    }
}