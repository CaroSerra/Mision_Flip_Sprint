class OrderSystem {
    constructor() {
        this.currentClient = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.bindEvents();
    }

    ///////////////////////
    //   Autenticación   //
    ///////////////////////
    
    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
    }

    checkAuthentication() {
        const client = localStorage.getItem('currentClient');
        if (client) {
            this.currentClient = client;
            this.showMainScreen();
            this.loadOrders();
        }
    }

    showAuthScreen() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('main-container').classList.add('hidden');
    }

    showMainScreen() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('main-container').classList.remove('hidden');
        document.getElementById('client-name').textContent = this.currentClient;
    }

    ///////////////////////
    //      Login        //
    ///////////////////////

    handleLogin(e) {
        e.preventDefault();
        const clientId = document.getElementById('client-id').value.trim();

        if (clientId) {
            this.currentClient = clientId;
            localStorage.setItem('currentClient', clientId);
            this.showMainScreen();
            this.loadOrders();
            this.showNotification(`¡Bienvenido ${clientId}!`, 'success');
        } else {
            this.showNotification('Por favor ingresa tu nombre', 'error');
        }
    }
    ///////////////////////
    //      Logout       //
    ///////////////////////

    handleLogout() {
        this.currentClient = null;
        localStorage.removeItem('currentClient');
        this.showAuthScreen();
        document.getElementById('login-form').reset();
        this.showNotification('Sesión cerrada correctamente', 'success');
    }

    ///////////////////////
    //     Pedidos       //
    ///////////////////////

    async loadOrders() {
        const ordersContainer = document.getElementById('orders-container');
        ordersContainer.innerHTML = '<div class="loading">Cargando pedidos...</div>';

        try {
            const response = await fetch('https://kr44v8tqe0.execute-api.eu-west-3.amazonaws.com/dev/client');
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const orders = await response.json();
            this.displayOrders(orders);
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            // Por si acaso
            this.showSampleOrders();
        }
    }

    ///////////////////////
    //  Mostrar Pedidos  //
    ///////////////////////

    displayOrders(orders) {
        const ordersContainer = document.getElementById('orders-container');
        
        if (!orders || orders.length === 0) {
            this.showSampleOrders();
            return;
        }

        const clientOrders = orders.filter(order => 
            order.clientName && order.clientName.toLowerCase().includes(this.currentClient.toLowerCase())
        );

        if (clientOrders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="no-orders">
                    No se encontraron pedidos para el cliente: <strong>${this.currentClient}</strong>
                    <br><br>
                    <button onclick="orderSystem.loadOrders()">Reintentar</button>
                </div>
            `;
            return;
        }

        const ordersHTML = clientOrders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">Pedido #${order.id || 'N/A'}</span>
                    <span class="order-status status-${(order.status || 'pending').toLowerCase()}">
                        ${this.getStatusText(order.status)}
                    </span>
                </div>
                
                <div class="order-details">
                    <div class="detail-item">
                        <span class="detail-label">Cliente</span>
                        <span class="detail-value">${order.clientName || 'No especificado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Producto</span>
                        <span class="detail-value">${order.product || 'No especificado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cantidad</span>
                        <span class="detail-value">${order.quantity || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Precio Total</span>
                        <span class="detail-value">$${order.totalPrice || '0.00'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha</span>
                        <span class="detail-value">${order.orderDate || 'No especificada'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Dirección</span>
                        <span class="detail-value">${order.shippingAddress || 'No especificada'}</span>
                    </div>
                </div>
            </div>
        `).join('');

        ordersContainer.innerHTML = ordersHTML;
    }

    showSampleOrders() {
        const ordersContainer = document.getElementById('orders-container');
        
        // Datos de ejemplo basados en el nombre del cliente
        const sampleOrders = [
            {
                id: `ORD-${Date.now()}-001`,
                clientName: this.currentClient,
                product: 'Laptop Gaming Pro',
                quantity: 1,
                totalPrice: '1,299.99',
                orderDate: new Date().toLocaleDateString('es-ES'),
                shippingAddress: `Calle Principal 123, ${this.currentClient} City`,
                status: 'processing'
            },
            {
                id: `ORD-${Date.now()}-002`,
                clientName: this.currentClient,
                product: 'Mouse Inalámbrico',
                quantity: 2,
                totalPrice: '89.99',
                orderDate: new Date(Date.now() - 86400000).toLocaleDateString('es-ES'),
                shippingAddress: `Avenida Central 456, ${this.currentClient} City`,
                status: 'shipped'
            },
            {
                id: `ORD-${Date.now()}-003`,
                clientName: this.currentClient,
                product: 'Teclado Mecánico',
                quantity: 1,
                totalPrice: '149.50',
                orderDate: new Date(Date.now() - 172800000).toLocaleDateString('es-ES'),
                shippingAddress: `Plaza Mayor 789, ${this.currentClient} City`,
                status: 'delivered'
            }
        ];
        
        const ordersHTML = sampleOrders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">Pedido #${order.id}</span>
                    <span class="order-status status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </span>
                </div>
                
                <div class="order-details">
                    <div class="detail-item">
                        <span class="detail-label">Cliente</span>
                        <span class="detail-value">${order.clientName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Producto</span>
                        <span class="detail-value">${order.product}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cantidad</span>
                        <span class="detail-value">${order.quantity}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Precio Total</span>
                        <span class="detail-value">$${order.totalPrice}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha</span>
                        <span class="detail-value">${order.orderDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Dirección</span>
                        <span class="detail-value">${order.shippingAddress}</span>
                    </div>
                </div>
            </div>
        `).join('');

        ordersContainer.innerHTML = ordersHTML;
    }

    ///////////////////////
    //   Estado Pedido   //
    ///////////////////////

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendiente',
            'shipped': 'Enviado',
            'delivered': 'Entregado',
            'processing': 'En Proceso'
        };
        return statusMap[status] || 'Pendiente';
    }

    ///////////////////////
    //   Notificación    //
    ///////////////////////

    showNotification(message, type) {
        // Notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

///////////////////////
//    Iniciar app    //
///////////////////////

document.addEventListener('DOMContentLoaded', () => {
    window.orderSystem = new OrderSystem();
});

///////////////////////
//      Estilos      //
///////////////////////

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);