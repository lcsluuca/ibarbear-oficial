import React, { useState, useEffect } from 'react';
import { PanelShell } from '../../components/panel/PanelShell';
import {
  getCurrentUser,
  getProducts,
  saveProduct,
  updateProductStock,
  deleteProduct,
  formatCurrency,
  subscribeToProducts,
} from '../../lib/storage';
import { Product } from '../../types';
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  DollarSign,
  Boxes,
  Loader2,
} from 'lucide-react';

/* --- COMPONENTE INTERNO DO MODAL DE EXCLUSÃO --- */
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar exclusão',
  description = 'Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.',
  itemName,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl transition-all scale-100 border border-neutral-100">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
        
        {itemName && (
          <p className="mt-1.5 text-xs font-semibold text-rose-600 bg-rose-50 py-1 px-2.5 rounded-md inline-block">
            "{itemName}"
          </p>
        )}

        <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SUGGESTED_CATEGORIES = [
  'Pomadas & Ceras',
  'Barba & Bigode',
  'Tratamento & Cuidados',
  'Acessórios',
  'Kits & Presentes',
  'Outros',
];

const PRESET_IMAGE_SUGGESTIONS = [
  {
    name: 'Pomada Matte',
    url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Óleo para Barba',
    url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Balm Pós-Barba',
    url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Shampoo Mentol',
    url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pente de Madeira',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pomada em Pó',
    url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80',
  },
];

