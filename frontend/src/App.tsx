import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Product = { id: string; name: string; category: string; description: string; price: number; accent: string }
type Cart = Record<string, number>

const fallbackProducts: Product[] = [
  { id: 'morning-bun', name: 'Cinnamon Morning Bun', category: 'Pastries', description: 'Brown sugar, cinnamon, and orange glaze.', price: 5.5, accent: 'sunrise' },
  { id: 'sourdough', name: 'Country Sourdough', category: 'Breads', description: 'Naturally leavened with a crisp, caramel crust.', price: 8, accent: 'wheat' },
  { id: 'lemon-tart', name: 'Meyer Lemon Tart', category: 'Tarts', description: 'Silky lemon curd with a toasted almond crust.', price: 7.5, accent: 'lemon' },
  { id: 'chocolate-cake', name: 'Dark Chocolate Cake', category: 'Cakes', description: 'Valrhona ganache, espresso, and sea salt.', price: 9, accent: 'cocoa' },
  { id: 'focaccia', name: 'Rosemary Focaccia', category: 'Breads', description: 'Olive oil, rosemary, and flaky salt.', price: 6, accent: 'herb' },
  { id: 'berry-galette', name: 'Seasonal Berry Galette', category: 'Tarts', description: 'Jammy berries folded into a buttery pastry.', price: 8.5, accent: 'berry' },
]
const formatPrice = (price: number) => `$${price.toFixed(2)}`

function App() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [cart, setCart] = useState<Cart>({})
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('')
  useEffect(() => { fetch('http://localhost:8080/api/products').then((response) => response.ok ? response.json() : Promise.reject()).then(setProducts).catch(() => undefined) }, [])
  const categories = ['All', ...new Set(products.map((product) => product.category))]
  const visibleProducts = category === 'All' ? products : products.filter((product) => product.category === category)
  const lineItems = products.filter((product) => cart[product.id]).map((product) => ({ ...product, quantity: cart[product.id] }))
  const subtotal = useMemo(() => lineItems.reduce((total, item) => total + item.price * item.quantity, 0), [lineItems])
  const itemCount = lineItems.reduce((total, item) => total + item.quantity, 0)
  const changeQuantity = (id: string, amount: number) => { setCart((current) => { const nextQuantity = Math.max(0, (current[id] ?? 0) + amount); const next = { ...current }; if (nextQuantity === 0) delete next[id]; else next[id] = nextQuantity; return next }); setStatus('') }
  const checkout = async () => { if (!lineItems.length) return; try { await fetch('http://localhost:8080/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: lineItems.map(({ id, quantity }) => ({ productId: id, quantity })) }) }) } catch { /* receipt remains available offline */ } setStatus('Order ready. Your receipt is below.') }

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="Crumb and Hearth home"><span className="brand-mark">C</span><span>Crumb &amp; Hearth</span></a><div className="topbar-note"><span className="open-dot" /> Open today <strong>7:00 AM - 4:00 PM</strong></div><button className="cart-jump" onClick={() => document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' })}>Your order <span>{itemCount}</span></button></header>
    <section className="intro"><div><p className="eyebrow">Small batch, made daily</p><h1>The good stuff<br /><em>starts here.</em></h1><p className="intro-copy">Thoughtful bakes for slow mornings, shared tables, and the walk home.</p></div><div className="intro-stamp"><span>BAKED</span><strong>with care</strong><span>since 2018</span></div></section>
    <div className="workspace"><section className="catalog" aria-label="Bakery menu"><div className="section-heading"><div><p className="eyebrow">Today's counter</p><h2>Find your favorite</h2></div><span className="item-total">{products.length} fresh picks</span></div><nav className="filters" aria-label="Product categories">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</nav><div className="product-grid">{visibleProducts.map((product) => <article className="product" key={product.id}><div className={`product-art ${product.accent}`}><span>{product.category.slice(0, -1)}</span><b>{product.name.split(' ').map((word) => word[0]).join('')}</b></div><div className="product-info"><div><p className="product-category">{product.category}</p><h3>{product.name}</h3><p className="product-description">{product.description}</p></div><div className="product-buy"><strong>{formatPrice(product.price)}</strong><button className="add-button" onClick={() => changeQuantity(product.id, 1)} aria-label={`Add ${product.name}`}>+</button></div></div></article>)}</div></section>
      <aside className="order-panel" id="order"><div className="order-header"><div><p className="eyebrow">Your basket</p><h2>Ready when you are</h2></div><span className="basket-count">{itemCount} items</span></div>{lineItems.length === 0 ? <div className="empty-order"><div className="empty-icon">+</div><p>Your order is waiting<br />for something lovely.</p><span>Add a bake to get started.</span></div> : <div className="order-lines">{lineItems.map((item) => <div className="order-line" key={item.id}><div><h3>{item.name}</h3><span>{formatPrice(item.price)} each</span></div><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>-</button><b>{item.quantity}</b><button onClick={() => changeQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button></div><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}</div>}<div className="order-footer"><div className="total-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><p className="pickup-note">Pickup is free. We'll have it boxed and ready at the counter.</p><button className="checkout-button" disabled={!lineItems.length} onClick={checkout}>Place order <span>-&gt;</span></button>{status && <div className="receipt"><div><span>ORDER CONFIRMED</span><strong>Thanks for supporting local baking.</strong></div><button onClick={() => window.print()}>Print receipt</button></div>}</div></aside></div>
    <footer><span>CRUMB &amp; HEARTH</span><span>Made with flour, time, and a little patience.</span><span>Portland, OR</span></footer>
  </main>
}
export default App
