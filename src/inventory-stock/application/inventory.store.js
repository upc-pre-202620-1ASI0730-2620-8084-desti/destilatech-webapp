import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { InventoryApi } from '@/inventory-stock/infrastructure/inventory-api.js';
import { ProductAssembler } from '@/inventory-stock/infrastructure/product.assembler.js';
import { StockItemAssembler } from '@/inventory-stock/infrastructure/stock-item.assembler.js';
import { StockMovementAssembler } from '@/inventory-stock/infrastructure/stock-movement.assembler.js';
import { Product } from '@/inventory-stock/domain/model/product.entity.js';
import { StockStatus } from '@/inventory-stock/domain/model/stock-item.entity.js';
import { MovementReason, MovementType, StockMovement } from '@/inventory-stock/domain/model/stock-movement.entity.js';
import { RegisterStockMovementCommand } from '@/inventory-stock/domain/model/register-stock-movement.command.js';
import { useUserStore } from '@/shared/application/user.store.js';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';

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
        const userStore = useUserStore();
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
            movements.value = stockMovementAssembler.toEntitiesFromResponse(movementsResponse)
                .sort((first, second) => second.movementDate.toDate() - first.movementDate.toDate());
            loaded.value = true;
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    /**
     * The platform raises the low stock alert when a movement or a new threshold leaves the stock at or below it,
     * so the alerts are reloaded to show it.
     */
    async function refreshAlerts() {
        await useAlertsStore().fetchAlerts();
    }


    async function registerProduct(productData, initialQuantity = 0, lowStockThreshold = 0) {
        const userStore = useUserStore();
        errors.value = [];
        try {
            const product = new Product({ ...productData, userId: userStore.currentUserId });
            const productResponse = await inventoryApi.createProduct(userStore.currentUserId,
                { ...productAssembler.toResourceFromEntity(product), lowStockThreshold });
            const createdProduct = productAssembler.toEntityFromResponse(productResponse);
            products.value = [...products.value, createdProduct];
            stockItems.value = stockItemAssembler.toEntitiesFromResponse(
                await inventoryApi.getStockItemsByUserId(userStore.currentUserId));

            if (initialQuantity > 0) {
                await registerStockMovement(new RegisterStockMovementCommand({
                    productId: createdProduct.id, type: MovementType.IN, quantity: initialQuantity, reason: MovementReason.INITIAL
                }));
            } else {
                await refreshAlerts();
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
            const response = await inventoryApi.updateProduct(product.userId, product.id,
                productAssembler.toResourceFromEntity(updated));
            const saved = productAssembler.toEntityFromResponse(response);
            products.value = products.value.map(item => item.id === saved.id ? saved : item);
            return true;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
    }


    async function registerStockMovement(command) {
        const userStore = useUserStore();
        errors.value = [];
        let stockItem = null;
        let movement = null;
        try {
            if (!loaded.value) await fetchInventory();
            stockItem = stockItems.value.find(item => item.productId === command.productId);
            if (!stockItem) throw new Error('stock-item-not-found');

            movement = new StockMovement({ ...command, stockItemId: stockItem.id, userId: userStore.currentUserId });
            // Validates locally first (for example, no exits above the current stock); the server checks it again.
            if (!stockItem.canApply(movement)) throw new Error('insufficient-stock');
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
        try {
            const movementResponse = await inventoryApi.createStockMovement(userStore.currentUserId,
                stockMovementAssembler.toResourceFromEntity(movement));
            const createdMovement = stockMovementAssembler.toEntityFromResponse(movementResponse);
            stockItem.applyMovement(createdMovement);
            movements.value = [createdMovement, ...movements.value];

            await refreshAlerts();
            return createdMovement;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
    }


    async function configureLowStockThreshold(stockItem, threshold) {
        errors.value = [];
        const previousThreshold = stockItem.lowStockThreshold;
        try {
            stockItem.configureThreshold(threshold);
            await inventoryApi.configureLowStockThreshold(stockItem.userId, stockItem.id, stockItem.lowStockThreshold);
            await refreshAlerts();
            return true;
        } catch (error) {
            stockItem.lowStockThreshold = previousThreshold;
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
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
        configureLowStockThreshold
    };
});
