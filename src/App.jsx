import { useMemo, useState } from "react";
import { supabase, hasSupabaseSetup } from "./lib/supabase";

const demoRestaurants = {
  solwezi: {
    slug: "solwezi",
    name: "Solwezi Restaurant",
    tagline: "Fresh food. Simple ordering.",
    address: "Solwezi, Zambia",
    menu: [
      {
        id: "chicken-chips",
        name: "Chicken & Chips",
        description: "Grilled chicken served with crispy chips.",
        price: 65,
        is_available: true,
      },
      {
        id: "beef-burger",
        name: "Beef Burger",
        description: "Juicy beef burger with chips.",
        price: 55,
        is_available: true,
      },
      {
        id: "soft-drink",
        name: "Soft Drink",
        description: "Cold 500ml soft drink.",
        price: 15,
        is_available: true,
      },
      {
        id: "samosa-mix",
        name: "Samosa Mix",
        description: "Quick snack pack for hungry customers.",
        price: 25,
        is_available: true,
      },
    ],
  },
  "copper-breeze": {
    slug: "copper-breeze",
    name: "Copper Breeze Café",
    tagline: "Coffee, light bites, and relaxed dining.",
    address: "Mile 6, Solwezi",
    menu: [
      {
        id: "latte",
        name: "Latte",
        description: "Smooth espresso with fresh milk.",
        price: 30,
        is_available: true,
      },
      {
        id: "breakfast-bowl",
        name: "Breakfast Bowl",
        description: "Eggs, toast, avocado and greens.",
        price: 60,
        is_available: true,
      },
      {
        id: "muffin",
        name: "Blueberry Muffin",
        description: "Freshly baked and lightly sweetened.",
        price: 18,
        is_available: true,
      },
    ],
  },
};

const dashboardTabs = ["Overview", "Orders", "Menu", "Reports"];

