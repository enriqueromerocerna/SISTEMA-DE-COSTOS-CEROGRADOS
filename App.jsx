import React, { useState, useEffect, useMemo } from "react";
import logo from "./assets/cero-grados-logo.png";
import {
  Snowflake,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Plus,
  Trash2,
  Pencil,
  X,
  AlertCircle,
  RotateCcw,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const UNIDADES = ["g", "kg", "ml", "L", "pza", "oz", "lb"];
const STORAGE_KEY = "cerogrados-costos-v1";

const defaultData = {
  insumos: [],
  productos: [],
  costosFijos: [],
  ventasEstimadas: "",
  moneda: "S/",
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const costoUnitario = (insumo) => {
  const cant = parseFloat(insumo?.cantidadCompra);
  const precio = parseFloat(insumo?.precioCompra);
  if (!cant || cant <= 0 || !isFinite(precio) || precio < 0) return 0;
  return precio / cant;
};

const calcCostoIngredientes = (producto, insumos) =>
  (producto.ingredientes || []).reduce((sum, ing) => {
    const insumo = insumos.find((i) => i.id === ing.insumoId);
    if (!insumo) return sum;
    return sum + costoUnitario(insumo) * (parseFloat(ing.cantidad) || 0);
  }, 0);

const calcPrecio = (costoTotal, margen) => {
  const m = parseFloat(margen) || 0;
  if (m <= 0) return costoTotal;
  if (m >= 100) return costoTotal * 2;
  return costoTotal / (1 - m / 100);
};

const fmt = (n, moneda = "S/") => `${moneda} ${(Number(n) || 0).toFixed(2)}`;

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    navy: "cg-bg-navy-tint cg-text-navy",
    pink: "cg-bg-pink-tint cg-text-pink",
    slate: "bg-slate-100 text-slate-700",
    yellow: "cg-bg-yellow-tint cg-text-navy",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${tones[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-bold text-slate-800 leading-tight break-words">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <Icon className="w-9 h-9 text-slate-300 mx-auto mb-3" />
      <p className="font-medium text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{text}</p>
    </div>
  );
}

function Header({ saveStatus, onReset }) {
  return (
    <header className="cg-bg-pink">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-white rounded-2xl px-3 py-2 shadow-sm shrink-0">
            <img src={logo} alt="Cero Grados" className="h-7 w-auto block" />
          </div>
          <p className="text-white text-xs font-medium leading-snug">Sistema de costos y precios</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-white hidden sm:inline">
            {saveStatus === "saving" ? "Guardando…" : saveStatus === "saved" ? "Guardado ✓" : ""}
          </span>
          <button
            onClick={onReset}
            title="Borrar todos los datos"
            className="p-2 rounded-lg cg-bg-navy hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}

function TabNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
    { id: "insumos", label: "Insumos", icon: Package },
    { id: "productos", label: "Productos", icon: ShoppingCart },
    { id: "fijos", label: "Costos fijos", icon: Receipt },
  ];
  return (
    <nav className="max-w-5xl mx-auto px-4 mt-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors " +
                (active ? "cg-bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function DashboardTab({ productosCalc, insumosCount, moneda }) {
  const costos = productosCalc.map((p) => p.costoTotal);
  const precios = productosCalc.map((p) => p.precio);
  const costoPromedio = costos.length ? costos.reduce((a, b) => a + b, 0) / costos.length : 0;
  const precioPromedio = precios.length ? precios.reduce((a, b) => a + b, 0) / precios.length : 0;

  const chartData = productosCalc.map((p) => ({
    nombre: p.nombre.length > 10 ? p.nombre.slice(0, 10) + "…" : p.nombre,
    Costo: Number(p.costoTotal.toFixed(2)),
    Precio: Number(p.precio.toFixed(2)),
  }));

  return (
    <div className="space-y-5">
      <h2 className="cg-display text-lg font-semibold cg-text-navy">Resumen</h2>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Insumos registrados" value={insumosCount} icon={Package} tone="navy" />
        <StatCard label="Productos" value={productosCalc.length} icon={ShoppingCart} tone="pink" />
        <StatCard label="Costo promedio" value={fmt(costoPromedio, moneda)} icon={DollarSign} tone="slate" />
        <StatCard label="Precio promedio" value={fmt(precioPromedio, moneda)} icon={TrendingUp} tone="yellow" />
      </div>

      {productosCalc.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Aún no tienes productos"
          text="Agrega tus insumos y luego crea tu primer producto para ver aquí el costo y precio sugerido."
        />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Costo vs. precio sugerido</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Costo" fill="#2A0C62" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Precio" fill="#FF018F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <h3 className="font-semibold text-slate-800 px-4 pt-4 text-sm">Resumen por producto</h3>
            <div className="divide-y divide-slate-100 mt-2">
              {productosCalc.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{p.nombre}</p>
                    <p className="text-xs text-slate-500">Costo {fmt(p.costoTotal, moneda)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold cg-text-navy text-sm">{fmt(p.precio, moneda)}</p>
                    <p className="text-xs text-emerald-600">+{fmt(p.ganancia, moneda)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InsumoForm({ initial, onSave, onCancel }) {
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [precioCompra, setPrecioCompra] = useState(initial?.precioCompra ?? "");
  const [cantidadCompra, setCantidadCompra] = useState(initial?.cantidadCompra ?? "");
  const [unidad, setUnidad] = useState(initial?.unidad || "g");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!nombre.trim()) return setError("Ponle un nombre al insumo.");
    if (!(parseFloat(precioCompra) > 0)) return setError("El precio de compra debe ser mayor a 0.");
    if (!(parseFloat(cantidadCompra) > 0)) return setError("La cantidad debe ser mayor a 0.");
    setError("");
    onSave({ nombre: nombre.trim(), precioCompra, cantidadCompra, unidad });
  };

  const preview = costoUnitario({ precioCompra, cantidadCompra });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-500">Nombre del insumo</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Hielo, Jarabe de fresa, Vaso 12oz"
          className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm cg-input"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500">Precio de compra</label>
          <input
            type="number"
            inputMode="decimal"
            value={precioCompra}
            onChange={(e) => setPrecioCompra(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm cg-input"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Cantidad que rinde</label>
          <input
            type="number"
            inputMode="decimal"
            value={cantidadCompra}
            onChange={(e) => setCantidadCompra(e.target.value)}
            placeholder="0"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm cg-input"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">Unidad</label>
        <select
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
          className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm cg-input"
        >
          {UNIDADES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {preview > 0 && (
        <p className="text-xs text-slate-500">
          Costo por {unidad}: <span className="font-semibold text-slate-700">{preview.toFixed(4)}</span>
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          className="flex-1 cg-bg-navy text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          Guardar
        </button>
        <button onClick={onCancel} className="px-4 text-sm font-medium text-slate-500 hover:text-slate-700">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function InsumoCard({ insumo, moneda, editing, onStartEdit, onCancelEdit, onSave, onDelete }) {
  if (editing) {
    return <InsumoForm initial={insumo} onSave={onSave} onCancel={onCancelEdit} />;
  }
  const costo = costoUnitario(insumo);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="font-medium text-slate-800 text-sm truncate">{insumo.nombre}</p>
        <p className="text-xs text-slate-500">
          {fmt(insumo.precioCompra, moneda)} por {insumo.cantidadCompra}
          {insumo.unidad} · {fmt(costo, moneda)}/{insumo.unidad}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onStartEdit} className="p-1.5 text-slate-400 cg-hover-navy">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function InsumosTab({ insumos, moneda, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="cg-display text-lg font-semibold cg-text-navy">Insumos</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm((s) => !s);
          }}
          className="flex items-center gap-1 text-sm font-medium cg-bg-navy text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Insumo
        </button>
      </div>

      {showForm && (
        <InsumoForm
          onSave={(insumo) => {
            onAdd(insumo);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {insumos.length === 0 && !showForm ? (
        <EmptyState
          icon={Package}
          title="Aún no agregaste insumos"
          text="Agrega hielo, jarabes, vasos, leche condensada y todo lo que compras para preparar tus raspadillas."
        />
      ) : (
        <div className="space-y-2">
          {insumos.map((i) => (
            <InsumoCard
              key={i.id}
              insumo={i}
              moneda={moneda}
              editing={editingId === i.id}
              onStartEdit={() => setEditingId(i.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(patch) => {
                onEdit(i.id, patch);
                setEditingId(null);
              }}
              onDelete={() => onDelete(i.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductoForm({ initial, insumos, costoFijoPorUnidad, moneda, onSave, onCancel }) {
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [ingredientes, setIngredientes] = useState(initial?.ingredientes || []);
  const [margen, setMargen] = useState(initial?.margen ?? 40);
  const [incluirCostoFijo, setIncluirCostoFijo] = useState(initial?.incluirCostoFijo ?? false);
  const [selInsumo, setSelInsumo] = useState(insumos[0]?.id || "");
  const [selCantidad, setSelCantidad] = useState("");
  const [error, setError] = useState("");

  const addIngrediente = () => {
    if (!selInsumo || !(parseFloat(selCantidad) > 0)) return;
    const existing = ingredientes.find((i) => i.insumoId === selInsumo);
    if (existing) {
      setIngredientes(
        ingredientes.map((i) =>
          i.insumoId === selInsumo
            ? { ...i, cantidad: (parseFloat(i.cantidad) + parseFloat(selCantidad)).toString() }
            : i
        )
      );
    } else {
      setIngredientes([...ingredientes, { insumoId: selInsumo, cantidad: selCantidad }]);
    }
    setSelCantidad("");
  };

  const removeIngrediente = (insumoId) => setIngredientes(ingredientes.filter((i) => i.insumoId !== insumoId));

  const costoIng = calcCostoIngredientes({ ingredientes }, insumos);
  const costoTotal = costoIng + (incluirCostoFijo ? costoFijoPorUnidad : 0);
  const precio = calcPrecio(costoTotal, margen);

  const handleSubmit = () => {
    if (!nombre.trim()) return setError("Ponle un nombre al producto.");
    if (ingredientes.length === 0) return setError("Agrega al menos un ingrediente.");
    setError("");
    onSave({ nombre: nombre.trim(), ingredientes, margen: parseFloat(margen) || 0, incluirCostoFijo });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-500">Nombre del producto</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Raspadilla chica, Raspadilla especial"
          className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm cg-input"
        />
      </div>

      {insumos.length === 0 ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No tienes insumos registrados todavía.
        </p>
      ) : (
        <div>
          <label className="text-xs font-medium text-slate-500">Ingredientes</label>
          <div className="flex gap-2 mt-1">
            <select
              value={selInsumo}
              onChange={(e) => setSelInsumo(e.target.value)}
              className="flex-1 min-w-0 border border-slate-300 rounded-lg px-2 py-2 text-sm cg-input"
            >
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              value={selCantidad}
              onChange={(e) => setSelCantidad(e.target.value)}
              placeholder="Cant."
              className="w-16 border border-slate-300 rounded-lg px-2 py-2 text-sm cg-input"
            />
            <button
              onClick={addIngrediente}
              className="cg-bg-pink text-white px-3 rounded-lg hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {ingredientes.length > 0 && (
            <ul className="mt-2 space-y-1">
              {ingredientes.map((ing) => {
                const insumo = insumos.find((i) => i.id === ing.insumoId);
                if (!insumo) return null;
                const sub = costoUnitario(insumo) * (parseFloat(ing.cantidad) || 0);
                return (
                  <li
                    key={ing.insumoId}
                    className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5 text-sm gap-2"
                  >
                    <span className="text-slate-700 truncate">
                      {insumo.nombre} · {ing.cantidad}
                      {insumo.unidad}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-500 text-xs">{fmt(sub, moneda)}</span>
                      <button onClick={() => removeIngrediente(ing.insumoId)} className="text-slate-400 hover:text-red-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 items-start">
        <div>
          <label className="text-xs font-medium text-slate-500">Margen de ganancia (%)</label>
          <input
            type="number"
            inputMode="decimal"
            value={margen}
            onChange={(e) => setMargen(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm cg-input"
          />
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-600 pt-6">
          <input
            type="checkbox"
            checked={incluirCostoFijo}
            onChange={(e) => setIncluirCostoFijo(e.target.checked)}
            className="w-4 h-4 cg-checkbox mt-0.5 shrink-0"
          />
          <span>Incluir costo fijo por unidad ({fmt(costoFijoPorUnidad, moneda)})</span>
        </label>
      </div>

      <div className="cg-bg-pink-tint rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-slate-500">Costo</p>
          <p className="font-semibold text-slate-800 text-sm">{fmt(costoTotal, moneda)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Precio</p>
          <p className="font-semibold cg-text-navy text-sm">{fmt(precio, moneda)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Ganancia</p>
          <p className="font-semibold text-emerald-600 text-sm">{fmt(precio - costoTotal, moneda)}</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="flex-1 cg-bg-navy text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          Guardar producto
        </button>
        <button onClick={onCancel} className="px-4 text-sm font-medium text-slate-500 hover:text-slate-700">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ProductoCard({ producto, moneda, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{producto.nombre}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {producto.ingredientes.length} ingrediente{producto.ingredientes.length !== 1 ? "s" : ""} · margen{" "}
            {producto.margen}%
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-slate-400 cg-hover-navy">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
        <div>
          <p className="text-xs text-slate-500">Costo</p>
          <p className="font-semibold text-slate-800 text-sm">{fmt(producto.costoTotal, moneda)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Precio</p>
          <p className="font-semibold cg-text-navy text-sm">{fmt(producto.precio, moneda)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Ganancia</p>
          <p className="font-semibold text-emerald-600 text-sm">{fmt(producto.ganancia, moneda)}</p>
        </div>
      </div>
    </div>
  );
}

function ProductosTab({ productosCalc, insumos, costoFijoPorUnidad, moneda, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="cg-display text-lg font-semibold cg-text-navy">Productos</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm((s) => !s);
          }}
          disabled={insumos.length === 0}
          className="flex items-center gap-1 text-sm font-medium cg-bg-navy text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" /> Producto
        </button>
      </div>

      {insumos.length === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Primero agrega tus insumos en la pestaña "Insumos" para poder armar un producto.
        </p>
      )}

      {showForm && (
        <ProductoForm
          insumos={insumos}
          costoFijoPorUnidad={costoFijoPorUnidad}
          moneda={moneda}
          onSave={(p) => {
            onAdd(p);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {productosCalc.length === 0 && !showForm ? (
        <EmptyState
          icon={ShoppingCart}
          title="Aún no agregaste productos"
          text="Crea tu primera raspadilla combinando los insumos que ya registraste."
        />
      ) : (
        <div className="space-y-3">
          {productosCalc.map((p) =>
            editingId === p.id ? (
              <ProductoForm
                key={p.id}
                initial={p}
                insumos={insumos}
                costoFijoPorUnidad={costoFijoPorUnidad}
                moneda={moneda}
                onSave={(patch) => {
                  onEdit(p.id, patch);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <ProductoCard key={p.id} producto={p} moneda={moneda} onEdit={() => setEditingId(p.id)} onDelete={() => onDelete(p.id)} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function CostosFijosTab({ costosFijos, ventasEstimadas, costoFijoTotal, costoFijoPorUnidad, moneda, onAdd, onDelete, onChangeVentas }) {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");

  const handleAdd = () => {
    if (!nombre.trim() || !(parseFloat(monto) > 0)) return;
    onAdd({ nombre: nombre.trim(), monto });
    setNombre("");
    setMonto("");
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="cg-display text-lg font-semibold cg-text-navy">Costos fijos mensuales</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1 text-sm font-medium cg-bg-navy text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Costo
        </button>
      </div>

      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        Opcional: costos como alquiler, luz, agua o sueldos, repartidos entre tus ventas del mes para saber cuánto le
        suman a cada raspadilla.
      </p>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Alquiler del puesto"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm cg-input"
          />
          <input
            type="number"
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Monto mensual"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm cg-input"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 cg-bg-navy text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              Guardar
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 text-sm font-medium text-slate-500">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {costosFijos.length === 0 && !showForm ? (
        <EmptyState
          icon={Receipt}
          title="Sin costos fijos registrados"
          text="Puedes omitir esto si por ahora solo quieres calcular el costo de tus insumos."
        />
      ) : (
        <div className="space-y-2">
          {costosFijos.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-2">
              <p className="text-sm text-slate-700 truncate">{c.nombre}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-slate-800">{fmt(c.monto, moneda)}</span>
                <button onClick={() => onDelete(c.id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500">Ventas estimadas al mes (unidades)</label>
          <input
            type="number"
            inputMode="decimal"
            value={ventasEstimadas}
            onChange={(e) => onChangeVentas(e.target.value)}
            placeholder="Ej: 600"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm cg-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Total costos fijos</p>
            <p className="font-semibold text-slate-800">{fmt(costoFijoTotal, moneda)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Por unidad vendida</p>
            <p className="font-semibold cg-text-navy">{fmt(costoFijoPorUnidad, moneda)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CeroGradosDashboard() {
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({ ...defaultData, ...parsed });
      }
    } catch (e) {
      // sin datos previos guardados, empezamos de cero
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSaveStatus("saved");
      } catch (e) {
        setSaveStatus("idle");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [data, loaded]);

  const updateData = (patch) => setData((d) => ({ ...d, ...patch }));

  const addInsumo = (insumo) => updateData({ insumos: [...data.insumos, { ...insumo, id: uid() }] });
  const editInsumo = (id, patch) => updateData({ insumos: data.insumos.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const deleteInsumo = (id) =>
    updateData({
      insumos: data.insumos.filter((i) => i.id !== id),
      productos: data.productos.map((p) => ({
        ...p,
        ingredientes: p.ingredientes.filter((ing) => ing.insumoId !== id),
      })),
    });

  const addProducto = (producto) => updateData({ productos: [...data.productos, { ...producto, id: uid() }] });
  const editProducto = (id, patch) => updateData({ productos: data.productos.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const deleteProducto = (id) => updateData({ productos: data.productos.filter((p) => p.id !== id) });

  const addCostoFijo = (c) => updateData({ costosFijos: [...data.costosFijos, { ...c, id: uid() }] });
  const deleteCostoFijo = (id) => updateData({ costosFijos: data.costosFijos.filter((c) => c.id !== id) });

  const costoFijoTotal = useMemo(
    () => data.costosFijos.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0),
    [data.costosFijos]
  );
  const costoFijoPorUnidad = useMemo(() => {
    const ventas = parseFloat(data.ventasEstimadas);
    return ventas > 0 ? costoFijoTotal / ventas : 0;
  }, [costoFijoTotal, data.ventasEstimadas]);

  const productosCalc = useMemo(
    () =>
      data.productos.map((p) => {
        const costoIng = calcCostoIngredientes(p, data.insumos);
        const costoTotal = costoIng + (p.incluirCostoFijo ? costoFijoPorUnidad : 0);
        const precio = calcPrecio(costoTotal, p.margen);
        return { ...p, costoIngredientes: costoIng, costoTotal, precio, ganancia: precio - costoTotal };
      }),
    [data.productos, data.insumos, costoFijoPorUnidad]
  );

  return (
    <div className="cg-app min-h-screen bg-slate-50 pb-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .cg-app { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
        .cg-display { font-family: 'Baloo 2', ui-sans-serif, system-ui, sans-serif; }
        .cg-bg-navy { background-color: #2A0C62; }
        .cg-bg-pink { background-color: #FF018F; }
        .cg-bg-yellow { background-color: #FFCC00; }
        .cg-bg-pink-tint { background-color: #FFE1F2; }
        .cg-bg-yellow-tint { background-color: #FFF7D9; }
        .cg-bg-navy-tint { background-color: #EEECF2; }
        .cg-text-navy { color: #2A0C62; }
        .cg-text-pink { color: #FF018F; }
        .cg-hover-navy:hover { color: #2A0C62; }
        .cg-input { transition: border-color .15s ease, box-shadow .15s ease; }
        .cg-input:focus { outline: none; border-color: #2A0C62; box-shadow: 0 0 0 3px rgba(42,12,98,0.15); }
        .cg-checkbox { accent-color: #2A0C62; }
      `}</style>

      {!loaded ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 cg-text-navy">
            <Snowflake className="w-8 h-8 animate-spin" />
            <p className="text-sm">Cargando…</p>
          </div>
        </div>
      ) : (
        <>
          <Header saveStatus={saveStatus} onReset={() => setConfirmReset(true)} />

          {confirmReset && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3">
              <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-red-700">¿Borrar todos los insumos, productos y costos guardados?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setData(defaultData);
                      setConfirmReset(false);
                    }}
                    className="text-sm font-medium bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Sí, borrar
                  </button>
                  <button onClick={() => setConfirmReset(false)} className="text-sm font-medium text-slate-600 px-3 py-1">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto px-4 pt-3 flex justify-end">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              Moneda
              <input
                value={data.moneda}
                onChange={(e) => updateData({ moneda: e.target.value })}
                maxLength={4}
                className="w-14 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-600 cg-input"
              />
            </label>
          </div>

          <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="max-w-5xl mx-auto px-4 py-4">
            {activeTab === "dashboard" && (
              <DashboardTab productosCalc={productosCalc} insumosCount={data.insumos.length} moneda={data.moneda} />
            )}
            {activeTab === "insumos" && (
              <InsumosTab insumos={data.insumos} moneda={data.moneda} onAdd={addInsumo} onEdit={editInsumo} onDelete={deleteInsumo} />
            )}
            {activeTab === "productos" && (
              <ProductosTab
                productosCalc={productosCalc}
                insumos={data.insumos}
                costoFijoPorUnidad={costoFijoPorUnidad}
                moneda={data.moneda}
                onAdd={addProducto}
                onEdit={editProducto}
                onDelete={deleteProducto}
              />
            )}
            {activeTab === "fijos" && (
              <CostosFijosTab
                costosFijos={data.costosFijos}
                ventasEstimadas={data.ventasEstimadas}
                costoFijoTotal={costoFijoTotal}
                costoFijoPorUnidad={costoFijoPorUnidad}
                moneda={data.moneda}
                onAdd={addCostoFijo}
                onDelete={deleteCostoFijo}
                onChangeVentas={(v) => updateData({ ventasEstimadas: v })}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
