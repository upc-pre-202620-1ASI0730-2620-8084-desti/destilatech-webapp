/**
 * Loads the demo data of server/db.json into the platform API (destilatech-platform), using its REST endpoints.
 *
 *   npm run seed-api                                                     -> http://localhost:5273/api/v1
 *   npm run seed-api -- https://destilatech-platform.onrender.com/api/v1  -> deployed API
 *
 * The platform keeps the business rules, so the data is created the same way a user would create it:
 * products with their initial stock, customers, batches that advance stage by stage, process variables and
 * sensor readings (out of range readings raise their alerts), orders and replenishment orders.
 * Users and plans already exist in the platform. Accounts that already have products are skipped, so running
 * the script twice does not duplicate data.
 */
import { readFile } from 'node:fs/promises';

const apiUrl = (process.argv[2] ?? process.env.SEED_API_URL ?? 'http://localhost:5273/api/v1').replace(/\/$/, '');
const db = JSON.parse(await readFile(new URL('./db.json', import.meta.url), 'utf8'));

const STAGES = ['RECEIVED', 'FERMENTATION', 'DISTILLATION', 'RESTING', 'BOTTLED'];
const MONITORED = ['FERMENTATION', 'DISTILLATION', 'RESTING'];
const ORDER_FLOW = ['PENDING', 'PREPARING', 'SHIPPED', 'DELIVERED'];