export default function App() {
  const [view, setView] = useState("menu");
  const [activeTab, setActiveTab] = useState("Overview");
  const [cart, setCart] = useState([]);
  const [notice, setNotice] = useState("");

  const [restaurantSlug] = useState(() => {
    if (typeof window === "undefined") return "solwezi";

    const params = new URLSearchParams(window.location.search);
    const requestedSlug = params.get("restaurant");
    return requestedSlug && demoRestaurants[requestedSlug] ? requestedSlug : "solwezi";
  });

  const restaurant = demoRestaurants[restaurantSlug] || demoRestaurants.solwezi;
  const hasMenu = Array.isArray(restaurant.menu) && restaurant.menu.length > 0;

  const qrMenuUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `https://example.com/?restaurant=${restaurant.slug}`;
    }

    return `${window.location.origin}${window.location.pathname}?restaurant=${restaurant.slug}`;
  }, [restaurant.slug]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrMenuUrl)}`;

  const cartItemsCount = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const addToOrder = (item) => {
    setNotice("");
    setCart((current) => {
      const match = current.find((entry) => entry.id === item.id);
      if (match) {
        return current.map((entry) =>
          entry.id === item.id
            ? { ...entry, quantity: Number(entry.quantity || 1) + 1 }
            : entry
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== itemId) return item;
          const nextQuantity = Number(item.quantity || 1) + delta;
          return nextQuantity > 0 ? { ...item, quantity: nextQuantity } : null;
        })
        .filter(Boolean)
    );
  };

  const removeFromOrder = (itemId) => {
    setCart((current) => current.filter((item) => item.id !== itemId));
  };

  const downloadQr = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${restaurant.slug}-menu-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const printQr = () => {
    window.print();
  };

  async function handlePlaceOrder() {
    if (!cart.length) {
      return;
    }

    const orderPayload = {
      restaurant_name: restaurant.name,
      restaurant_slug: restaurant.slug,
      created_at: new Date().toISOString(),
      order_total: Number(cartTotal || 0),
      item_count: cartItemsCount,
      items: cart
        .map((item) => `${item.name} x${Number(item.quantity || 1)}`)
        .join(", "),
    };

    if (!hasSupabaseSetup || !supabase) {
      setNotice("Order not sent: this menu is in demo mode. The restaurant has not connected its live ordering database yet. Your cart has been kept.");
      return;
    }

    try {
      const { error } = await supabase.from("orders").insert([orderPayload]);
      if (error) throw error;
      setNotice(`Order submitted successfully for ${restaurant.name}.`);
      setCart([]);
    } catch (error) {
      console.error("Order submission failed:", error);
      setNotice(`Order was not sent. Database error: ${error.message || "Unknown error"}. Your cart has been kept.`);
    }
  }

  return (
    <div className="app-shell">
      <header className="page-header">
        <div className="brand">SolweziMenu</div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={() => setView("menu")}>
            Customer Menu
          </button>
          <button type="button" className="primary-button" onClick={() => setView("dashboard")}>
            Restaurant Login
          </button>
        </div>
      </header>

      {view === "menu" ? (
        <main className="content-wrap">
          <section className="hero-panel">
            <p className="eyebrow">DIGITAL MENUS • ONLINE ORDERS</p>
            <h1>{restaurant.name}</h1>
            <p className="hero-text">{restaurant.tagline}</p>

            <div className="cta-row">
              <button type="button" className="primary-button" onClick={() => setView("menu")}>
                View Demo Menu
              </button>
              <button type="button" className="secondary-button" onClick={() => setView("dashboard")}>
                For Restaurant Owners
              </button>
            </div>

            <div className="restaurant-link-box">
              <label htmlFor="restaurant-link">Menu link</label>
              <input id="restaurant-link" readOnly value={qrMenuUrl} />
            </div>
          </section>

          <section className="menu-layout">
            <div className="menu-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow small">WELCOME</span>
                  <h2>{restaurant.name}</h2>
                </div>
                <p>{restaurant.address}</p>
              </div>

              {!hasMenu ? (
                <p className="empty-state">This restaurant has no menu items available right now.</p>
              ) : (
                <div className="menu-grid">
                  {restaurant.menu.map((item) => (
                    <article key={item.id} className="menu-item-card">
                      <div className="menu-item-image">
                        {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>🍽️</span>}
                      </div>

                      <div className="menu-item-copy">
                        <h3>{item.name}</h3>
                        {item.description ? <p>{item.description}</p> : null}

                        <div className="menu-item-meta">
                          <strong>K{Number(item.price || 0).toFixed(2)}</strong>
                          {item.is_available !== false ? (
                            <button type="button" className="add-button" onClick={() => addToOrder(item)}>
                              Add to Order
                            </button>
                          ) : (
                            <span className="unavailable">Currently unavailable</span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="cart-panel">
              <h3>Your Order</h3>

              {cart.length === 0 ? (
                <p className="empty-cart">No items added yet.</p>
              ) : (
                <ul className="cart-list">
                  {cart.map((item) => (
                    <li key={item.id}>
                      <div>
                        <span>{item.name}</span>
                        <small>K{Number(item.price || 0).toFixed(2)} each</small>
                      </div>

                      <div className="quantity-box">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label={`Decrease ${item.name}`}
                        >
                          −
                        </button>
                        <span>{Number(item.quantity || 1)}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label={`Increase ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      <button type="button" className="remove-link" onClick={() => removeFromOrder(item.id)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="cart-summary">
                <span>Items</span>
                <strong>{cartItemsCount}</strong>
              </div>
              <div className="cart-summary total-row">
                <span>Total</span>
                <strong>K{cartTotal.toFixed(2)}</strong>
              </div>

              <button
                type="button"
                className="primary-button order-button"
                disabled={cart.length === 0}
                onClick={handlePlaceOrder}
              >
                Place Order
              </button>

              {notice ? <p className="success-message">{notice}</p> : null}
            </aside>
          </section>

          <section className="qr-panel">
            <div className="qr-image-wrap">
              <img src={qrCodeUrl} alt={`${restaurant.name} QR code menu`} />
            </div>

            <div className="qr-info">
              <p className="eyebrow">QR MENU</p>
              <h3>{restaurant.name}</h3>
              <p>Customers scan this QR code to open the restaurant menu instantly.</p>
              <div className="qr-actions">
                <button type="button" className="primary-button" onClick={downloadQr}>
                  Download QR
                </button>
                <button type="button" className="secondary-button" onClick={printQr}>
                  Print QR
                </button>
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="dashboard-wrap">
          <div className="dashboard-card">
            <div className="dashboard-header">
              <div>
                <p className="eyebrow">OWNER DASHBOARD</p>
                <h2>{restaurant.name}</h2>
              </div>
              <button type="button" className="secondary-button" onClick={() => setView("menu")}>
                Back to menu
              </button>
            </div>

            <div className="dashboard-tabs">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={activeTab === tab ? "tab-button active" : "tab-button"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="dashboard-grid">
              <div className="stat-card">
                <span>Orders today</span>
                <strong>—</strong>
              </div>
              <div className="stat-card">
                <span>Active items</span>
                <strong>{restaurant.menu.length}</strong>
              </div>
              <div className="stat-card">
                <span>Revenue</span>
                <strong>—</strong>
              </div>
            </div>

            <div className="dashboard-panels">
              <div className="panel-card">
                <h3>{activeTab}</h3>
                <p>
                  {activeTab === "Overview"
                    ? "Demo workspace only. Connect a restaurant account and live database before using operational figures."
                    : activeTab === "Orders"
                      ? "No live orders are loaded in this demo workspace."
                      : activeTab === "Menu"
                        ? "Menu editing is not connected in this demo workspace."
                        : "Live reporting is unavailable until real restaurant orders are connected."}
                </p>
              </div>

              <div className="panel-card">
                <h3>Quick actions</h3>
                <ul className="quick-list">
                  <li>Scan QR menu</li>
                  <li>Review orders</li>
                  <li>Update menu items</li>
                  <li>Share restaurant link</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
