import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { InventoryApi } from '@/inventory-stock/infrastructure/inventory-api.js';
import { ProductAssembler } from '@/inventory-stock/infrastructure/product.assembler.js';
import { StockItemAssembler } from '@/inventory-stock/infrastructure/stock-item.assembler.js';
import { StockMovementAssembler } from '@/inventory-stock/infrastructure/stock-movement.assembler.js';
import { Product } from '@/inventory-stock/domain/model/product.entity.js';
import { StockItem, StockStatus } from '@/inventory-stock/domain/model/stock-item.entity.js';
import { MovementReason, MovementType, StockMovement } from '@/inventory-stock/domain/model/stock-movement.entity.js';
import { RegisterStockMovementCommand } from '@/inventory-stock/domain/model/register-stock-movement.command.js';
import { useUserStore } from '@/shared/application/user.store.js';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';
import { RaiseAlertCommand } from '@/alerts-notifications/domain/model/raise-alert.command.js';
import { AlertSeverity, AlertType } from '@/alerts-notifications/domain/model/alert.entity.js';

const inventoryApi = new InventoryApi();
const productAssembler = new ProductAssembler();
const stockItemAssembler = new StockItemAssembler();
const stockMovementAssembler = new StockMovementAssembler();


export const useInventoryStore = defineStore('inventory', () => {
    const products = ref([]);
    const stockItems = ref([]);
    const movements = ref([]);
    const errors = ref([]);
    const loading = ref(false);
    const loaded = ref(false);


    const inventoryItems = computed(() => products.value
        .map(product => ({ product, stockItem: stockItems.value.find(item => item.productId === product.id) }))
        .filter(item => item.stockItem)
        .sort((first, second) => first.stockItem.currentQuantity - second.stockItem.currentQuantity));

    const totalUnits = computed(() => stockItems.value.reduce((sum, item) => sum + item.currentQuantity, 0));
    const lowStockItems = computed(() => inventoryItems.value.filter(item => item.stockItem.status !== StockStatus.OPTIMAL));
    const inventoryValue = computed(() => inventoryItems.value
        .reduce((sum, item) => sum + item.product.unitPrice.amount * item.stockItem.currentQuantity, 0));


    const findInventoryItem = productId => inventoryItems.value.find(item => item.product.id === Number(productId));


    const movementsForProduct = productId => movements.value.filter(movement => movement.productId === Number(productId));


    async function fetchInventory({ force = false } = {}) {
        if (loaded.value && !force) return;
        const userStore = useUserStore
();
        errors.value = [];
        loading.value = true;
        try {
            const [productsResponse, stockItemsResponse, movementsResponse] = await Promise.all([
                inventoryApi.getProductsByUserId(userStore.currentUserId),
                inventoryApi.getStockItemsByUserId(userStore.currentUserId),
                inventoryApi.getStockMovementsByUserId(userStore.currentUserId)
            ]);
            products.value = productAssembler.toEntitiesFromResponse(productsResponse);
            stockItems.value = stockItemAssembler.toEntitiesFromResponse(stockItemsResponse);
            movements.value = stockMovementAssembler.toEntitiesFromResponse(movementsResponse);
            loaded.value = true;
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    async function checkAgainstThreshold(stockItem) {
        if (!stockItem.isBelowThreshold()) return;
        const product = products.value.find(item => item.id === stockItem.productId);
        const alertsStore = useAlertsStore();
        await alertsStore.raiseAlert(new RaiseAlertCommand({
            userId: stockItem.userId,
            type: AlertType.LOW_STOCK,
            sourceId: stockItem.id,
            messageKey: 'alerts.messages.low-stock',
            messageParams: {
                product: product?.displayName ?? '',
                quantity: stockItem.currentQuantity,
                threshold: stockItem.lowStockThreshold
            },
            severity: stockItem.status === StockStatus.CRITICAL ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
            link: `/inventory/products/${stockItem.productId}`
        }));
    }


    async function registerProduct(productData, initialQuantity = 0, lowStockThreshold = 0) {
        const userStore = useUserStore
();
        errors.value = [];
        try {
            const product = new Product({ ...productData, userId: userStore.currentUserId });
            const productResponse = await inventoryApi.createProduct(productAssembler.toResourceFromEntity(product));
            const createdProduct = productAssembler.toEntityFromResponse(productResponse);
            products.value = [...products.value, createdProduct];

            const stockItem = new StockItem({ productId: createdProduct.id, userId: userStore.currentUserId, lowStockThreshold });
            const stockItemResponse = await inventoryApi.createStockItem(stockItemAssembler.toResourceFromEntity(stockItem));
            stockItems.value = [...stockItems.value, stockItemAssembler.toEntityFromResponse(stockItemResponse)];

            if (initialQuantity > 0) {
                await registerStockMovement(new RegisterStockMovementCommand({
                    productId: createdProduct.id, type: MovementType.IN, quantity: initialQuantity, reason: MovementReason.INITIAL
                }));
            } else {
                await checkAgainstThreshold(stockItems.value.at(-1));
            }
            return createdProduct;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
    }


    async function updateProduct(product, changes) {
        errors.value = [];
        try {
            const updated = new Product({ ...product, ...changes, id: product.id, userId: product.userId });
            const response = await inventoryApi.updateProduct(product.id, productAssembler.toResourceFromEntity(updated));
            const saved = productAssembler.toEntityFromResponse(response);
            products.value = products.value.map(item => item.id === saved.id ? saved : item);
            return true;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
    }


    async function registerStockMovement(command) {
        const userStore = useUserStore
();
        errors.value = [];
        let stockItem = null;
        let movement = null;
        try {
            if (!loaded.value) await fetchInventory();
            stockItem = stockItems.value.find(item => item.productId === command.productId);
            if (!stockItem) throw new Error('stock-item-not-found');

            movement = new StockMovement({ ...command, stockItemId: stockItem.id, userId: userStore.currentUserId });
            stockItem.applyMovement(movement);
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
        try {
            const movementResponse = await inventoryApi.createStockMovement(stockMovementAssembler.toResourceFromEntity(movement));
            await inventoryApi.patchStockItem(stockItem.id, { currentQuantity: stockItem.currentQuantity });
            const createdMovement = stockMovementAssembler.toEntityFromResponse(movementResponse);
            movements.value = [createdMovement, ...movements.value];

            await checkAgainstThreshold(stockItem);
            return createdMovement;
        } catch (error) {
            // Keep the aggregate consistent with the server when persistence fails.
            stockItem.currentQuantity -= movement.signedQuantity;
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
    }


    async function configureLowStockThreshold(stockItem, threshold) {
        errors.value = [];
        try {
            stockItem.configureThreshold(threshold);
            await inventoryApi.patchStockItem(stockItem.id, { lowStockThreshold: stockItem.lowStockThreshold });
            await checkAgainstThreshold(stockItem);
            return true;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
    }


    function discountStock(productId, quantity, orderCode) {
        return registerStockMovement(new RegisterStockMovementCommand({
            productId, type: MovementType.OUT, quantity, reason: MovementReason.ORDER, reference: orderCode
        }));
    }


    function addStock(productId, quantity, reason, reference) {
        return registerStockMovement(new RegisterStockMovementCommand({
            productId, type: MovementType.IN, quantity, reason, reference
        }));
    }

    return {
        products,
        stockItems,
        movements,
        errors,
        loading,
        inventoryItems,
        totalUnits,
        lowStockItems,
        inventoryValue,
        findInventoryItem,
        movementsForProduct,
        fetchInventory,
        registerProduct,
        updateProduct,
        registerStockMovement,
        configureLowStockThreshold,
        discountStock,
        addStock
    };
});
