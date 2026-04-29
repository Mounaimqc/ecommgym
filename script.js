// script.js
import { collection, getDocs, addDoc, query, doc, updateDoc, getDoc, orderBy }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';

// ========== GLOBAL VARIABLES ==========
let products = [];
let allFilteredProducts = [];
let displayedCount = 10;
const itemsPerPage = 10;
let cart = [];
let currentProductId = null;

// ========== PLACEHOLDER IMAGE ==========
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%231e293b' width='300' height='200'/%3E%3Ccircle cx='150' cy='80' r='40' fill='%23334155'/%3E%3Crect x='60' y='140' width='180' height='20' rx='10' fill='%23334155'/%3E%3Ctext x='50%25' y='185' font-family='Arial' font-size='12' fill='%2394a3b8' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E`;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function () {
  console.log("⚡ IronPulse Started...");
  saveFilterButtonNames();
  loadProductsFromFirebase();
  setupEventListeners();
  loadCartFromStorage();
  populateShippingTable();

  const modalBtn = document.getElementById('modalAddToCartBtn');
  if (modalBtn) {
    modalBtn.addEventListener('click', () => {
      if (currentProductId) {
        addToCart(currentProductId);
        document.getElementById('productDetailModal').classList.remove('active');
      }
    });
  }
});

// ========== SAVE FILTER BUTTON NAMES ==========
function saveFilterButtonNames() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const text = btn.textContent.trim().split('<')[0].trim();
    btn.dataset.baseName = text;
  });
}

// ========== COUNT PRODUCTS BY CATEGORY ==========
function countProductsByCategory(productList = products) {
  const counts = {
    'all': 0, 'Whey': 0, 'Gainer': 0, 'BCAA': 0, 'PreWorkout': 0, 'FatBurner': 0
  };
  productList.forEach(product => {
    const cat = product.category;
    if (counts[cat] !== undefined) counts[cat]++;
    counts['all']++;
  });
  return counts;
}

function updateCategoryCounts(productList = products) {
  const counts = countProductsByCategory(productList);
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const category = btn.getAttribute('data-category');
    const count = counts[category] ?? 0;
    const baseName = btn.dataset.baseName || btn.textContent.trim().split('<')[0].trim();
    btn.innerHTML = `${baseName} <span class="category-count">${count}</span>`;
  });
}

// ========== LOAD PRODUCTS FROM FIREBASE ==========
async function loadProductsFromFirebase() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = `<div style="text-align:center; padding:60px; color:var(--secondary); grid-column:1/-1;">
    <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem;"></i>
    <p style="margin-top:16px;">Loading products...</p></div>`;

  try {
    const productsRef = collection(db, "produits");
    const productsQuery = query(productsRef, orderBy("dateAdded", "desc"));
    const querySnapshot = await getDocs(productsQuery);

    products = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      products.push({
        id: docSnap.id,
        name: data.name || 'Product',
        price: parseFloat(data.price) || 0,
        category: data.category || 'Other',
        description: data.description || '',
        image: data.image || '',
        quantity: parseInt(data.quantity) || 0,
        dateAdded: data.dateAdded
      });
    });

    console.log(`✅ ${products.length} products loaded`);

    if (products.length === 0) {
      grid.innerHTML = `<div style="text-align:center; padding:60px; color:var(--danger); grid-column:1/-1;">
        <i class="fa-solid fa-box-open" style="font-size:3rem; margin-bottom:16px;"></i>
        <p>No products available yet.</p></div>`;
    } else {
      allFilteredProducts = [...products];
      displayedCount = itemsPerPage;
      updateCategoryCounts();
      loadProducts();
    }
  } catch (error) {
    console.error("❌ Error loading products:", error);
    grid.innerHTML = `<div style="text-align:center; padding:60px; color:var(--danger); grid-column:1/-1;">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem;"></i>
      <p>Error loading products. Check console.</p></div>`;
  }
}

