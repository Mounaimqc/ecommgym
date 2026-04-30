// script.js - IronPulse Black & Gold Edition
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

// ========== INLINE SVG PLACEHOLDER (No external dependency) ==========
const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>
    <rect fill='#111111' width='400' height='400'/>
    <rect x='20' y='20' width='360' height='360' fill='#050505' rx='12'/>
    <circle cx='200' cy='140' r='50' fill='#333333'/>
    <rect x='100' y='220' width='200' height='30' rx='15' fill='#333333'/>
    <rect x='130' y='270' width='140' height='20' rx='10' fill='#ffcc00'/>
    <text x='50%' y='350' font-family='Arial, sans-serif' font-size='14' fill='#888888' text-anchor='middle'>IronPulse</text>
  </svg>
`)}`;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function () {
  console.log("⚡ IronPulse Started...");
  saveFilterButtonNames();
  loadProductsFromFirebase();
  setupEventListeners();
  loadCartFromStorage();
  populateShippingTable();

  // Modal Add to Cart Button
  const modalBtn = document.getElementById('modalAddToCartBtn');
  if (modalBtn) {
    modalBtn.addEventListener('click', () => {
      if (currentProductId) {
        addToCart(currentProductId);
        document.getElementById('productDetailModal')?.classList.remove('active');
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

  grid.innerHTML = `<div style="text-align:center; padding:60px; color:var(--primary); grid-column:1/-1;">
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
        dateAdded: data.dateAdded,
        flavors: data.flavors || []
      });
    });

    console.log(`✅ ${products.length} products loaded`);

    if (products.length === 0) {
      grid.innerHTML = `<div style="text-align:center; padding:60px; color:var(--text-light); grid-column:1/-1;">
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
    grid.innerHTML = `<div style="text-align:center; padding:60px; color:#ff4444; grid-column:1/-1;">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem;"></i>
      <p>Error loading products. Check console.</p></div>`;
  }
}

// ========== DISPLAY PRODUCTS ==========
function loadProducts() {
  const grid = document.getElementById('productsGrid');
  const paginationContainer = document.getElementById('paginationContainer');

  if (!allFilteredProducts?.length) {
    grid.innerHTML = `<div style="text-align:center; padding:60px; color:var(--text-light); grid-column:1/-1;">
      <i class="fa-solid fa-search" style="font-size:3rem;"></i><p>No products found.</p></div>`;
    if (paginationContainer) paginationContainer.style.display = 'none';
    return;
  }

  const productsToDisplay = allFilteredProducts.slice(0, displayedCount);
  grid.innerHTML = '';

  productsToDisplay.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Click to open detail page
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.add-to-cart-btn')) {
        window.location.href = `produit.html?id=${product.id}`;
      }
    });

    // Image with error fallback to inline SVG
    const img = document.createElement('img');
    img.src = (product.image?.trim()) ? product.image : PLACEHOLDER_SVG;
    img.alt = product.name;
    img.className = 'product-image';
    img.loading = 'lazy';
    img.onerror = function() { 
      this.src = PLACEHOLDER_SVG; 
      this.style.objectFit = 'contain';
    };

    const quantity = product.quantity || 0;
    const info = document.createElement('div');
    info.className = 'product-info';
    info.innerHTML = `
      <h3 class="product-name">${product.name}</h3>
      <p class="product-category">${product.category}</p>
      <p class="product-description">${truncateDescription(product.description, 60)}</p>
      <span class="product-quantity ${quantity <= 0 ? 'out-of-stock' : ''}">
        ${quantity > 0 ? `✓ ${quantity} in stock` : '✗ Out of stock'}
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

  // Add to cart buttons
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.getAttribute('data-product-id'));
    });
  });

  // Pagination visibility
  if (paginationContainer) {
    paginationContainer.style.display = displayedCount < allFilteredProducts.length ? 'block' : 'none';
  }
}

function truncateDescription(desc, max) {
  if (!desc) return '';
  return desc.length <= max ? desc : desc.substring(0, max) + '...';
}

function handleShowMore() {
  displayedCount += itemsPerPage;
  loadProducts();
}

// ========== CART FUNCTIONS ==========
function addToCart(productId, flavorName = null) {
  const product = products.find(p => p.id === productId);
  if (!product) {
    showNotification('Product not found!', 'error');
    return;
  }

  const quantity = product.quantity || 0;
  if (quantity <= 0) {
    showNotification('Out of stock!', 'error');
    return;
  }

  // Unique cart item ID (with flavor if exists)
  const cartItemId = flavorName ? `${productId}_${flavorName}` : productId;

  const existing = cart.find(i => i.cartItemId === cartItemId);
  if (existing) {
    if (existing.quantity >= quantity) {
      showNotification('Max quantity reached!', 'error');
      return;
    }
    existing.quantity++;
  } else {
    cart.push({ 
      ...product, 
      quantity: 1, 
      flavor: flavorName, 
      cartItemId: cartItemId 
    });
  }

  saveCartToStorage();
  updateCartCount();
  showNotification(`${product.name} ${flavorName ? `(${flavorName}) ` : ''}added to cart!`, 'success');
}

function updateCartQuantity(cartItemId, change) {
  const item = cart.find(i => i.cartItemId === cartItemId);
  if (!item) return;
  
  item.quantity += change;
  if (item.quantity <= 0) {
    removeCartItem(cartItemId);
  } else {
    const product = products.find(p => p.id === item.id);
    const maxQty = product?.quantity || 0;
    if (item.quantity > maxQty) {
      item.quantity = maxQty;
      showNotification('Max quantity reached!', 'error');
    }
    saveCartToStorage();
    displayCart();
  }
}

function removeCartItem(cartItemId) {
  cart = cart.filter(i => i.cartItemId !== cartItemId);
  saveCartToStorage();
  updateCartCount();
  displayCart();
}

function displayCart() {
  const cartItems = document.getElementById('cartItems');
  if (!cartItems) return;

  let total = 0;
  
  if (!cart.length) {
    cartItems.innerHTML = `<p style="text-align:center; color:var(--text-light); padding:40px 0;">Your cart is empty</p>`;
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
        <div class="cart-item-name">${item.name} ${item.flavor ? `<span style="font-size:0.75rem;color:var(--primary);">(${item.flavor})</span>` : ''}</div>
        <div class="cart-item-price">${item.price.toFixed(2)} DA × ${item.quantity} = ${itemTotal.toFixed(2)} DA</div>
      </div>
      <div class="cart-item-quantity" style="display:flex; align-items:center; gap:8px;">
        <button class="quantity-btn" onclick="window.updateCartQuantity('${item.cartItemId}', -1)">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-btn" onclick="window.updateCartQuantity('${item.cartItemId}', 1)">+</button>
      </div>
      <button class="remove-btn" onclick="window.removeCartItem('${item.cartItemId}')">✕</button>`;
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

function saveCartToStorage() { 
  try { localStorage.setItem('cart', JSON.stringify(cart)); } 
  catch(e) { console.error('Cart save error:', e); }
}

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('cart');
    if (saved) cart = JSON.parse(saved);
    updateCartCount();
  } catch(e) { 
    console.error('Cart load error:', e); 
    cart = []; 
  }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Cart Modal
  const cartBtn = document.getElementById('cartBtn');
  const cartModal = document.getElementById('cartModal');
  if (cartBtn && cartModal) {
    cartBtn.addEventListener('click', () => { 
      cartModal.classList.add('active'); 
      displayCart(); 
    });
  }

  // Close Modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('active');
    });
  });
  
  // Close on outside click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }
  });

  // Checkout Button
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cart.length) { 
      cartModal?.classList.remove('active'); 
      openOrderForm(); 
    }
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

  // Show More Button
  document.getElementById('showMoreBtn')?.addEventListener('click', handleShowMore);

  // Wilaya Search (Coverage Table)
  document.getElementById('wilayaSearch')?.addEventListener('input', filterShippingTable);

  // Order Form: Wilaya -> Commune
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
            opt.value = c; 
            opt.textContent = c;
            communeSel.appendChild(opt);
          });
        }
      }
      updateShippingPrice();
    });
  }
  
  // Order Type -> Shipping Price
  document.getElementById('orderType')?.addEventListener('change', updateShippingPrice);
  
  // Order Form Submit
  document.getElementById('orderForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitOrderForm();
  });
}

