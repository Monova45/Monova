"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowDownToLine, ArrowLeftRight, ArrowRight, ArrowUpFromLine, Boxes,
  Download, Layers3, Pencil, Plus, Search, SlidersHorizontal, Trash2, Undo2, Wallet, Warehouse, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tab = "resumen" | "productos" | "movimientos" | "almacenes" | "benchmark";
type MovementType = "Recepción" | "Entrega" | "Traslado interno" | "Devolución" | "Ajuste";
type OperationType = Exclude<MovementType, "Ajuste">;
type MovementStatus = "Hecho" | "Pendiente" | "Cancelado";
type StockLevel = "normal" | "bajo" | "agotado";

interface WarehouseDef { id: string; name: string; code: string; }
interface StockEntry { warehouseId: string; quantity: number; }
interface Product {
  id: string; name: string; sku: string; category: string;
  unit: string; minStock: number; cost: number; stock: StockEntry[];
}
interface Movement {
  id: string; reference: string; type: MovementType; productId: string; quantity: number;
  partner: string; fromWarehouseId?: string; toWarehouseId?: string;
  status: MovementStatus; date: string; applied: boolean;
}

const productsKey = "monova-inventory-products-v2";
const movementsKey = "monova-inventory-movements-v2";
const warehouseList: WarehouseDef[] = [
  { id: "wh-1", name: "Almacén Principal", code: "ALM-01" },
  { id: "wh-2", name: "Bodega de Insumos", code: "BOD-02" },
  { id: "wh-3", name: "CD Norte", code: "CD-03" },
];
const categories = ["Envases", "Empaque", "Insumos", "Accesorios", "Producto terminado"];
const units = ["Unidades", "kg", "m"];
const operationTypes: OperationType[] = ["Recepción", "Entrega", "Traslado interno", "Devolución"];
const allMovementTypes: MovementType[] = [...operationTypes, "Ajuste"];
const referencePrefix: Record<MovementType, string> = { "Recepción": "REC", "Entrega": "ENT", "Traslado interno": "TRA", "Devolución": "DEV", "Ajuste": "AJU" };
const opColor: Record<OperationType, string> = { "Recepción": "#16a34a", "Entrega": "#ea7c1f", "Traslado interno": "#2876b8", "Devolución": "#6657bc" };
const opIcon: Record<OperationType, LucideIcon> = { "Recepción": ArrowDownToLine, "Entrega": ArrowUpFromLine, "Traslado interno": ArrowLeftRight, "Devolución": Undo2 };

const benchmarkRows: Array<{ capability: string; note?: string; monova: string; level: StockLevel }> = [
  { capability: "Multibodega en tiempo real", monova: "Stock real por almacén + traslados que mueven unidades", level: "normal" },
  { capability: "Historial de movimientos auditable", monova: "Recepción, entrega, traslado, devolución, ajuste", level: "normal" },
  { capability: "Alertas de stock mínimo", monova: "Panel de alertas + estado por producto", level: "normal" },
  { capability: "Conteos cíclicos con diferencia registrada", monova: "\"Ajustar stock\" calcula y audita la diferencia", level: "normal" },
  { capability: "Exportación de datos", note: "CSV, Excel, API", monova: "Solo CSV de productos", level: "bajo" },
  { capability: "Permisos finos por acción", note: "no solo por módulo", monova: "Equipo controla acceso por módulo, no por acción dentro de Inventario", level: "bajo" },
  { capability: "Trazabilidad por lote y caducidad", monova: "No existe todavía", level: "agotado" },
  { capability: "Reabastecimiento predictivo", monova: "Solo mínimo fijo manual, sin sugerencia de compra", level: "agotado" },
  { capability: "Valoración FIFO / promedio", monova: "Costo fijo por producto, no por entrada", level: "agotado" },
  { capability: "Código de barras / lector RF", monova: "No existe todavía", level: "agotado" },
  { capability: "Kits y ensamblados", monova: "No existe todavía", level: "agotado" },
  { capability: "Integraciones externas", note: "e-commerce, contabilidad, EDI", monova: "Todo vive como demo local, sin conexión externa", level: "agotado" },
];
const benchmarkLabel: Record<StockLevel, string> = { normal: "Cumple", bajo: "Parcial", agotado: "Pendiente" };
const roadmapItems = [
  { tag: "Prioridad 1", title: "Trazabilidad por lote y caducidad", body: "Insumos como resina PET y colorante food-safe vencen. Sin fecha de lote, un conteo \"correcto\" en el sistema puede estar escondiendo material vencido en el estante.", note: "Riesgo operativo más alto de los seis" },
  { tag: "Prioridad 2", title: "Sugerencia de reabastecimiento", body: "Ya sabemos qué está en stock bajo. Falta el siguiente paso: calcular cuánto pedir y a qué proveedor, usando el historial de recepciones que ya se registra.", note: "Reutiliza datos que ya existen" },
  { tag: "Prioridad 3", title: "Exportación e integración con Facturación", body: "El valor del inventario ya se calcula en vivo. Conectarlo al módulo de Facturación cierra el círculo sin que nadie vuelva a digitar el mismo número dos veces.", note: "Conecta dos módulos que ya existen" },
];

