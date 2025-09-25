import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, MessageCircle, User, BookOpen, Menu, X, LogOut, Settings, UserCircle, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useImageLoad } from '../../hooks/useImageLoad';
import { getFriendRequests, subscribeToFriendRequests } from '../../services/firestore';

const navigationItems = [
  // { href: '/', label: 'Início' },
  // { href: '/explorar', label: 'Explorar' },
  // { href: '/colecoes', label: 'Coleções' },
  // { href: '/comunidade', label: 'Comunidade' },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  
  // Verificação para o carregamento do avatar
  const { isLoaded: isAvatarLoaded } = useImageLoad(profile?.photoURL);

  useEffect(() => {
    if (!user?.uid) return;
    
    let unsubscribe: () => void;

    const setupFriendRequestsListener = async () => {
      try {
        // Carrega o contador inicial
        const initialRequests = await getFriendRequests(user.uid);
        setFriendRequestsCount(initialRequests.length);

        // Configura o listener para atualizações em tempo real
        unsubscribe = subscribeToFriendRequests(user.uid, (requests) => {
          setFriendRequestsCount(requests.length);
        });
      } catch (error) {
        console.error('Erro ao configurar listener de solicitações:', error);
      }
    };
    
    setupFriendRequestsListener();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg"> 
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xl font-bold text-emerald-700 font-sans">Estante de Bolso</span>
              <p className="text-xs text-gray-500 hidden sm:block font-sans">Toda literatura na palma da sua mão</p>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-gray-600 hover:text-emerald-600 font-medium transition-colors font-sans"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar livros, autores, editoras ou usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 rounded-full font-sans"
              />
            </div>
          </form>

          {/* Desktop Actions */}
          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild className="relative rounded-full">
                <Link to="/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="relative rounded-full">
                <Link to="/messages">
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="relative rounded-full">
                <Link to="/friends">
                  <Users className="h-5 w-5" />
                  {friendRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {friendRequestsCount > 99 ? '+99' : friendRequestsCount}
                    </span>
                  )}
                </Link>
              </Button>
              
              {/* User Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    {isAvatarLoaded ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.photoURL} alt={profile?.displayName} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 font-sans">
                          {profile?.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center space-x-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.photoURL} alt={profile?.displayName} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-sans">
                        {profile?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        @{profile?.nickname}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile/me" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/edit" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-emerald-600 rounded-full font-sans">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 font-sans">
                <Link to="/register">Cadastrar</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar livros, autores ou usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 rounded-full font-sans"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              {/* Navigation Links */}
              <div className="space-y-2 mb-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="block py-2 px-3 text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors font-sans"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {user ? (
                <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100">
                  {isAvatarLoaded && (
                    <Link
                      to="/profile/me"
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.photoURL} alt={profile?.displayName} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 font-sans">
                          {profile?.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-sans">{profile?.displayName}</span>
                    </Link>
                  )}
                  
                  <Link
                    to="/profile/edit"
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-sans">Configurações</span>
                  </Link>
                  
                  <Link
                    to="/notifications"
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bell className="h-5 w-5" />
                    <span className="font-sans">Notificações</span>
                  </Link>
                  <Link
                    to="/messages"
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="font-sans">Mensagens</span>
                  </Link>
                  <Link
                    to="/friends"
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 relative"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Users className="h-5 w-5" />
                    <span className="font-sans">Amigos</span>
                    {friendRequestsCount > 0 && (
                      <span className="absolute right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {friendRequestsCount > 9 ? '9+' : friendRequestsCount}
                      </span>
                    )}
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 w-full text-left text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-sans">{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100">
                  <Button variant="ghost" asChild className="rounded-full font-sans">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      Entrar
                    </Link>
                  </Button>
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-full font-sans">
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      Cadastrar
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};