function filterProducts() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const category = document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
  
  allFilteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search) || 
                        p.description?.toLowerCase().includes(search);
    const matchCat = category === 'all' || p.category === category;
    return matchSearch && matchCat;
  });
  
  displayedCount = itemsPerPage;
  loadProducts();
}

// ========== SHIPPING DATA ==========
const wilayasData = {
  "16 - Alger": ["Alger Centre", "Bab El Oued", "Birkhadem", "Kouba", "Hussein Dey", "El Biar"],
  "31 - Oran": ["Oran", "Es Senia", "Bir El Djir", "Arzew", "Mers El Kebir"],
  "25 - Constantine": ["Constantine", "El Khroub", "Didouche Mourad", "Hamma Bouziane"],
  "19 - Sétif": ["Sétif", "El Eulma", "Ain El Kebira", "Guidjel"],
  "09 - Blida": ["Blida", "Boufarik", "Bougara", "El Affroun"],
  "15 - Tizi Ouzou": ["Tizi Ouzou", "Draa El Mizan", "Boghni", "Azazga"],
  "06 - Béjaïa": ["Béjaïa", "Akbou", "Chemini", "Seddouk"],
  "35 - Boumerdès": ["Boumerdès", "Bordj Menaiel", "Dellys", "Thénia"],
  // ... Add more wilayas as needed
};

