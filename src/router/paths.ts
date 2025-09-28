// Padrões de rota 
export const ROUTE_PATTERNS = {
  PROFILE:         '/profile/:nickname',
  CHAT:            '/chat/:receiverId',
};

// Tipagem de parâmetros das rotas
type RouteParams = {
  profile: { nickname: string };
  chat: { receiverId: string };
};

export const PATHS = {
  HOME:            '/',
  LOGIN:           '/login',
  REGISTER:        '/register',
  FORGOT_PASSWORD: '/forgot-password',
  PROFILE_ME:      '/profile/me',
  PROFILE_EDIT:    '/profile/me/edit',
  FRIENDS:         '/friends',
  NOTIFICATIONS:   '/notifications',
  MESSAGES:        '/messages',
  ADMIN_DASHBOARD: '/admin',

  // Funções construtoras para rotas dinâmicas
  PROFILE: (params: RouteParams['profile']) => `/profile/${params.nickname}`,
  CHAT: (params: RouteParams['chat']) => `/chat/${params.receiverId}`,
};