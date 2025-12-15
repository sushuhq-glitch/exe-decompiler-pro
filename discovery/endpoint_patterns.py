'''Common API Endpoint Patterns'''

# Common API patterns by category
ENDPOINT_PATTERNS = {
    'auth': [
        '/api/auth/login',
        '/api/login',
        '/api/signin',
        '/api/v1/auth/login',
        '/auth/token'
    ],
    'profile': [
        '/api/user/profile',
        '/api/profile',
        '/api/me',
        '/api/user/me',
        '/api/v1/profile'
    ],
    'payment': [
        '/api/payment',
        '/api/payment/methods',
        '/api/billing',
        '/api/wallet',
        '/api/v1/payment'
    ],
    'orders': [
        '/api/orders',
        '/api/user/orders',
        '/api/order/history',
        '/api/v1/orders'
    ],
    'addresses': [
        '/api/addresses',
        '/api/user/addresses',
        '/api/delivery/addresses'
    ]
}

# HTTP methods by endpoint type
METHODS_BY_TYPE = {
    'profile': ['GET', 'PUT', 'PATCH'],
    'payment': ['GET', 'POST', 'DELETE'],
    'orders': ['GET', 'POST'],
    'addresses': ['GET', 'POST', 'PUT', 'DELETE']
}