const demoProducts: Product[] = [
  { id: "p-1", name: "Botella deportiva HydroPro 750ml", sku: "BOT-750-NAR", category: "Envases", unit: "Unidades", minStock: 300, cost: 3800, stock: [{ warehouseId: "wh-1", quantity: 740 }, { warehouseId: "wh-3", quantity: 500 }] },
  { id: "p-2", name: "Tapa rosca 28mm negra", sku: "TAP-28-NEG", category: "Envases", unit: "Unidades", minStock: 500, cost: 220, stock: [{ warehouseId: "wh-1", quantity: 180 }] },
  { id: "p-3", name: "Etiqueta adhesiva mate 10x6cm", sku: "ETQ-10X6", category: "Empaque", unit: "Unidades", minStock: 1000, cost: 95, stock: [{ warehouseId: "wh-2", quantity: 0 }] },
  { id: "p-4", name: "Caja corrugada mediana", sku: "CAJ-MED", category: "Empaque", unit: "Unidades", minStock: 200, cost: 1450, stock: [{ warehouseId: "wh-2", quantity: 640 }] },
  { id: "p-5", name: "Film termoencogible 40cm", sku: "FIL-40", category: "Empaque", unit: "m", minStock: 150, cost: 480, stock: [{ warehouseId: "wh-2", quantity: 320 }] },
  { id: "p-6", name: "Resina PET grado alimenticio", sku: "RES-PET", category: "Insumos", unit: "kg", minStock: 500, cost: 5200, stock: [{ warehouseId: "wh-2", quantity: 2850 }] },
  { id: "p-7", name: "Colorante naranja food-safe", sku: "COL-NAR", category: "Insumos", unit: "kg", minStock: 50, cost: 38000, stock: [{ warehouseId: "wh-2", quantity: 42 }] },
  { id: "p-8", name: "Bomba dispensadora 28/410", sku: "BOM-28", category: "Accesorios", unit: "Unidades", minStock: 100, cost: 1900, stock: [{ warehouseId: "wh-1", quantity: 96 }, { warehouseId: "wh-2", quantity: 0 }] },
  { id: "p-9", name: "Pack HydroPro x6 (listo para venta)", sku: "PACK-HP6", category: "Producto terminado", unit: "Unidades", minStock: 100, cost: 21500, stock: [{ warehouseId: "wh-3", quantity: 410 }] },
  { id: "p-10", name: "Sticker promocional \"Verano\"", sku: "STK-VER", category: "Empaque", unit: "Unidades", minStock: 200, cost: 60, stock: [{ warehouseId: "wh-3", quantity: 0 }] },
];

const demoMovements: Movement[] = [
  { id: "m-1", reference: "REC-0001", type: "Recepción", productId: "p-6", quantity: 1200, partner: "Proveedor Poliquímicos", toWarehouseId: "wh-2", status: "Hecho", date: "2026-08-01", applied: true },
  { id: "m-2", reference: "ENT-0001", type: "Entrega", productId: "p-9", quantity: 80, partner: "Cliente Almacenes Éxito", fromWarehouseId: "wh-3", status: "Hecho", date: "2026-08-02", applied: true },
  { id: "m-3", reference: "TRA-0001", type: "Traslado interno", productId: "p-1", quantity: 500, partner: "", fromWarehouseId: "wh-1", toWarehouseId: "wh-3", status: "Hecho", date: "2026-08-02", applied: true },
  { id: "m-4", reference: "REC-0002", type: "Recepción", productId: "p-2", quantity: 600, partner: "Proveedor Empaques del Valle", toWarehouseId: "wh-1", status: "Pendiente", date: "2026-08-04", applied: false },
  { id: "m-5", reference: "DEV-0001", type: "Devolución", productId: "p-9", quantity: 12, partner: "Cliente Farmatodo", toWarehouseId: "wh-3", status: "Hecho", date: "2026-08-03", applied: true },
  { id: "m-6", reference: "REC-0003", type: "Recepción", productId: "p-7", quantity: 30, partner: "Proveedor Químicos Andinos", toWarehouseId: "wh-2", status: "Pendiente", date: "2026-08-04", applied: false },
  { id: "m-7", reference: "ENT-0002", type: "Entrega", productId: "p-10", quantity: 200, partner: "Cliente Agencia BTL", fromWarehouseId: "wh-3", status: "Cancelado", date: "2026-07-30", applied: false },
  { id: "m-8", reference: "TRA-0002", type: "Traslado interno", productId: "p-8", quantity: 40, partner: "", fromWarehouseId: "wh-2", toWarehouseId: "wh-1", status: "Hecho", date: "2026-08-03", applied: true },
  { id: "m-9", reference: "REC-0004", type: "Recepción", productId: "p-4", quantity: 300, partner: "Proveedor Cartones del Cauca", toWarehouseId: "wh-2", status: "Hecho", date: "2026-08-01", applied: true },
  { id: "m-10", reference: "REC-0005", type: "Recepción", productId: "p-3", quantity: 1500, partner: "Proveedor Impresos Andinos", toWarehouseId: "wh-2", status: "Pendiente", date: "2026-08-05", applied: false },
];