// ========== DISPLAY PRODUCTS ==========
function loadProducts() {
  const grid = document.getElementById('productsGrid');
  const paginationContainer = document.getElementById('paginationContainer');

  if (!allFilteredProducts?.length) {
    grid.innerHTML = `<div style="text-align:center; padding:60px; color:var(--text-muted); grid-column:1/-1;">
      <i class="fa-solid fa-search" style="font-size:3rem;"></i><p>No products found.</p></div>`;
    if (paginationContainer) paginationContainer.style.display = 'none';
    return;
  }

  const productsToDisplay = allFilteredProducts.slice(0, displayedCount);
  grid.innerHTML = '';

  productsToDisplay.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.add-to-cart-btn')) openProductDetail(product.id);
    });

    const img = document.createElement('img');
    img.src = (product.image?.trim()) ? product.image : PLACEHOLDER_SVG;
    img.alt = product.name;
    img.className = 'product-image';
    img.onerror = function() { this.src = PLACEHOLDER_SVG; };

    const quantity = product.quantity || 0;
    const info = document.createElement('div');
    info.className = 'product-info';
    info.innerHTML = `
      <h3 class="product-name">${product.name}</h3>
      <p class="product-category">${product.category}</p>
      <p class="product-description">${truncateDescription(product.description, 50)}</p>
      <span class="product-quantity ${quantity <= 0 ? 'out-of-stock' : ''}">
        ${quantity > 0 ? `${quantity} in stock` : 'Out of stock'}
      </span>
      <div class="product-footer">
        <span class="product-price">${product.price.toFixed(2)} DA</span>
        <button class="add-to-cart-btn" data-product-id="${product.id}" ${quantity <= 0 ? 'disabled' : ''}>
          ${quantity > 0 ? '<i class="fa-solid fa-cart-plus"></i> Add' : 'Sold Out'}
        </button>
      </div>`;

    card.appendChild(img);
    card.appendChild(info);
    grid.appendChild(card);
  });

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.getAttribute('data-product-id'));
    });
  });

  if (paginationContainer) {
    paginationContainer.style.display = displayedCount < allFilteredProducts.length ? 'block' : 'none';
  }
}

function truncateDescription(desc, max) {
  if (!desc) return '';
  return desc.length <= max ? desc : desc.substring(0, max) + '...';
}

function openProductDetail(productId) {
  window.location.href = `produit.html?id=${productId}`;
}

function handleShowMore() {
  displayedCount += itemsPerPage;
  loadProducts();
}

// ========== CART FUNCTIONS ==========
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  if ((product.quantity || 0) <= 0) {
    showNotification('Out of stock!', 'error');
    return;
  }

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    if (existing.quantity >= product.quantity) {
      showNotification('Max quantity reached!', 'error');
      return;
    }
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCartToStorage();
  updateCartCount();
  showNotification(`${product.name} added to cart!`, 'success');
}

function updateCartQuantity(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  } else {
    const max = products.find(p => p.id === productId)?.quantity || 0;
    if (item.quantity > max) item.quantity = max;
  }
  saveCartToStorage();
  updateCartCount();
  displayCart();
}

function removeCartItem(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCartToStorage();
  updateCartCount();
  displayCart();
}