export const PainelProdutos: React.FC = () => {
  const user = getCurrentUser();
  const shopSlug = user?.shopSlug || 'navalha';

  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Estados de Exclusão
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'hidden'>('all');

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pomadas & Ceras');
  const [customCategory, setCustomCategory] = useState('');
  const [priceReal, setPriceReal] = useState('45.00');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [minStockAlert, setMinStockAlert] = useState('4');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [showInCatalog, setShowInCatalog] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load real-time products
  useEffect(() => {
    const unsubProducts = subscribeToProducts(shopSlug, (data) => {
      setProducts(data);
    });
    return () => {
      unsubProducts();
    };
  }, [shopSlug]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Pomadas & Ceras');
    setCustomCategory('');
    setPriceReal('45.00');
    setStockQuantity('10');
    setMinStockAlert('4');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80');
    setActive(true);
    setShowInCatalog(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    if (SUGGESTED_CATEGORIES.includes(prod.category)) {
      setCategory(prod.category);
      setCustomCategory('');
    } else {
      setCategory('Outros');
      setCustomCategory(prod.category);
    }
    setPriceReal((prod.price / 100).toFixed(2));
    setStockQuantity(prod.stockQuantity.toString());
    setMinStockAlert((prod.minStockAlert ?? 4).toString());
    setDescription(prod.description || '');
    setImageUrl(prod.imageUrl || '');
    setActive(prod.active);
    setShowInCatalog(prod.showInCatalog ?? true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleToggleCatalogVisibility = (prod: Product) => {
    saveProduct({ ...prod, showInCatalog: !prod.showInCatalog });
  };

  const handleQuickStockAdjust = (prod: Product, delta: number) => {
    const newQty = Math.max(0, prod.stockQuantity + delta);
    updateProductStock(prod.id, newQty);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome do produto.');
      return;
    }

    const priceCents = Math.round(parseFloat(priceReal.replace(',', '.')) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      setErrorMsg('Informe um valor de preço válido em Reais.');
      return;
    }

    const stock = parseInt(stockQuantity, 10);
    if (isNaN(stock) || stock < 0) {
      setErrorMsg('Informe uma quantidade de estoque válida.');
      return;
    }

    const minAlert = parseInt(minStockAlert, 10);
    const resolvedCategory =
      category === 'Outros' && customCategory.trim()
        ? customCategory.trim()
        : category;

    const id = editingProduct ? editingProduct.id : `prod-${Date.now()}`;
    const productData: Product = {
      id,
      shopSlug,
      name: name.trim(),
      category: resolvedCategory,
      price: priceCents,
      stockQuantity: stock,
      minStockAlert: isNaN(minAlert) ? 3 : minAlert,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      active,
      showInCatalog,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProduct(productData);
    setIsModalOpen(false);
  };

  // Metrics calculations
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const totalStockValue = products.reduce(
    (acc, p) => acc + (p.price || 0) * (p.stockQuantity || 0),
    0
  );
  const lowStockCount = products.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= (p.minStockAlert ?? 4)
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  // Filtered list
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory !== 'all' && prod.category !== selectedCategory) {
      return false;
    }

    if (stockFilter === 'in_stock' && prod.stockQuantity <= 0) return false;
    if (stockFilter === 'low_stock' && (prod.stockQuantity === 0 || prod.stockQuantity > (prod.minStockAlert ?? 4))) return false;
    if (stockFilter === 'out_of_stock' && prod.stockQuantity > 0) return false;
    if (stockFilter === 'hidden' && prod.showInCatalog !== false) return false;

    return true;
  });

  const existingCategories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  return (
    <PanelShell
      title="Produtos & Estoque"
      action={
        <button
          id="btn-novo-produto"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Produto</span>
        </button>
      }
    >
      {/* Metrics Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-sm border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-2xs font-bold uppercase tracking-wider">Produtos</span>
            <Package className="h-4 w-4 text-neutral-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-neutral-900">
            {totalProducts}
          </p>
          <span className="text-2xs text-neutral-500">itens cadastrados</span>
        </div>

        <div className="rounded-sm border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-2xs font-bold uppercase tracking-wider">Total em Estoque</span>
            <Boxes className="h-4 w-4 text-neutral-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-neutral-900">
            {totalStockUnits}
          </p>
          <span className="text-2xs text-neutral-500">unidades disponíveis</span>
        </div>

        <div className="rounded-sm border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-2xs font-bold uppercase tracking-wider">Valor do Estoque</span>
            <DollarSign className="h-4 w-4 text-neutral-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-neutral-900">
            {formatCurrency(totalStockValue)}
          </p>
          <span className="text-2xs text-neutral-500">potencial de venda</span>
        </div>

        <div className="rounded-sm border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-2xs font-bold uppercase tracking-wider">Atenção Estoque</span>
            <AlertTriangle
              className={`h-4 w-4 ${
                lowStockCount + outOfStockCount > 0 ? 'text-amber-500' : 'text-emerald-500'
              }`}
            />
          </div>
          <p
            className={`mt-2 font-display text-2xl font-black ${
              lowStockCount + outOfStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {lowStockCount + outOfStockCount}
          </p>
          <span className="text-2xs text-neutral-500">
            {outOfStockCount > 0
              ? `${outOfStockCount} esgotados, ${lowStockCount} baixos`
              : `${lowStockCount} com estoque baixo`}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-sm border border-neutral-200 bg-white p-3.5 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            id="input-busca-produto"
            type="text"
            placeholder="Buscar por nome, categoria ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-sm border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-4 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            id="select-categoria-filtro"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-sm border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 focus:border-black focus:bg-white focus:outline-hidden"
          >
            <option value="all">Todas as Categorias</option>
            {existingCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            id="select-estoque-filtro"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="rounded-sm border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 focus:border-black focus:bg-white focus:outline-hidden"
          >
            <option value="all">Todos os Status</option>
            <option value="in_stock">Em Estoque (&gt; 0)</option>
            <option value="low_stock">Estoque Baixo</option>
            <option value="out_of_stock">Esgotado (0)</option>
            <option value="hidden">Ocultos da Vitrine</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-sm border border-dashed border-neutral-300 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-3 text-sm font-bold text-neutral-800">
            Nenhum produto encontrado
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all'
              ? 'Tente ajustar os filtros de busca acima.'
              : 'Comece cadastrando seu primeiro produto para venda e controle de estoque.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Produto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.stockQuantity <= 0;
            const isLowStock = !isOutOfStock && prod.stockQuantity <= (prod.minStockAlert ?? 4);

            return (
              <div
                key={prod.id}
                id={`card-produto-${prod.id}`}
                className={`flex flex-col justify-between rounded-sm border bg-white transition-all ${
                  !prod.active
                    ? 'border-neutral-200 bg-neutral-50/70 opacity-60'
                    : isOutOfStock
                    ? 'border-rose-200 shadow-2xs'
                    : isLowStock
                    ? 'border-amber-200 shadow-2xs'
                    : 'border-neutral-200 shadow-2xs hover:border-neutral-300'
                }`}
              >
                <div>
                  {/* Product Image & Badges */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100 rounded-t-sm border-b border-neutral-100">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                        <Package className="h-10 w-10 opacity-40" />
                      </div>
                    )}

                    {/* Category Chip */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="rounded-sm bg-black/75 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                        {prod.category}
                      </span>
                    </div>

                    {/* Visibility & Stock Badges */}
                    <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                      {isOutOfStock ? (
                        <span className="rounded-sm bg-rose-600 px-2 py-0.5 text-2xs font-bold uppercase text-white shadow-xs">
                          Esgotado
                        </span>
                      ) : isLowStock ? (
                        <span className="rounded-sm bg-amber-500 px-2 py-0.5 text-2xs font-bold uppercase text-white shadow-xs">
                          Estoque Baixo
                        </span>
                      ) : (
                        <span className="rounded-sm bg-emerald-600 px-2 py-0.5 text-2xs font-bold uppercase text-white shadow-xs">
                          Em Estoque
                        </span>
                      )}

                      {prod.showInCatalog === false && (
                        <span className="rounded-sm bg-neutral-800 px-1.5 py-0.5 text-3xs font-bold uppercase text-neutral-200">
                          Oculto na Vitrine
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-neutral-900 text-sm leading-snug line-clamp-2">
                        {prod.name}
                      </h3>
                      <span className="font-display font-black text-neutral-900 text-base whitespace-nowrap">
                        {formatCurrency(prod.price)}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 line-clamp-2">
                      {prod.description || 'Sem descrição informada.'}
                    </p>

                    {/* Stock Quick Control Box */}
                    <div className="mt-4 rounded-sm border border-neutral-100 bg-neutral-50/80 p-2.5 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-2xs font-bold uppercase text-neutral-400 block">
                          Quantidade em Estoque
                        </span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className={`text-sm ${
                              isOutOfStock
                                ? 'text-rose-600 font-black'
                                : isLowStock
                                ? 'text-amber-600 font-black'
                                : 'text-neutral-900'
                            }`}
                          >
                            {prod.stockQuantity} {prod.stockQuantity === 1 ? 'unidade' : 'unidades'}
                          </span>
                          {prod.minStockAlert && (
                            <span className="text-2xs text-neutral-400 font-normal">
                              (mín: {prod.minStockAlert})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          id={`btn-stock-minus-${prod.id}`}
                          onClick={() => handleQuickStockAdjust(prod, -1)}
                          disabled={prod.stockQuantity <= 0}
                          title="Diminuir 1 do estoque"
                          className="flex h-7 w-7 items-center justify-center rounded-sm border border-neutral-300 bg-white text-xs font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
                        >
                          -
                        </button>
                        <button
                          id={`btn-stock-plus-${prod.id}`}
                          onClick={() => handleQuickStockAdjust(prod, 1)}
                          title="Adicionar 1 ao estoque"
                          className="flex h-7 w-7 items-center justify-center rounded-sm border border-neutral-300 bg-white text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50/40">
                  <div className="flex items-center justify-between">
                    {/* Catalog Visibility Quick Toggle */}
                    <button
                      id={`btn-toggle-catalog-${prod.id}`}
                      onClick={() => handleToggleCatalogVisibility(prod)}
                      title={
                        prod.showInCatalog !== false
                          ? 'Visível na vitrine pública. Clique para ocultar.'
                          : 'Oculto na vitrine pública. Clique para exibir.'
                      }
                      className={`inline-flex items-center gap-1 text-2xs font-bold rounded px-2 py-1 transition-colors ${
                        prod.showInCatalog !== false
                          ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {prod.showInCatalog !== false ? (
                        <>
                          <Eye className="h-3.5 w-3.5 text-neutral-500" />
                          <span>Na vitrine</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                          <span>Oculto</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        id={`btn-editar-prod-${prod.id}`}
                        onClick={() => handleOpenEdit(prod)}
                        className="rounded-sm border border-neutral-200 bg-white p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-black shadow-2xs"
                        title="Editar produto"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        id={`btn-excluir-prod-${prod.id}`}
                        onClick={() => setProductToDelete(prod)}
                        className="rounded-sm border border-neutral-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shadow-2xs transition-colors"
                        title="Excluir produto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div
          id="modal-produto"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="w-full max-w-xl rounded-sm border border-neutral-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-neutral-900">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Preencha as informações para venda e controle de estoque.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 flex items-center gap-2 rounded bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Nome do Produto <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-prod-nome"
                  type="text"
                  required
                  placeholder="Ex: Pomada Modeladora Efeito Matte 120g"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Categoria
                  </label>
                  <select
                    id="select-prod-categoria"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-hidden"
                  >
                    {SUGGESTED_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {category === 'Outros' && (
                    <input
                      type="text"
                      placeholder="Especifique a categoria personalizada"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-2 w-full rounded-sm border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-black focus:outline-hidden"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Preço de Venda (R$) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                      R$
                    </span>
                    <input
                      id="input-prod-preco"
                      type="text"
                      required
                      placeholder="45.00"
                      value={priceReal}
                      onChange={(e) => setPriceReal(e.target.value)}
                      className="w-full rounded-sm border border-neutral-300 py-2 pl-9 pr-3 text-sm text-neutral-900 focus:border-black focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Quantidade em Estoque <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-prod-estoque"
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Aviso de Estoque Baixo (unidades)
                  </label>
                  <input
                    id="input-prod-min-alerta"
                    type="number"
                    min="0"
                    placeholder="4"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Descrição & Benefícios
                </label>
                <textarea
                  id="input-prod-descricao"
                  rows={2}
                  placeholder="Ex: Fixação forte e efeito matte, ideal para cabelos curtos e médios..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  URL da Foto do Produto
                </label>
                <input
                  id="input-prod-imagem"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-hidden"
                />

                {/* Quick Presets */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-3xs font-bold uppercase text-neutral-400">
                    Sugestões rápidas de fotos:
                  </span>
                  {PRESET_IMAGE_SUGGESTIONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className="rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-2xs font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-black"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="rounded border border-neutral-100 bg-neutral-50 p-3 space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    id="checkbox-prod-vitrine"
                    type="checkbox"
                    checked={showInCatalog}
                    onChange={(e) => setShowInCatalog(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-neutral-900 block">
                      Exibir na vitrine do site de agendamento (/b/{shopSlug})
                    </span>
                    <span className="text-neutral-500">
                      Permite que os clientes vejam este produto ao reservar horário.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    id="checkbox-prod-ativo"
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-neutral-900 block">
                      Produto ativo para venda
                    </span>
                    <span className="text-neutral-500">
                      Desmarque caso o produto tenha sido descontinuado temporariamente.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-sm border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  id="btn-salvar-produto"
                  type="submit"
                  className="rounded-sm bg-black px-6 py-2 text-xs font-bold text-white hover:bg-neutral-800 shadow-xs"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={productToDelete?.name}
        title="Excluir Produto"
        description="Tem certeza de que deseja excluir este produto do estoque? Esta ação não pode ser desfeita."
        loading={isDeleting}
      />
    </PanelShell>
  );
};