const blankProductForm = () => ({ name: "", sku: "", category: categories[0], unit: units[0], minStock: 0, cost: 0, initialWarehouseId: warehouseList[0].id, initialQuantity: 0 });
const blankMovementForm = (productId: string) => ({ type: "Recepción" as OperationType, productId, quantity: 1, partner: "", fromWarehouseId: warehouseList[0].id, toWarehouseId: warehouseList[1].id, status: "Pendiente" as MovementStatus, date: new Date().toISOString().slice(0, 10) });
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const warehouseName = (id?: string) => warehouseList.find((warehouse) => warehouse.id === id)?.name ?? "—";
const totalQuantity = (product: Product) => product.stock.reduce((sum, entry) => sum + entry.quantity, 0);
const quantityAt = (product: Product, warehouseId: string) => product.stock.find((entry) => entry.warehouseId === warehouseId)?.quantity ?? 0;
const stockLevel = (product: Product): StockLevel => { const total = totalQuantity(product); return total <= 0 ? "agotado" : total <= product.minStock ? "bajo" : "normal"; };
const slug = (value: string) => value.toLowerCase().replaceAll(" ", "-").replaceAll("ó", "o").replaceAll("í", "i");

export function InventoryStudio() {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [movements, setMovements] = useState<Movement[]>(demoMovements);
  const [tab, setTab] = useState<Tab>("resumen");
  const [movementFilter, setMovementFilter] = useState<MovementType | "Todos">("Todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("Todos");
  const [query, setQuery] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustWarehouseId, setAdjustWarehouseId] = useState(warehouseList[0].id);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(blankProductForm);
  const [movementForm, setMovementForm] = useState(() => blankMovementForm(demoProducts[0].id));

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const storedProducts = localStorage.getItem(productsKey);
        if (storedProducts) setProducts(JSON.parse(storedProducts) as Product[]);
        const storedMovements = localStorage.getItem(movementsKey);
        if (storedMovements) setMovements(JSON.parse(storedMovements) as Movement[]);
      } catch { /* Demo data remains available. */ }
    });
    return () => { active = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      if (term && !`${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(term)) return false;
      if (categoryFilter !== "Todas" && product.category !== categoryFilter) return false;
      if (warehouseFilter !== "Todos" && !product.stock.some((entry) => entry.warehouseId === warehouseFilter)) return false;
      return true;
    });
  }, [products, query, categoryFilter, warehouseFilter]);
  const filteredMovements = useMemo(() => movementFilter === "Todos" ? movements : movements.filter((movement) => movement.type === movementFilter), [movements, movementFilter]);
  const productById = useMemo(() => Object.fromEntries(products.map((product) => [product.id, product])), [products]);
  const inventoryValue = useMemo(() => products.reduce((sum, product) => sum + totalQuantity(product) * product.cost, 0), [products]);
  const alertProducts = useMemo(() => products.filter((product) => stockLevel(product) !== "normal").sort((a, b) => totalQuantity(a) - totalQuantity(b)), [products]);
  const pendingCount = useMemo(() => movements.filter((movement) => movement.status === "Pendiente").length, [movements]);
  const warehouseStats = useMemo(() => warehouseList.map((warehouse) => {
    const items = products.filter((product) => product.stock.some((entry) => entry.warehouseId === warehouse.id));
    const units = items.reduce((sum, product) => sum + quantityAt(product, warehouse.id), 0);
    const value = items.reduce((sum, product) => sum + quantityAt(product, warehouse.id) * product.cost, 0);
    return { warehouse, skuCount: items.length, units, value };
  }), [products]);

  function persistProducts(next: Product[]) {
    setProducts(next);
    try { localStorage.setItem(productsKey, JSON.stringify(next)); } catch { /* Optional persistence. */ }
  }
  function persistMovements(next: Movement[]) {
    setMovements(next);
    try { localStorage.setItem(movementsKey, JSON.stringify(next)); } catch { /* Optional persistence. */ }
  }
  function adjustStock(current: Product[], productId: string, warehouseId: string, delta: number): Product[] {
    return current.map((product) => {
      if (product.id !== productId) return product;
      const index = product.stock.findIndex((entry) => entry.warehouseId === warehouseId);
      if (index === -1) return delta <= 0 ? product : { ...product, stock: [...product.stock, { warehouseId, quantity: delta }] };
      const nextStock = [...product.stock];
      nextStock[index] = { ...nextStock[index], quantity: Math.max(0, nextStock[index].quantity + delta) };
      return { ...product, stock: nextStock };
    });
  }
  function applyMovement(movement: Movement) {
    if (movement.applied) return;
    let next = products;
    if (movement.type === "Recepción" || movement.type === "Devolución") next = adjustStock(next, movement.productId, movement.toWarehouseId!, movement.quantity);
    if (movement.type === "Entrega") next = adjustStock(next, movement.productId, movement.fromWarehouseId!, -movement.quantity);
    if (movement.type === "Traslado interno") { next = adjustStock(next, movement.productId, movement.fromWarehouseId!, -movement.quantity); next = adjustStock(next, movement.productId, movement.toWarehouseId!, movement.quantity); }
    persistProducts(next);
  }
  function openNewProduct() { setEditingProductId(null); setProductForm(blankProductForm()); setProductDialogOpen(true); }
  function openEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm({ name: product.name, sku: product.sku, category: product.category, unit: product.unit, minStock: product.minStock, cost: product.cost, initialWarehouseId: warehouseList[0].id, initialQuantity: 0 });
    setProductDialogOpen(true);
  }
  function saveProduct(event: FormEvent) {
    event.preventDefault();
    const { initialWarehouseId, initialQuantity, ...base } = productForm;
    if (editingProductId) {
      persistProducts(products.map((item) => item.id === editingProductId ? { ...item, ...base } : item));
    } else {
      const id = crypto.randomUUID();
      const stock: StockEntry[] = initialQuantity > 0 ? [{ warehouseId: initialWarehouseId, quantity: initialQuantity }] : [];
      persistProducts([{ id, ...base, stock }, ...products]);
      if (initialQuantity > 0) {
        const reference = `${referencePrefix.Ajuste}-${String(movements.filter((m) => m.type === "Ajuste").length + 1).padStart(4, "0")}`;
        persistMovements([{ id: crypto.randomUUID(), reference, type: "Ajuste", productId: id, quantity: initialQuantity, partner: "Carga inicial", toWarehouseId: initialWarehouseId, status: "Hecho", date: new Date().toISOString().slice(0, 10), applied: true }, ...movements]);
      }
    }
    setProductDialogOpen(false);
  }
  function openNewMovement(type?: OperationType) {
    setMovementForm({ ...blankMovementForm(products[0]?.id ?? ""), ...(type ? { type } : {}) });
    setMovementDialogOpen(true);
  }
  function saveMovement(event: FormEvent) {
    event.preventDefault();
    const existingOfType = movements.filter((movement) => movement.type === movementForm.type).length;
    const reference = `${referencePrefix[movementForm.type]}-${String(existingOfType + 1).padStart(4, "0")}`;
    const movement: Movement = { ...movementForm, id: crypto.randomUUID(), reference, applied: false };
    if (movement.status === "Hecho") { applyMovement(movement); movement.applied = true; }
    persistMovements([movement, ...movements]);
    setMovementDialogOpen(false);
  }
  function changeMovementStatus(movement: Movement, status: MovementStatus) {
    const updated = { ...movement, status };
    if (status === "Hecho" && !movement.applied) { applyMovement(updated); updated.applied = true; }
    persistMovements(movements.map((item) => item.id === movement.id ? updated : item));
  }
  function openAdjust(product: Product) {
    setAdjustProduct(product);
    setAdjustWarehouseId(product.stock[0]?.warehouseId ?? warehouseList[0].id);
    setAdjustQuantity(quantityAt(product, product.stock[0]?.warehouseId ?? warehouseList[0].id));
  }
  function saveAdjust(event: FormEvent) {
    event.preventDefault();
    if (!adjustProduct) return;
    const before = quantityAt(adjustProduct, adjustWarehouseId);
    const delta = adjustQuantity - before;
    if (delta !== 0) {
      persistProducts(adjustStock(products, adjustProduct.id, adjustWarehouseId, delta));
      const reference = `${referencePrefix.Ajuste}-${String(movements.filter((m) => m.type === "Ajuste").length + 1).padStart(4, "0")}`;
      persistMovements([{ id: crypto.randomUUID(), reference, type: "Ajuste", productId: adjustProduct.id, quantity: delta, partner: "Conteo físico", toWarehouseId: adjustWarehouseId, status: "Hecho", date: new Date().toISOString().slice(0, 10), applied: true }, ...movements]);
    }
    setAdjustProduct(null);
  }
  function openMovementsFor(type: OperationType) { setMovementFilter(type); setTab("movimientos"); }
  function exportCsv() {
    const header = ["Nombre", "SKU", "Categoría", "Unidad", "Costo", "Stock mínimo", "Cantidad total", "Valor total", "Existencias por almacén"];
    const rows = filteredProducts.map((product) => [product.name, product.sku, product.category, product.unit, product.cost, product.minStock, totalQuantity(product), totalQuantity(product) * product.cost, product.stock.map((entry) => `${warehouseName(entry.warehouseId)}:${entry.quantity}`).join(" | ")]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `monova-inventario-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <section className="inventory-studio-live">
    <header className="inventory-head"><div><span><Boxes size={13}/> STOCK Y ALMACENES</span><h1>Inventario</h1><p>Controla productos, existencias reales por almacén y movimientos.</p></div><button className="create-button" onClick={() => tab === "movimientos" ? openNewMovement() : openNewProduct()}><Plus size={16}/> {tab === "movimientos" ? "Nuevo movimiento" : "Nuevo producto"}</button></header>

    <div className="inventory-tabs">
      <button className={tab === "resumen" ? "active" : ""} onClick={() => setTab("resumen")}>Resumen</button>
      <button className={tab === "productos" ? "active" : ""} onClick={() => setTab("productos")}>Productos</button>
      <button className={tab === "movimientos" ? "active" : ""} onClick={() => setTab("movimientos")}>Movimientos</button>
      <button className={tab === "almacenes" ? "active" : ""} onClick={() => setTab("almacenes")}>Almacenes</button>
      <button className={tab === "benchmark" ? "active" : ""} onClick={() => setTab("benchmark")}>Benchmark</button>
    </div>

    {tab === "resumen" && <>
      <div className="inventory-summary">
        <article><Layers3/><div><strong>{products.length}</strong><small>SKUs activos</small></div></article>
        <article><Wallet/><div><strong>{money.format(inventoryValue)}</strong><small>Valor de inventario</small></div></article>
        <article><AlertTriangle/><div><strong>{alertProducts.length}</strong><small>Alertas de stock</small></div></article>
        <article><ArrowLeftRight/><div><strong>{pendingCount}</strong><small>Movimientos pendientes</small></div></article>
      </div>
      <div className="inventory-ops">
        {operationTypes.map((type) => {
          const items = movements.filter((movement) => movement.type === type);
          const pending = items.filter((movement) => movement.status === "Pendiente").length;
          const Icon = opIcon[type];
          return <article className="inventory-op-card" style={{ "--op-color": opColor[type] } as { [key: string]: string }} key={type}>
            <header><Icon size={15}/><span>{type}</span></header>
            <strong>{pending}</strong><small>Por procesar</small>
            <div><span>{items.length} en total</span></div>
            <button onClick={() => openMovementsFor(type)}>Abrir</button>
          </article>;
        })}
      </div>
      <div className="inventory-panels-grid">
        <article className="panel">
          <div className="panel-head"><div><h2>Valor por almacén</h2><p>Distribución del inventario actual</p></div></div>
          {warehouseStats.map(({ warehouse, value }) => <div className="channel" key={warehouse.id}><span>{warehouse.name}</span><i><em style={{ width: `${inventoryValue ? Math.round((value / inventoryValue) * 100) : 0}%`, background: "#0e7490" }}/></i><b>{inventoryValue ? Math.round((value / inventoryValue) * 100) : 0}%</b></div>)}
        </article>
        <article className="panel">
          <div className="panel-head"><div><h2>Alertas de stock</h2><p>{alertProducts.length} productos necesitan atención</p></div></div>
          {alertProducts.slice(0, 4).map((product) => { const level = stockLevel(product); return <div className="insight" key={product.id}><span><AlertTriangle size={15}/></span><div><strong>{product.name}</strong><p>{level === "agotado" ? "Sin existencias disponibles" : `Quedan ${totalQuantity(product)} ${product.unit} · mínimo ${product.minStock}`}</p><button onClick={() => { setTab("productos"); openAdjust(product); }}>Ajustar stock →</button></div></div>; })}
          {alertProducts.length === 0 && <p className="inventory-empty">Todo el inventario está en niveles normales.</p>}
        </article>
      </div>
    </>}

    {tab === "productos" && <div className="inventory-panel">
      <header>
        <div><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, SKU o categoría"/></div>
        <div className="inventory-filters">
          <span className="inventory-move-filter"><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>Todas</option>{categories.map((option) => <option key={option}>{option}</option>)}</select></span>
          <span className="inventory-move-filter"><select value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)}><option value="Todos">Todos los almacenes</option>{warehouseList.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select></span>
          <button className="inventory-export" onClick={exportCsv}><Download size={13}/> Exportar CSV</button>
          <span>{filteredProducts.length} productos</span>
        </div>
      </header>
      <div className="inventory-table">
        <div className="inventory-row head"><span>Producto</span><span>Categoría</span><span>Almacenes</span><span>Disponible</span><span>Valor</span><span>Estado</span><span/></div>
        {filteredProducts.map((product) => { const level = stockLevel(product); return <article className="inventory-row" key={product.id}>
          <div className="inventory-product"><b>{product.sku.slice(0, 2)}</b><span><strong>{product.name}</strong><small>{product.sku}</small></span></div>
          <span>{product.category}</span>
          <span>{product.stock.length ? product.stock.map((entry) => warehouseName(entry.warehouseId)).join(", ") : "Sin almacén"}</span>
          <span>{totalQuantity(product).toLocaleString("es-CO")} {product.unit}</span>
          <span>{money.format(totalQuantity(product) * product.cost)}</span>
          <span className={`stock-pill stock-${level}`}>{level === "normal" ? "Normal" : level === "bajo" ? "Stock bajo" : "Agotado"}</span>
          <div className="inventory-row-actions"><button onClick={() => openAdjust(product)} aria-label={`Ajustar stock de ${product.name}`}><SlidersHorizontal size={14}/></button><button onClick={() => openEditProduct(product)} aria-label={`Editar ${product.name}`}><Pencil size={14}/></button><button onClick={() => persistProducts(products.filter((item) => item.id !== product.id))} aria-label={`Eliminar ${product.name}`}><Trash2 size={14}/></button></div>
        </article>; })}
        {filteredProducts.length === 0 && <div className="inventory-empty">Sin productos que coincidan con la búsqueda.</div>}
      </div>
    </div>}

    {tab === "movimientos" && <div className="inventory-panel">
      <header><span className="inventory-move-filter"><span>Tipo</span><select value={movementFilter} onChange={(event) => setMovementFilter(event.target.value as MovementType | "Todos")}><option>Todos</option>{allMovementTypes.map((type) => <option key={type}>{type}</option>)}</select></span><span>{filteredMovements.length} movimientos</span></header>
      <div className="inventory-table">
        <div className="movement-row head"><span>Referencia</span><span>Tipo</span><span>Producto</span><span>Cantidad</span><span>Ruta</span><span>Estado</span><span>Fecha</span><span/></div>
        {filteredMovements.map((movement) => { const product = productById[movement.productId]; const isAdjust = movement.type === "Ajuste"; return <article className="movement-row" key={movement.id}>
          <strong>{movement.reference}</strong>
          <span className={`move-type tipo-${slug(movement.type)}`}>{movement.type}</span>
          <span>{product?.name ?? "Producto eliminado"}</span>
          <span>{isAdjust && movement.quantity > 0 ? "+" : ""}{movement.quantity.toLocaleString("es-CO")} {product?.unit}</span>
          <div className="move-route">
            {isAdjust ? <span>{warehouseName(movement.toWarehouseId)} · {movement.partner}</span>
              : movement.type === "Traslado interno" ? <><span>{warehouseName(movement.fromWarehouseId)}</span><ArrowRight size={12}/><span>{warehouseName(movement.toWarehouseId)}</span></>
              : movement.type === "Entrega" ? <><span>{warehouseName(movement.fromWarehouseId)}</span><ArrowRight size={12}/><span>{movement.partner}</span></>
              : <><span>{movement.partner}</span><ArrowRight size={12}/><span>{warehouseName(movement.toWarehouseId)}</span></>}
          </div>
          {isAdjust ? <span className="move-status status-hecho">Hecho</span> : <select className={`move-status status-${slug(movement.status)}`} aria-label={`Estado de ${movement.reference}`} value={movement.status} onChange={(event) => changeMovementStatus(movement, event.target.value as MovementStatus)}><option>Pendiente</option><option>Hecho</option><option>Cancelado</option></select>}
          <time>{movement.date}</time>
          <button className="inventory-row-actions" onClick={() => persistMovements(movements.filter((item) => item.id !== movement.id))} aria-label={`Eliminar ${movement.reference}`}><Trash2 size={14}/></button>
        </article>; })}
        {filteredMovements.length === 0 && <div className="inventory-empty">Sin movimientos de este tipo.</div>}
      </div>
    </div>}

    {tab === "almacenes" && <div className="module-cards">
      {warehouseStats.map(({ warehouse, skuCount, units, value }) => <article key={warehouse.id}>
        <span className="panel-icon"><Warehouse size={18}/></span>
        <h3>{warehouse.name}</h3>
        <p>{warehouse.code} · {skuCount} SKUs · {units.toLocaleString("es-CO")} unidades en stock<br/>Valor: {money.format(value)}</p>
        <button onClick={() => { setWarehouseFilter(warehouse.id); setTab("productos"); }}>Ver productos →</button>
      </article>)}
    </div>}

    {tab === "benchmark" && <>
      <p className="inventory-benchmark-intro">Cómo queda Monova Inventario frente a lo que trae de fábrica un WMS de nivel enterprise (SAP, NetSuite, Odoo y similares) — capacidad por capacidad, sin maquillar lo que todavía falta.</p>
      <div className="inventory-panel">
        <header><div className="inventory-move-filter"><span>Comparativa</span></div><span>{benchmarkRows.filter((row) => row.level === "normal").length} cumple · {benchmarkRows.filter((row) => row.level === "bajo").length} parcial · {benchmarkRows.filter((row) => row.level === "agotado").length} pendiente</span></header>
        <div className="inventory-table">
          <div className="benchmark-row head"><span>Capacidad</span><span>Estándar enterprise</span><span>Monova Inventario — hoy</span><span>Estado</span></div>
          {benchmarkRows.map((row) => <article className="benchmark-row" key={row.capability}>
            <div className="benchmark-capability"><strong>{row.capability}</strong>{row.note && <small>{row.note}</small>}</div>
            <span>Sí</span>
            <span>{row.monova}</span>
            <span className={`stock-pill stock-${row.level}`}>{benchmarkLabel[row.level]}</span>
          </article>)}
        </div>
      </div>
      <div className="module-cards inventory-roadmap">
        {roadmapItems.map((item) => <article key={item.title}>
          <span className="priority-tag">{item.tag}</span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <small className="priority-note">{item.note}</small>
        </article>)}
      </div>
    </>}

    {productDialogOpen &&<div className="inventory-modal"><form onSubmit={saveProduct}><header><div><span><Boxes size={18}/></span><div><h2>{editingProductId ? "Editar producto" : "Nuevo producto"}</h2><p>Referencia, unidad de medida y costos.</p></div></div><button type="button" onClick={() => setProductDialogOpen(false)} aria-label="Cerrar"><X size={18}/></button></header>
      <div className="inventory-form-grid">
        <label>Nombre<input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}/></label>
        <label>SKU<input required value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })}/></label>
        <label>Categoría<select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>{categories.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label>Unidad<select value={productForm.unit} onChange={(event) => setProductForm({ ...productForm, unit: event.target.value })}>{units.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label>Costo unitario<input type="number" min="0" value={productForm.cost} onChange={(event) => setProductForm({ ...productForm, cost: Number(event.target.value) })}/></label>
        <label>Stock mínimo<input type="number" min="0" value={productForm.minStock} onChange={(event) => setProductForm({ ...productForm, minStock: Number(event.target.value) })}/></label>
        {!editingProductId && <><label>Almacén inicial<select value={productForm.initialWarehouseId} onChange={(event) => setProductForm({ ...productForm, initialWarehouseId: event.target.value })}>{warehouseList.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select></label>
        <label>Cantidad inicial<input type="number" min="0" value={productForm.initialQuantity} onChange={(event) => setProductForm({ ...productForm, initialQuantity: Number(event.target.value) })}/></label></>}
        {editingProductId && <p className="inventory-stock-note">Las existencias no se editan aquí: usa <b>Ajustar stock</b> (conteo físico) o registra un <b>Movimiento</b> para sumar o restar unidades por almacén.</p>}
      </div>
      <footer>{editingProductId && <button className="inventory-delete" type="button" onClick={() => { persistProducts(products.filter((item) => item.id !== editingProductId)); setProductDialogOpen(false); }}><Trash2 size={14}/> Eliminar</button>}<span/><button type="button" onClick={() => setProductDialogOpen(false)}>Cancelar</button><button className="create-button" type="submit">Guardar producto</button></footer>
    </form></div>}

    {movementDialogOpen && <div className="inventory-modal"><form onSubmit={saveMovement}><header><div><span><ArrowLeftRight size={18}/></span><div><h2>Nuevo movimiento</h2><p>Se registra en el historial y ajusta el stock si queda &quot;Hecho&quot;.</p></div></div><button type="button" onClick={() => setMovementDialogOpen(false)} aria-label="Cerrar"><X size={18}/></button></header>
      <div className="inventory-form-grid">
        <label>Tipo<select value={movementForm.type} onChange={(event) => { const type = event.target.value as OperationType; const toWarehouseId = type === "Traslado interno" && movementForm.toWarehouseId === movementForm.fromWarehouseId ? (warehouseList.find((warehouse) => warehouse.id !== movementForm.fromWarehouseId)?.id ?? movementForm.toWarehouseId) : movementForm.toWarehouseId; setMovementForm({ ...movementForm, type, toWarehouseId }); }}>{operationTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>Producto<select value={movementForm.productId} onChange={(event) => setMovementForm({ ...movementForm, productId: event.target.value })}>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label>
        <label>Cantidad<input type="number" min="1" value={movementForm.quantity} onChange={(event) => setMovementForm({ ...movementForm, quantity: Number(event.target.value) })}/></label>
        <label>Estado<select value={movementForm.status} onChange={(event) => setMovementForm({ ...movementForm, status: event.target.value as MovementStatus })}><option>Pendiente</option><option>Hecho</option><option>Cancelado</option></select></label>
        {movementForm.type === "Recepción" && <><label>Proveedor<input required value={movementForm.partner} onChange={(event) => setMovementForm({ ...movementForm, partner: event.target.value })}/></label><label>Almacén destino<select value={movementForm.toWarehouseId} onChange={(event) => setMovementForm({ ...movementForm, toWarehouseId: event.target.value })}>{warehouseList.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select></label></>}
        {movementForm.type === "Entrega" && <><label>Cliente<input required value={movementForm.partner} onChange={(event) => setMovementForm({ ...movementForm, partner: event.target.value })}/></label><label>Almacén origen<select value={movementForm.fromWarehouseId} onChange={(event) => setMovementForm({ ...movementForm, fromWarehouseId: event.target.value })}>{warehouseList.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select></label></>}
        {movementForm.type === "Devolución" && <><label>Cliente<input required value={movementForm.partner} onChange={(event) => setMovementForm({ ...movementForm, partner: event.target.value })}/></label><label>Almacén destino<select value={movementForm.toWarehouseId} onChange={(event) => setMovementForm({ ...movementForm, toWarehouseId: event.target.value })}>{warehouseList.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select></label></>}
        {movementForm.type === "Traslado interno" && <><label>Almacén origen<select value={movementForm.fromWarehouseId} onChange={(event) => { const fromWarehouseId = event.target.value; const toWarehouseId = movementForm.toWarehouseId === fromWarehouseId ? (warehouseList.find((warehouse) => warehouse.id !== fromWarehouseId)?.id ?? fromWarehouseId) : movementForm.toWarehouseId; setMovementForm({ ...movementForm, fromWarehouseId, toWarehouseId }); }}>{warehouseList.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select></label><label>Almacén destino<select value={movementForm.toWarehouseId} onChange={(event) => setMovementForm({ ...movementForm, toWarehouseId: event.target.value })}>{warehouseList.filter((warehouse) => warehouse.id !== movementForm.fromWarehouseId).map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select></label></>}
        <label>Fecha<input type="date" value={movementForm.date} onChange={(event) => setMovementForm({ ...movementForm, date: event.target.value })}/></label>
      </div>
      <footer><span/><button type="button" onClick={() => setMovementDialogOpen(false)}>Cancelar</button><button className="create-button" type="submit">Guardar movimiento</button></footer>
    </form></div>}

    {adjustProduct && <div className="inventory-modal"><form onSubmit={saveAdjust}><header><div><span><SlidersHorizontal size={18}/></span><div><h2>Ajustar stock</h2><p>{adjustProduct.name} · conteo físico por almacén</p></div></div><button type="button" onClick={() => setAdjustProduct(null)} aria-label="Cerrar"><X size={18}/></button></header>
      <div className="inventory-form-grid">
        <label>Almacén<select value={adjustWarehouseId} onChange={(event) => { setAdjustWarehouseId(event.target.value); setAdjustQuantity(quantityAt(adjustProduct, event.target.value)); }}>{warehouseList.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select></label>
        <label>Cantidad real contada<input type="number" min="0" value={adjustQuantity} onChange={(event) => setAdjustQuantity(Number(event.target.value))}/></label>
        <p className="inventory-stock-note">Actual en sistema: {quantityAt(adjustProduct, adjustWarehouseId)} {adjustProduct.unit}. Diferencia: {adjustQuantity - quantityAt(adjustProduct, adjustWarehouseId)} {adjustProduct.unit}.</p>
      </div>
      <footer><span/><button type="button" onClick={() => setAdjustProduct(null)}>Cancelar</button><button className="create-button" type="submit">Guardar ajuste</button></footer>
    </form></div>}
  </section>;
}