async function request(method, path, { userId, body } = {}) {
    const url = new URL(`${apiUrl}${path}`);
    if (userId) url.searchParams.set('userId', userId);
    const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json', 'Accept-Language': 'en' } : { 'Accept-Language': 'en' },
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${data?.detail ?? data?.title ?? text}`);
    return data;
}

const post = (path, userId, body) => request('POST', path, { userId, body });
const patch = (path, userId, body) => request('PATCH', path, { userId, body });


async function seedAccount(user) {
    const userId = user.id;
    const existing = await request('GET', '/products', { userId });
    if (existing.length > 0) {
        console.log(`- ${user.email}: already has ${existing.length} products, skipped.`);
        return;
    }
    console.log(`- ${user.email}`);

    const products = db.products.filter(item => item.userId === userId);
    const batches = db.batches.filter(item => item.userId === userId);
    const orders = db.orders.filter(item => item.userId === userId);
    const replenishments = db['replenishment-orders'].filter(item => item.userId === userId);

    // Initial stock = final stock of db.json, minus what bottlings and received replenishments add,
    // plus what the orders created later will discount.
    const initialStock = new Map(db['stock-items'].filter(item => item.userId === userId)
        .map(item => [item.productId, item.currentQuantity]));
    const adjust = (productId, units) => initialStock.set(productId, (initialStock.get(productId) ?? 0) + units);
    batches.filter(batch => batch.stage === 'BOTTLED').forEach(batch => adjust(batch.productId, -batch.bottledUnits));
    replenishments.filter(order => order.status === 'RECEIVED').forEach(order => adjust(order.productId, -order.quantity));
    orders.filter(order => order.status !== 'CANCELLED')
        .forEach(order => order.lines.forEach(line => adjust(line.productId, line.quantity)));

    // Products (the platform creates their stock items) and initial stock.
    const productIds = new Map();
    for (const product of products) {
        const stockItem = db['stock-items'].find(item => item.productId === product.id);
        const created = await post('/products', userId, {
            name: product.name,
            presentation: product.presentation,
            unit: product.unit,
            category: product.category,
            unitPrice: product.unitPrice,
            sku: product.sku,
            lowStockThreshold: stockItem?.lowStockThreshold ?? 0
        });
        productIds.set(product.id, created.id);
        const quantity = Math.max(0, initialStock.get(product.id) ?? 0);
        if (quantity > 0) {
            await post('/stock-movements', userId,
                { productId: created.id, type: 'IN', reason: 'INITIAL', quantity, notes: '', reference: 'SEED' });
        }
    }
    console.log(`  ${productIds.size} products with their initial stock`);

    // Production batches, advanced stage by stage, with their process variables and readings.
    const variableIds = new Map();
    for (const batch of batches) {
        const created = await post('/batches', userId, {
            code: batch.code,
            variety: batch.variety,
            startDate: batch.startDate,
            estimatedQuantity: batch.estimatedQuantity,
            tank: batch.tank,
            notes: batch.notes
        });
        for (const variable of db['process-variables'].filter(item => item.batchId === batch.id)) {
            const createdVariable = await post('/process-variables', userId, {
                batchId: created.id,
                type: variable.type,
                minRange: variable.minRange,
                maxRange: variable.maxRange,
                sensorId: variable.sensorId
            });
            variableIds.set(variable.id, createdVariable.id);
        }
        // The platform only accepts readings while the batch is being monitored, so each reading is recorded
        // during the stage it belongs to, before the batch moves on.
        const pending = db['sensor-readings'].filter(item => item.batchId === batch.id)
            .sort((first, second) => new Date(first.recordedAt) - new Date(second.recordedAt));
        const recordReadingsBefore = async limit => {
            while (pending.length && new Date(pending[0].recordedAt) < limit) {
                const reading = pending.shift();
                await post('/sensor-readings', userId, {
                    processVariableId: variableIds.get(reading.processVariableId),
                    value: reading.value,
                    recordedAt: reading.recordedAt
                });
            }
        };
        for (const stage of STAGES.slice(1, STAGES.indexOf(batch.stage) + 1)) {
            const change = batch.stageHistory.find(item => item.stage === stage);
            const previousStage = STAGES[STAGES.indexOf(stage) - 1];
            if (MONITORED.includes(previousStage)) await recordReadingsBefore(new Date(change?.changedAt ?? Date.now()));
            const bottling = stage === 'BOTTLED';
            await patch(`/batches/${created.id}/status`, userId, {
                stage,
                notes: change?.notes ?? '',
                productId: bottling ? productIds.get(batch.productId) : null,
                bottledUnits: bottling ? batch.bottledUnits : 0,
                confirmOverEstimate: true
            });
        }
        if (MONITORED.includes(batch.stage)) await recordReadingsBefore(new Date(8.64e15));
    }
    if (batches.length) console.log(`  ${batches.length} batches, ${variableIds.size} process variables and their readings`);

    // Replenishment orders (a received one adds its units to the stock).
    for (const order of replenishments) {
        const created = await post('/replenishment-orders', userId, {
            supplierName: order.supplierName,
            supplierContact: order.supplierContact,
            productId: productIds.get(order.productId),
            quantity: order.quantity,
            expectedDate: order.expectedDate,
            notes: order.notes
        });
        if (order.status !== 'REQUESTED') {
            await patch(`/replenishment-orders/${created.id}`, userId, { status: order.status });
        }
    }

    // Customers and their orders (each order discounts the stock; a cancelled one returns it).
    const customerIds = new Map();
    for (const customer of db.customers.filter(item => item.userId === userId)) {
        const created = await post('/customers', userId, {
            userId,
            name: customer.name,
            contactName: customer.contactName,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            customerType: customer.customerType
        });
        customerIds.set(customer.id, created.id);
    }
    const oldestFirst = [...orders].sort((first, second) => new Date(first.orderDate) - new Date(second.orderDate));
    for (const order of oldestFirst) {
        const created = await post('/orders', userId, {
            userId,
            customerId: customerIds.get(order.customerId),
            lines: order.lines.map(line => ({ productId: productIds.get(line.productId), quantity: line.quantity })),
            notes: order.notes
        });
        const steps = order.status === 'CANCELLED' ? ['CANCELLED'] : ORDER_FLOW.slice(1, ORDER_FLOW.indexOf(order.status) + 1);
        for (const status of steps) await patch(`/orders/${created.id}`, userId, { status });
    }
    console.log(`  ${customerIds.size} customers, ${orders.length} orders and ${replenishments.length} replenishment orders`);

    // Some products were sold before the demo period (the bottled units are more than the stock left), so an
    // adjustment leaves the same stock as db.json. Adjustments do not count as consumption in the estimates.
    const stockItems = await request('GET', '/stock-items', { userId });
    let adjustments = 0;
    for (const item of db['stock-items'].filter(stockItem => stockItem.userId === userId)) {
        const current = stockItems.find(stockItem => stockItem.productId === productIds.get(item.productId));
        const difference = (current?.currentQuantity ?? 0) - item.currentQuantity;
        if (difference === 0) continue;
        await post('/stock-movements', userId, {
            productId: productIds.get(item.productId),
            type: difference > 0 ? 'OUT' : 'IN',
            reason: 'ADJUSTMENT',
            quantity: Math.abs(difference),
            notes: 'Stock before the demo period',
            reference: 'SEED'
        });
        adjustments++;
    }
    if (adjustments) console.log(`  ${adjustments} stock adjustments to match db.json`);
}


console.log(`Seeding ${apiUrl}`);
const users = await request('GET', '/users');
for (const user of users) {
    if (db.users.some(item => item.id === user.id)) await seedAccount(user);
}
console.log('Done.');