function displayCart() {
  const cartItems = document.getElementById('cartItems');
  if (!cartItems) return;

  let total = 0;
  if (!cart.length) {
    cartItems.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:40px 0;">Your cart is empty</p>`;
    document.getElementById('totalPrice').textContent = '0';
    document.getElementById('checkoutBtn').disabled = true;
    return;
  }

  cartItems.innerHTML = '';
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info" style="flex:1;">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price.toFixed(2)} DA × ${item.quantity} = ${itemTotal.toFixed(2)} DA</div>
      </div>
      <div class="cart-item-quantity" style="display:flex; align-items:center; gap:8px;">
        <button class="quantity-btn" onclick="window.updateCartQuantity('${item.id}', -1)">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-btn" onclick="window.updateCartQuantity('${item.id}', 1)">+</button>
      </div>
      <button class="remove-btn" onclick="window.removeCartItem('${item.id}')">✕</button>`;
    cartItems.appendChild(div);
  });

  document.getElementById('totalPrice').textContent = total.toFixed(2);
  document.getElementById('checkoutBtn').disabled = false;
}

function updateCartCount() {
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = count;
}

function saveCartToStorage() { localStorage.setItem('cart', JSON.stringify(cart)); }
function loadCartFromStorage() {
  const saved = localStorage.getItem('cart');
  if (saved) { try { cart = JSON.parse(saved); updateCartCount(); } catch(e) { cart = []; } }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Cart Modal
  const cartBtn = document.getElementById('cartBtn');
  const cartModal = document.getElementById('cartModal');
  if (cartBtn && cartModal) {
    cartBtn.addEventListener('click', () => { cartModal.classList.add('active'); displayCart(); });
  }

  // Close Modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal-overlay')?.classList.remove('active'));
  });
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); });

  // Checkout
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cart.length) { cartModal?.classList.remove('active'); openOrderForm(); }
  });

  // Search & Filter
  document.getElementById('searchInput')?.addEventListener('input', filterProducts);
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      filterProducts();
    });
  });

  // Show More
  document.getElementById('showMoreBtn')?.addEventListener('click', handleShowMore);

  // Wilaya Search
  document.getElementById('wilayaSearch')?.addEventListener('input', filterShippingTable);

  // Order Form
  const wilayaSel = document.getElementById('wilaya');
  const communeSel = document.getElementById('commune');
  if (wilayaSel) {
    wilayaSel.addEventListener('change', () => {
      const w = wilayaSel.value;
      if (communeSel) {
        communeSel.innerHTML = '<option value="">Select commune</option>';
        if (w && wilayasData[w]) {
          wilayasData[w].forEach(c => {
            const opt = document.createElement('option');
            opt.value = c; opt.textContent = c;
            communeSel.appendChild(opt);
          });
        }
      }
      updateShippingPrice();
    });
  }
  document.getElementById('orderType')?.addEventListener('change', updateShippingPrice);
  document.getElementById('orderForm')?.addEventListener('submit', (e) => { e.preventDefault(); submitOrderForm(); });
}

function filterProducts() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const category = document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
  
  allFilteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search);
    const matchCat = category === 'all' || p.category === category;
    return matchSearch && matchCat;
  });
  displayedCount = itemsPerPage;
  loadProducts();
}

// ========== SHIPPING DATA ==========
const wilayasData = {
  "16 - Alger": ["Alger Centre", "Bab El Oued", "Birkhadem", "Kouba", "Hussein Dey"],
  "31 - Oran": ["Oran", "Es Senia", "Bir El Djir", "Arzew"],
  "25 - Constantine": ["Constantine", "El Khroub", "Didouche Mourad"],
  "19 - Sétif": ["Sétif", "El Eulma", "Ain El Kebira"],
  // ... أضف باقي الولايات هنا
};

const baseShipping = { domicile: 600, stopdesk: 400 };
const farShipping = { domicile: 1200, stopdesk: 800 };

function populateShippingTable() {
  const tbody = document.getElementById('coverageTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  Object.keys(wilayasData).sort().forEach(w => {
    const isFar = [1, 8, 11, 30, 33, 37, 49, 53, 54, 56].includes(parseInt(w));
    const prices = isFar ? farShipping : baseShipping;
    const row = document.createElement('tr');
    row.innerHTML = `<td style="padding:14px 16px;">${w}</td>
      <td style="padding:14px 16px; color:var(--secondary); font-weight:600;">${prices.domicile} DA</td>
      <td style="padding:14px 16px; color:var(--secondary); font-weight:600;">${prices.stopdesk} DA</td>`;
    tbody.appendChild(row);
  });
}

function filterShippingTable() {
  const term = (document.getElementById('wilayaSearch')?.value || '').toLowerCase();
  document.querySelectorAll('#coverageTableBody tr').forEach(row => {
    row.style.display = row.cells[0].textContent.toLowerCase().includes(term) ? '' : 'none';
  });
}

function updateShippingPrice() {
  const type = document.getElementById('orderType')?.value;
  const wilaya = document.getElementById('wilaya')?.value;
  const priceEl = document.getElementById('shippingPrice');
  const info = document.getElementById('shippingInfo');
  if (!type || !wilaya || !priceEl) return;

  const isFar = [1, 8, 11, 30, 33, 37, 49, 53, 54, 56].includes(parseInt(wilaya));
  const prices = isFar ? farShipping : baseShipping;
  const shipping = type === 'domicile' ? prices.domicile : prices.stopdesk;
  
  priceEl.textContent = `${shipping} DA`;
  info?.classList.add('active');
  
  const cartTotal = parseFloat(document.getElementById('totalPrice')?.textContent || '0');
  document.getElementById('grandTotal').textContent = `${(cartTotal + shipping).toFixed(2)} DA`;
}

// ========== ORDER SUBMISSION ==========
function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(2,10).replace(/-/g,'');
  let count = localStorage.getItem('ip_order_count') || '0';
  count = String(parseInt(count)+1).padStart(3,'0');
  localStorage.setItem('ip_order_count', count);
  return `IP${date}${count}`;
}

function openOrderForm() {
  const modal = document.getElementById('orderFormModal');
  if (modal) {
    modal.classList.add('active');
    // Populate wilayas
    const sel = document.getElementById('wilaya');
    if (sel) {
      sel.innerHTML = '<option value="">Select wilaya</option>';
      Object.keys(wilayasData).forEach(w => {
        const opt = document.createElement('option');
        opt.value = w; opt.textContent = w;
        sel.appendChild(opt);
      });
    }
  }
}

async function submitOrderForm() {
  const form = document.getElementById('orderForm');
  const orderType = form?.orderType?.value;
  const wilaya = form?.wilaya?.value;
  const commune = form?.commune?.value;

  if (!orderType || !wilaya || !commune || !cart.length) {
    showNotification('Please fill all required fields', 'error');
    return;
  }

  const isFar = [1, 8, 11, 30, 33, 37, 49, 53, 54, 56].includes(parseInt(wilaya));
  const prices = isFar ? farShipping : baseShipping;
  const shipping = orderType === 'domicile' ? prices.domicile : prices.stopdesk;
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const orderNumber = generateOrderNumber();

  const order = {
    orderNumber,
    status: 'pending',
    orderType,
    customer: {
      firstName: form.firstName?.value.trim(),
      lastName: form.lastName?.value.trim(),
      phone1: form.phone1?.value.trim(),
      phone2: form.phone2?.value.trim() || null,
      wilaya, commune
    },
    items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, total: i.price * i.quantity })),
    totals: { subtotal: cartTotal, shipping, grandTotal: cartTotal + shipping },
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "commandes"), order);
    
    // Update stock
    for (const item of cart) {
      const ref = doc(db, "produits", item.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const newQty = (snap.data().quantity || 0) - item.quantity;
        await updateDoc(ref, { quantity: Math.max(0, newQty) });
      }
    }

    // Show success
    document.getElementById('orderFormModal')?.classList.remove('active');
    document.getElementById('orderNumber').textContent = orderNumber;
    document.getElementById('confirmModal')?.classList.add('active');
    
    // Clear cart
    cart = [];
    saveCartToStorage();
    updateCartCount();
    form?.reset();
    loadProductsFromFirebase();
    
    showNotification('Order confirmed! 🎉', 'success');
  } catch (err) {
    console.error(err);
    showNotification('Order failed. Check connection.', 'error');
  }
}

// ========== NOTIFICATIONS ==========
function showNotification(msg, type = 'success') {
  const existing = document.querySelector('.notification-toast');
  if (existing) existing.remove();
  
  const notif = document.createElement('div');
  notif.className = 'notification-toast';
  const bg = type === 'success' ? 'var(--success)' : 'var(--warning)';
  notif.style.cssText = `position:fixed; top:20px; right:20px; background:${bg}; color:white; padding:15px 25px; border-radius:8px; z-index:9999; animation:slideIn 0.3s; font-weight:500;`;
  notif.textContent = msg;
  document.body.appendChild(notif);
  
  setTimeout(() => { notif.style.animation = 'slideOut 0.3s'; setTimeout(() => notif.remove(), 300); }, 3000);
}

// Add animation styles if not exists
if (!document.getElementById('notif-anim')) {
  const style = document.createElement('style');
  style.id = 'notif-anim';
  style.textContent = `@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}`;
  document.head.appendChild(style);
}

// ========== EXPOSE GLOBAL FUNCTIONS ==========
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeCartItem = removeCartItem;
