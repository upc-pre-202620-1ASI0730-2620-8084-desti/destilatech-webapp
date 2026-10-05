
export class AnalyticsRecordAssembler {

    toMovementRecords(response) {
        return (response.data ?? []).map(resource => ({
            productId: resource.productId,
            type: resource.type,
            reason: resource.reason,
            quantity: Number(resource.quantity),
            signedQuantity: resource.type === 'IN' ? Number(resource.quantity) : -Number(resource.quantity),
            date: new Date(resource.movementDate)
        })).filter(record => !Number.isNaN(record.date.getTime()));
    }


    toStockLevelRecords(response) {
        return (response.data ?? []).map(resource => ({
            productId: resource.productId,
            currentQuantity: Number(resource.currentQuantity),
            lowStockThreshold: Number(resource.lowStockThreshold)
        }));
    }


    toSaleRecords(response) {
        return (response.data ?? []).map(resource => ({
            date: new Date(resource.orderDate),
            total: Number(resource.total ?? 0),
            units: (resource.lines ?? []).reduce((sum, line) => sum + Number(line.quantity), 0),
            cancelled: resource.status === 'CANCELLED'
        }));
    }


    toProductionRecords(response) {
        return (response.data ?? []).map(resource => ({
            code: resource.code,
            date: new Date(resource.startDate),
            liters: Number(resource.estimatedQuantity),
            stage: resource.stage,
            variety: resource.variety
        }));
    }
}