// Base shipping prices (will be overridden by logic below)
let shippingPrices = {};
let stopDeskPrices = {};

function populateShippingTable() {
  const tbody = document.getElementById('coverageTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  Object.keys(wilayasData).sort().forEach(w => {
    // Determine price zone
    const code = parseInt(w);
    let homePrice, pickupPrice;
    
    if ([16, 9, 35, 42].includes(code)) {
      // Near zones
      homePrice = 500; pickupPrice = 300;
    } else if ([31, 25, 19, 6, 15].includes(code)) {
      // Medium zones
      homePrice = 700; pickupPrice = 450;
    } else {
      // Far zones
      homePrice = 1000; pickupPrice = 600;
    }
    
    shippingPrices[w] = homePrice;
    stopDeskPrices[w] = pickupPrice;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="padding:14px 16px;">${w}</td>
      <td style="padding:14px 16px; color:var(--primary); font-weight:600;">${homePrice} DA</td>
      <td style="padding:14px 16px; color:var(--primary); font-weight:600;">${pickupPrice} DA</td>`;
    tbody.appendChild(row);
  });
}

function filterShippingTable() {
  const term = (document.getElementById('wilayaSearch')?.value || '').toLowerCase();
  document.querySelectorAll('#coverageTableBody tr').forEach(row => {
    const wilayaName = row.cells[0]?.textContent.toLowerCase() || '';
    row.style.display = wilayaName.includes(term) ? '' : 'none';
  });
}

function updateShippingPrice() {
  const type = document.getElementById('orderType')?.value;
  const wilaya = document.getElementById('wilaya')?.value;
  const priceEl = document.getElementById('shippingPrice');
  const info = document.getElementById('shippingInfo');
  
  if (!type || !wilaya || !priceEl) return;
  
  const shipping = type === 'domicile' 
    ? (shippingPrices[wilaya] || 700) 
    : (stopDeskPrices[wilaya] || 450);
  
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
  count = String(parseInt(count) + 1).padStart(3, '0');
  localStorage.setItem('ip_order_count', count);
  return `IP${date}${count}`;
}

function openOrderForm() {
  const modal = document.getElementById('orderFormModal');
  if (!modal) return;
  
  modal.classList.add('active');
  
  // Populate wilayas dropdown
  const sel = document.getElementById('wilaya');
  if (sel) {
    sel.innerHTML = '<option value="">Select wilaya</option>';
    Object.keys(wilayasData).forEach(w => {
      const opt = document.createElement('option');
      opt.value = w; 
      opt.textContent = w;
      sel.appendChild(opt);
    });
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

  // Calculate shipping
  const shipping = orderType === 'domicile' 
    ? (shippingPrices[wilaya] || 700) 
    : (stopDeskPrices[wilaya] || 450);
    
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const orderNumber = generateOrderNumber();

  const order = {
    orderNumber,
    status: 'pending',
    orderType,
    customer: {
      firstName: form.firstName?.value.trim() || '',
      lastName: form.lastName?.value.trim() || '',
      phone1: form.phone1?.value.trim() || '',
      phone2: form.phone2?.value.trim() || null,
      wilaya, 
      commune
    },
    items: cart.map(i => ({ 
      id: i.id, 
      name: i.name, 
      flavor: i.flavor || null,
      price: i.price, 
      quantity: i.quantity, 
      total: i.price * i.quantity 
    })),
    totals: { 
      subtotal: cartTotal, 
      shipping, 
      grandTotal: cartTotal + shipping 
    },
    createdAt: new Date().toISOString()
  };

  try {
    // Save order to Firebase
    await addDoc(collection(db, "commandes"), order);
    
    // Update product stock
    for (const item of cart) {
      const ref = doc(db, "produits", item.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const newQty = Math.max(0, (snap.data().quantity || 0) - item.quantity);
        await updateDoc(ref, { quantity: newQty });
      }
    }

    // Show success modal
    document.getElementById('orderFormModal')?.classList.remove('active');
    document.getElementById('orderNumber').textContent = orderNumber;
    document.getElementById('confirmModal')?.classList.add('active');
    
    // Clear cart
    cart = [];
    saveCartToStorage();
    updateCartCount();
    form?.reset();
    
    // Refresh products to update stock display
    loadProductsFromFirebase();
    
    showNotification('Order confirmed! 🎉', 'success');
    
  } catch (err) {
    console.error("Order error:", err);
    showNotification('Order failed. Check connection.', 'error');
  }
}

// ========== NOTIFICATIONS ==========
function showNotification(msg, type = 'success') {
  // Remove existing
  const existing = document.querySelector('.notification-toast');
  if (existing) existing.remove();
  
  const notif = document.createElement('div');
  notif.className = 'notification-toast';
  
  // Colors based on type (using theme variables)
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? '#00c853' : '#ff4444';
  const textColor = '#000'; // Black text for contrast on gold/red
  
  notif.style.cssText = `
    position:fixed; top:20px; right:20px; 
    background:${bgColor}; color:${textColor}; 
    padding:15px 25px; border-radius:8px; 
    z-index:9999; animation:slideIn 0.3s ease-out; 
    font-weight:600; border:2px solid var(--primary);
    box-shadow:0 10px 30px rgba(0,0,0,0.3);
  `;
  notif.textContent = msg;
  document.body.appendChild(notif);
  
  // Auto remove
  setTimeout(() => { 
    notif.style.animation = 'slideOut 0.3s ease-out'; 
    setTimeout(() => notif.remove(), 300); 
  }, 3000);
}

// Add animation keyframes if not exists
if (!document.getElementById('notif-anim-style')) {
  const style = document.createElement('style');
  style.id = 'notif-anim-style';
  style.textContent = `
    @keyframes slideIn { from { transform:translateX(100%); opacity:0 } to { transform:translateX(0); opacity:1 } }
    @keyframes slideOut { from { transform:translateX(0); opacity:1 } to { transform:translateX(100%); opacity:0 } }
  `;
  document.head.appendChild(style);
}

// ========== EXPOSE GLOBAL FUNCTIONS FOR HTML ONCLICK ==========
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeCartItem = removeCartItem;
window.displayCart = displayCart;
